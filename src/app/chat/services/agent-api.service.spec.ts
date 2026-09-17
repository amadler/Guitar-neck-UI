import { TestBed } from '@angular/core/testing';
import { AgentApiService, type AgentStreamEvent } from './agent-api.service';
import { DomainService } from '../../domain/domain.service';
import { DEFAULT_DOMAIN_STATE } from '../../domain/state';

describe('AgentApiService', () => {
  let service: AgentApiService;
  let domainService: DomainService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgentApiService);
    domainService = TestBed.inject(DomainService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendMessage', () => {
    let mockFetch: ReturnType<typeof vi.fn>;
    let mockReader: { read: ReturnType<typeof vi.fn>; releaseLock: ReturnType<typeof vi.fn> };
    let mockResponse: { ok: boolean; body: { getReader: ReturnType<typeof vi.fn> }; statusText: string };

    beforeEach(() => {
      mockReader = {
        read: vi.fn(),
        releaseLock: vi.fn(),
      };
      mockResponse = {
        ok: true,
        body: { getReader: () => mockReader },
        statusText: 'OK',
      };
      mockFetch = vi.fn().mockResolvedValue(mockResponse);
      vi.stubGlobal('fetch', mockFetch);
    });

    it('should send a message to the agent API', async () => {
      // Simulate a stream with token events
      mockReader.read
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(
            '{"type":"token","text":"C"}\n{"type":"token","text":"-dur"}\n'
          ),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(
            '{"type":"interrupt","waitingForUser":true}\n{"type":"done"}\n'
          ),
        })
        .mockResolvedValueOnce({ done: true, value: undefined });

      const onToken = vi.fn();
      const onInterrupt = vi.fn();
      const onDone = vi.fn();

      await service.sendMessage(
        'thread-1',
        'pokaż C-dur',
        DEFAULT_DOMAIN_STATE,
        { onToken, onInterrupt, onDone },
      );

      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          threadId: 'thread-1',
          text: 'pokaż C-dur',
          domainState: DEFAULT_DOMAIN_STATE,
        }),
      });

      // Verify callbacks
      expect(onToken).toHaveBeenCalledWith('C');
      expect(onToken).toHaveBeenCalledWith('-dur');
      expect(onInterrupt).toHaveBeenCalled();
      expect(onDone).toHaveBeenCalled();
    });

    it('should execute domain-command events via DomainService', async () => {
      const executeSpy = vi.spyOn(domainService, 'execute');

      mockReader.read
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(
            JSON.stringify({
              type: 'domain-command',
              command: { type: 'show-pattern', patternType: 'scale', patternName: 'major', rootNote: 'C' },
            }) + '\n'
          ),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('{"type":"done"}\n'),
        })
        .mockResolvedValueOnce({ done: true, value: undefined });

      const onDomainCommand = vi.fn();

      await service.sendMessage(
        'thread-1',
        'pokaż C-dur',
        DEFAULT_DOMAIN_STATE,
        { onDomainCommand },
      );

      expect(executeSpy).toHaveBeenCalledWith({
        type: 'show-pattern',
        patternType: 'scale',
        patternName: 'major',
        rootNote: 'C',
      });
      expect(onDomainCommand).toHaveBeenCalled();
    });

    it('should handle HTTP errors', async () => {
      mockResponse.ok = false;
      mockResponse.statusText = 'Not Found';

      const onError = vi.fn();

      await service.sendMessage(
        'thread-1',
        'hello',
        DEFAULT_DOMAIN_STATE,
        { onError },
      );

      expect(onError).toHaveBeenCalledWith('HTTP 200: Not Found');
    });

    it('should handle stream errors', async () => {
      mockReader.read
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('{"type":"error","message":"LLM error"}\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('{"type":"done"}\n'),
        })
        .mockResolvedValueOnce({ done: true, value: undefined });

      const onError = vi.fn();

      await service.sendMessage(
        'thread-1',
        'hello',
        DEFAULT_DOMAIN_STATE,
        { onError },
      );

      expect(onError).toHaveBeenCalledWith('LLM error');
    });

    it('should handle resume type', async () => {
      mockReader.read
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('{"type":"done"}\n'),
        })
        .mockResolvedValueOnce({ done: true, value: undefined });

      await service.sendMessage(
        'thread-1',
        'rozumiem',
        DEFAULT_DOMAIN_STATE,
        {},
        'resume',
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.type).toBe('resume');
    });
  });
});