import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetronomeComponent } from './metronome.component';
import { MetronomeEngineService } from './metronome-engine.service';

describe('MetronomeComponent', () => {
  let component: MetronomeComponent;
  let fixture: ComponentFixture<MetronomeComponent>;
  let mockEngine: jasmine.SpyObj<MetronomeEngineService>;

  beforeEach(async () => {
    mockEngine = jasmine.createSpyObj('MetronomeEngineService', [
      'initAudioContext',
      'scheduleBeat',
      'scheduleMeasure',
      'stop'
    ], {
      isReady: true,
      currentTime: 0
    });
    // scheduleMeasure must return an array, otherwise spreading it crashes
    mockEngine.scheduleMeasure.and.returnValue([]);

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
      expect(component.isRunning).toBeTrue();
    });

    it('should set isRunning to false on stop', () => {
      component.start();
      component.stop();
      expect(component.isRunning).toBeFalse();
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
      // Access private tapTimestamps via component reference
      // Tap tempo works by pushing timestamps and computing intervals
    });

    it('should compute ~120 BPM from 6 taps at 500ms intervals', () => {
      const now = Date.now();
      // Simulate 6 taps at 500ms intervals
      const tapTimes = [0, 500, 1000, 1500, 2000, 2500];

      // Spy on Date.now to return controlled timestamps
      let callIndex = 0;
      spyOn(Date, 'now').and.callFake(() => now + tapTimes[callIndex++]);

      for (let i = 0; i < 6; i++) {
        component.tapTempo();
      }

      // 60000 / 500 = 120 BPM
      expect(component.bpm).toBe(120);
    });

    it('should reset tap array if gap exceeds 2000ms', () => {
      const now = Date.now();
      let callIndex = 0;
      // Tap at 0ms, 500ms (valid pair → BPM=120), then gap to 4000ms (>2000ms → reset),
      // then tap at 5000ms (new pair with 1000ms interval → BPM=60)
      const timestamps = [0, 500, 4000, 5000];
      spyOn(Date, 'now').and.callFake(() => now + timestamps[callIndex++]);

      // Tap 1: 0ms → array = [0], < 2 taps, no BPM change
      component.tapTempo();
      expect(component.bpm).toBe(120); // still default

      // Tap 2: 500ms → array = [0, 500], interval = 500ms → BPM = 120
      component.tapTempo();
      expect(component.bpm).toBe(120); // 60000/500 = 120

      // Tap 3: 4000ms → gap from 500 to 4000 = 3500ms > 2000ms → reset
      // array becomes [4000], < 2 taps, BPM unchanged
      component.tapTempo();
      expect(component.bpm).toBe(120);

      // Tap 4: 5000ms → array = [4000, 5000], interval = 1000ms → BPM = 60
      component.tapTempo();
      expect(component.bpm).toBe(60); // 60000/1000 = 60
    });

    it('should ignore intervals less than 200ms', () => {
      const now = Date.now();
      let callIndex = 0;
      const timestamps = [0, 150, 1200]; // 150ms < 200ms, should be ignored
      spyOn(Date, 'now').and.callFake(() => now + timestamps[callIndex++]);

      component.tapTempo(); // 0
      component.tapTempo(); // 150ms gap - ignored
      // After 2 taps with only 150ms gap, no valid intervals
      // Default BPM is 120
      expect(component.bpm).toBe(120);

      // Third tap at +1200ms from start
      // Valid interval: 1200 - 150 = 1050ms, but 150ms interval was ignored
      // Actually the 150ms tap is kept as timestamp, but interval is ignored
      // Taps array: [0, 150, 1200]
      // Intervals computed: skip 150ms, include 1050ms → BPM = 57
      component.tapTempo(); // 1200
      // Valid intervals: 1200-150=1050 → 60000/1050 ≈ 57
      expect(component.bpm).toBe(57);
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop the metronome if running', () => {
      component.start();
      expect(component.isRunning).toBeTrue();

      component.ngOnDestroy();
      expect(component.isRunning).toBeFalse();
      expect(mockEngine.stop).toHaveBeenCalled();
    });

    it('should not call stop if not running', () => {
      component.ngOnDestroy();
      expect(mockEngine.stop).not.toHaveBeenCalled();
    });
  });
});
