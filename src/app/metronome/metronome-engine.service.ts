import { Injectable } from '@angular/core';

// ──────────────────────────────────────────────
// Engine configuration constants
// ──────────────────────────────────────────────
const ACCENT_DURATION_SEC = 0.05;
const NORMAL_DURATION_SEC = 0.03;
const ACCENT_FILTER_FREQ = 800;
const NORMAL_FILTER_FREQ = 1500;
const NORMAL_FILTER_Q = 1.5;
const SCHEDULE_LOOK_AHEAD_SEC = 0.1;

@Injectable({ providedIn: 'root' })
export class MetronomeEngineService {
  private audioCtx: AudioContext | null = null;
  private scheduledSources: AudioBufferSourceNode[] = [];

  /**
   * Initialize AudioContext (called on user gesture — Start button).
   * Creates a new AudioContext if none exists, or resumes if suspended.
   */
  initAudioContext(): void {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioContext();
      } catch {
        console.warn('Web Audio API is not available in this browser.');
        return;
      }
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {
        console.warn('Failed to resume AudioContext.');
      });
    }
  }

  /**
   * Schedule a single beat at the given time.
   * @param when Absolute time (AudioContext.currentTime) to play the beat
   * @param accent If true, uses a low-pass filtered burst (deeper sound)
   */
  scheduleBeat(when: number, accent: boolean): void {
    if (!this.audioCtx) return;

    const sampleRate = this.audioCtx.sampleRate;
    const duration = accent ? ACCENT_DURATION_SEC : NORMAL_DURATION_SEC;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise with fade-out envelope
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;

    // Create filter
    const filter = this.audioCtx.createBiquadFilter();
    if (accent) {
      filter.type = 'lowpass';
      filter.frequency.value = ACCENT_FILTER_FREQ;
    } else {
      filter.type = 'bandpass';
      filter.frequency.value = NORMAL_FILTER_FREQ;
      filter.Q.value = NORMAL_FILTER_Q;
    }

    // Connect: source -> filter -> destination
    source.connect(filter);
    filter.connect(this.audioCtx.destination);

    // Schedule
    source.start(when);
    source.stop(when + duration);

    // Track for cleanup
    this.scheduledSources.push(source);

    // Clean up reference after playback
    source.onended = () => {
      const idx = this.scheduledSources.indexOf(source);
      if (idx !== -1) {
        this.scheduledSources.splice(idx, 1);
      }
    };
  }

  /**
   * Schedule beats for an entire measure.
   * @returns Array of absolute scheduled times for each beat
   */
  scheduleMeasure(startTime: number, bpm: number, meter: number): number[] {
    const beatInterval = 60 / bpm;
    const times: number[] = [];

    for (let i = 0; i < meter; i++) {
      const beatTime = startTime + i * beatInterval;
      this.scheduleBeat(beatTime, i === 0);
      times.push(beatTime);
    }

    return times;
  }

  /**
   * Cancel all scheduled beats and close AudioContext.
   */
  stop(): void {
    for (const source of this.scheduledSources) {
      try {
        source.stop();
      } catch {
        // Source may have already stopped
      }
    }
    this.scheduledSources = [];

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }

  /**
   * Get the current AudioContext currentTime (for scheduling).
   */
  get currentTime(): number {
    return this.audioCtx?.currentTime ?? 0;
  }

  /**
   * Check if AudioContext is available and running.
   */
  get isReady(): boolean {
    return this.audioCtx !== null && this.audioCtx.state === 'running';
  }
}
