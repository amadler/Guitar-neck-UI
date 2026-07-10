import { TestBed } from '@angular/core/testing';
import { AppStateService, AppMode } from './app-state.service';

describe('AppStateService', () => {
  let service: AppStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppStateService],
    });
    service = TestBed.inject(AppStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to idle mode', () => {
    expect(service.appMode).toBe('idle');
    service.appMode$.subscribe(mode => {
      expect(mode).toBe('idle');
    });
  });

  describe('setMode', () => {
    it('should set mode to scale', () => {
      service.setMode('scale');
      expect(service.appMode).toBe('scale');
    });

    it('should set mode to scale-chord', () => {
      service.setMode('scale-chord');
      expect(service.appMode).toBe('scale-chord');
    });

    it('should set mode back to idle', () => {
      service.setMode('scale');
      service.setMode('idle');
      expect(service.appMode).toBe('idle');
    });

    it('should emit via appMode$', (done: DoneFn) => {
      service.appMode$.subscribe(mode => {
        if (mode === 'scale') {
          done();
        }
      });
      service.setMode('scale');
    });

    it('should not emit when mode is unchanged', () => {
      let emitCount = 0;
      service.appMode$.subscribe(() => emitCount++);
      service.setMode('idle');
      // Initial emission (1) + idle (no change) — no extra emission
      expect(emitCount).toBe(1);
    });
  });

  describe('switchMode', () => {
    it('should switch mode preserving current state', () => {
      service.setMode('scale');
      service.switchMode('scale-chord');
      expect(service.appMode).toBe('scale-chord');
    });

    it('should not emit when switching to the same mode', () => {
      let emitCount = 0;
      service.appMode$.subscribe(() => emitCount++);
      service.switchMode('idle');
      expect(emitCount).toBe(1);
    });
  });
});
