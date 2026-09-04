import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetronomeComponent } from './metronome.component';
import { MetronomeEngineService } from './metronome-engine.service';

describe('MetronomeComponent', () => {
  let component: MetronomeComponent;
  let fixture: ComponentFixture<MetronomeComponent>;
  let mockEngine: Partial<MockedObject<MetronomeEngineService>>;

  beforeEach(async () => {
    mockEngine = {
      initAudioContext: vi.fn().mockName("MetronomeEngineService.initAudioContext"),
      scheduleBeat: vi.fn().mockName("MetronomeEngineService.scheduleBeat"),
      scheduleMeasure: vi.fn().mockName("MetronomeEngineService.scheduleMeasure"),
      stop: vi.fn().mockName("MetronomeEngineService.stop"),
      isReady: true,
      currentTime: 0
    };
    // scheduleMeasure must return an array, otherwise spreading it crashes
    mockEngine.scheduleMeasure!.mockReturnValue([]);

    await TestBed.configureTestingModule({
      imports: [MetronomeComponent],
      providers: [
        { provide: MetronomeEngineService, useValue: mockEngine }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MetronomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default BPM of 120', () => {
    expect(component.bpm).toBe(120);
  });

  it('should have default time signature of 4', () => {
    expect(component.timeSignature).toBe(4);
  });

  describe('setTempo', () => {
    it('should clamp BPM to minimum of 20', () => {
      component.setTempo(10);
      expect(component.bpm).toBe(20);
    });

    it('should clamp BPM to maximum of 300', () => {
      component.setTempo(500);
      expect(component.bpm).toBe(300);
    });

    it('should allow valid BPM within range', () => {
      component.setTempo(140);
      expect(component.bpm).toBe(140);
    });
  });

  describe('selectTimeSignature', () => {
    it('should update time signature value', () => {
      component.selectTimeSignature(3);
      expect(component.timeSignature).toBe(3);
    });

    it('should reset currentBeat to -1', () => {
      component.currentBeat = 2;
      component.selectTimeSignature(6);
      expect(component.currentBeat).toBe(-1);
    });
  });

  describe('start / stop', () => {
    it('should set isRunning to true on start', () => {
      component.start();
      expect(component.isRunning).toBe(true);
    });

    it('should set isRunning to false on stop', () => {
      component.start();
      component.stop();
      expect(component.isRunning).toBe(false);
    });

    it('should reset currentBeat to -1 on stop', () => {
      component.start();
      component.currentBeat = 3;
      component.stop();
      expect(component.currentBeat).toBe(-1);
    });

    it('should call stop on the engine when stopping', () => {
      component.start();
      component.stop();
      expect(mockEngine.stop).toHaveBeenCalled();
    });
  });

  describe('tapTempo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should compute ~120 BPM from 6 taps at 500ms intervals', () => {
      for (let i = 0; i < 6; i++) {
        component.tapTempo();
        vi.advanceTimersByTime(500);
      }

      // 60000 / 500 = 120 BPM
      expect(component.bpm).toBe(120);
    });

    it('should reset tap array if gap exceeds 2000ms', () => {
      // Tap 1: time 0 → array = [0], < 2 taps, no BPM change
      component.tapTempo();
      expect(component.bpm).toBe(120); // still default

      vi.advanceTimersByTime(500);
      // Tap 2: time 500 → array = [0, 500], interval = 500ms → BPM = 120
      component.tapTempo();
      expect(component.bpm).toBe(120); // 60000/500 = 120

      vi.advanceTimersByTime(3500);
      // Tap 3: time 4000 → gap from 500 to 4000 = 3500ms > 2000ms → reset
      // array becomes [4000], < 2 taps, BPM unchanged
      component.tapTempo();
      expect(component.bpm).toBe(120);

      vi.advanceTimersByTime(1000);
      // Tap 4: time 5000 → array = [4000, 5000], interval = 1000ms → BPM = 60
      component.tapTempo();
      expect(component.bpm).toBe(60); // 60000/1000 = 60
    });

    it('should ignore intervals less than 200ms', () => {
      component.tapTempo(); // time 0
      vi.advanceTimersByTime(150);
      component.tapTempo(); // time 150, interval 150ms < 200ms → ignored
      // After 2 taps with only 150ms gap, no valid intervals
      // Default BPM is 120
      expect(component.bpm).toBe(120);

      vi.advanceTimersByTime(1050);
      // Third tap at time 1200
      // Taps array: [0, 150, 1200]
      // Intervals computed: skip 150ms (too short), include 1050ms → BPM = 57
      component.tapTempo();
      expect(component.bpm).toBe(57); // 60000/1050 ≈ 57
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop the metronome if running', () => {
      component.start();
      expect(component.isRunning).toBe(true);

      component.ngOnDestroy();
      expect(component.isRunning).toBe(false);
      expect(mockEngine.stop).toHaveBeenCalled();
    });

    it('should not call stop if not running', () => {
      component.ngOnDestroy();
      expect(mockEngine.stop).not.toHaveBeenCalled();
    });
  });
});
