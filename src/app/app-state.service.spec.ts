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

  it('should default to scale-or-chord mode', () => {
    expect(service.appMode).toBe('scale-or-chord');
    service.appMode$.subscribe(mode => {
      expect(mode).toBe('scale-or-chord');
    });
  });

  describe('setMode', () => {
    it('should set mode to scale-or-chord', () => {
      service.setMode('scale-or-chord');
      expect(service.appMode).toBe('scale-or-chord');
    });

    it('should set mode to scale-chord', () => {
      service.setMode('scale-chord');
      expect(service.appMode).toBe('scale-chord');
    });

    it('should set mode to custom-pattern', () => {
      service.setMode('scale-or-chord');
      service.setMode('custom-pattern');
      expect(service.appMode).toBe('custom-pattern');
    });

    it('should emit via appMode$', (done: DoneFn) => {
      service.appMode$.subscribe(mode => {
        if (mode === 'scale-chord') {
          done();
        }
      });
      service.setMode('scale-chord');
    });

    it('should not emit when mode is unchanged', () => {
      let emitCount = 0;
      service.appMode$.subscribe(() => emitCount++);
      service.setMode('scale-or-chord');
      // Initial emission (1) + scale-or-chord (no change) — no extra emission
      expect(emitCount).toBe(1);
    });
  });

});
