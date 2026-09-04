import { Component, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MetronomeEngineService } from './metronome-engine.service';

// ──────────────────────────────────────────────
// Metronome configuration constants
// ──────────────────────────────────────────────
const DEFAULT_BPM = 120;
const DEFAULT_TIME_SIGNATURE = 4;
const TEMPO_MIN = 20;
const TEMPO_MAX = 300;
const SCHEDULING_INTERVAL_MS = 50;
const SCHEDULE_LOOK_AHEAD_SEC = 0.5;
const MAX_TAPS = 6;
const TAP_RESET_MS = 2000;
const MIN_TAP_INTERVAL_MS = 200;

@Component({
    selector: 'app-metronome',
    imports: [FormsModule],
    templateUrl: './metronome.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './metronome.component.scss'
})
export class MetronomeComponent implements OnDestroy {
  bpm = DEFAULT_BPM;
  timeSignature = DEFAULT_TIME_SIGNATURE;
  isRunning = false;
  currentBeat = -1;
  extendedOpen = signal(false);

  timeSignatures = [
    { value: 2, label: '2/4' },
    { value: 3, label: '3/4' },
    { value: 4, label: '4/4' },
    { value: 6, label: '6/8' }
  ];

  tempoRange = { min: TEMPO_MIN, max: TEMPO_MAX };

  private schedulingInterval: ReturnType<typeof setInterval> | null = null;
  private scheduledBeatTimes: number[] = [];
  private tapTimestamps: number[] = [];

  constructor(private engine: MetronomeEngineService) {}

  start(): void {
    this.engine.initAudioContext();
    if (!this.engine.isReady) return;

    this.isRunning = true;
    this.currentBeat = -1;
    this.scheduledBeatTimes = [];

    this.scheduleNextMeasure();

    this.schedulingInterval = setInterval(() => {
      this.checkScheduling();
      this.updateCurrentBeat();
    }, SCHEDULING_INTERVAL_MS);
  }

  stop(): void {
    this.engine.stop();
    this.isRunning = false;
    this.currentBeat = -1;
    this.scheduledBeatTimes = [];

    if (this.schedulingInterval) {
      clearInterval(this.schedulingInterval);
      this.schedulingInterval = null;
    }
  }

  ngOnDestroy(): void {
    if (this.isRunning) {
      this.stop();
    }
  }

  setTempo(value: number): void {
    this.bpm = Math.max(TEMPO_MIN, Math.min(TEMPO_MAX, Math.round(value)));
  }

  toggleExtended(): void {
    this.extendedOpen.update(v => !v);
  }

  selectTimeSignature(value: number): void {
    this.timeSignature = value;
    this.currentBeat = -1;
  }

  tapTempo(): void {
    if (this.isRunning) return;

    const now = Date.now();

    // Reset if gap exceeds threshold (stale tap detection)
    if (this.tapTimestamps.length > 0) {
      const lastTap = this.tapTimestamps[this.tapTimestamps.length - 1];
      if (now - lastTap > TAP_RESET_MS) {
        this.tapTimestamps = [];
      }
    }

    this.tapTimestamps.push(now);

    // Keep only the last N taps
    if (this.tapTimestamps.length > MAX_TAPS) {
      this.tapTimestamps.shift();
    }

    // Need at least 2 taps to compute BPM
    if (this.tapTimestamps.length < 2) return;

    // Compute intervals between consecutive taps
    const intervals: number[] = [];
    for (let i = 1; i < this.tapTimestamps.length; i++) {
      const interval = this.tapTimestamps[i] - this.tapTimestamps[i - 1];
      if (interval >= MIN_TAP_INTERVAL_MS) {
        intervals.push(interval);
      }
    }

    if (intervals.length === 0) return;

    // Average interval in ms, convert to BPM
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const computedBpm = Math.round(60000 / avgInterval);

    // Clamp to valid range
    this.setTempo(computedBpm);
  }

  private scheduleNextMeasure(): void {
    const now = this.engine.currentTime;

    let startTime: number;
    if (this.scheduledBeatTimes.length === 0) {
      startTime = now + SCHEDULE_LOOK_AHEAD_SEC;
    } else {
      const beatInterval = 60 / this.bpm;
      const beatsScheduled = this.scheduledBeatTimes.length;
      startTime = this.scheduledBeatTimes[0] + beatsScheduled * beatInterval;
    }

    const times = this.engine.scheduleMeasure(startTime, this.bpm, this.timeSignature);
    this.scheduledBeatTimes.push(...times);
  }

  private checkScheduling(): void {
    const now = this.engine.currentTime;

    // If no beats scheduled or running low on scheduled beats, schedule more
    if (
      this.scheduledBeatTimes.length === 0 ||
      now >= this.scheduledBeatTimes[this.scheduledBeatTimes.length - 1] - SCHEDULE_LOOK_AHEAD_SEC
    ) {
      this.scheduleNextMeasure();
    }
  }

  private updateCurrentBeat(): void {
    if (this.scheduledBeatTimes.length === 0) {
      this.currentBeat = -1;
      return;
    }

    const now = this.engine.currentTime;

    for (let i = 0; i < this.scheduledBeatTimes.length; i++) {
      const beatTime = this.scheduledBeatTimes[i];
      const nextBeatTime =
        i + 1 < this.scheduledBeatTimes.length
          ? this.scheduledBeatTimes[i + 1]
          : beatTime + 60 / this.bpm;

      if (now >= beatTime && now < nextBeatTime) {
        this.currentBeat = i % this.timeSignature;
        return;
      }
    }

    this.currentBeat = -1;
  }
}
