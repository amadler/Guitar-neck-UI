import { TestBed } from '@angular/core/testing';
import { MetronomeEngineService } from './metronome-engine.service';

describe('MetronomeEngineService', () => {
    let service: MetronomeEngineService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MetronomeEngineService],
        });
        service = TestBed.inject(MetronomeEngineService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should not be ready before initAudioContext', () => {
        expect(service.isReady).toBe(false);
    });

    it('should have currentTime of 0 before init', () => {
        expect(service.currentTime).toBe(0);
    });

    describe('scheduleMeasure', () => {
        it('should return correct number of beat times for 4/4', () => {
            const times = service.scheduleMeasure(0, 120, 4);
            expect(times.length).toBe(4);
            expect(times[0]).toBe(0);
            expect(times[1]).toBe(0.5); // 60/120 = 0.5s per beat
            expect(times[2]).toBe(1.0);
            expect(times[3]).toBe(1.5);
        });

        it('should return correct number of beat times for 3/4', () => {
            const times = service.scheduleMeasure(1, 60, 3);
            expect(times.length).toBe(3);
            expect(times[0]).toBe(1);
            expect(times[1]).toBe(2); // 60/60 = 1s per beat
            expect(times[2]).toBe(3);
        });

        it('should handle different BPM values', () => {
            const times = service.scheduleMeasure(0, 200, 2);
            expect(times.length).toBe(2);
            expect(times[1]).toBeCloseTo(0.3, 1); // 60/200 = 0.3s per beat
        });
    });

    describe('stop', () => {
        it('should not throw when called without init', () => {
            expect(() => service.stop()).not.toThrow();
        });

        it('should clear scheduled sources', () => {
            service.scheduleMeasure(0, 120, 4);
            service.stop();
            // After stop, should be safe to call again
            expect(() => service.stop()).not.toThrow();
        });
    });
});
