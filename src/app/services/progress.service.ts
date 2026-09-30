import { Injectable, inject } from '@angular/core';
import { ProgressApiService, LessonProgress, ExerciseResult } from './progress-api.service';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private api = inject(ProgressApiService);

  async getAllProgress(): Promise<LessonProgress[]> {
    const res = await this.api.getProgress();
    return res.progress;
  }

  async getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
    try {
      const res = await this.api.getLessonProgress(lessonId);
      return res.progress;
    } catch {
      return null;
    }
  }

  async updateProgress(
    lessonId: string,
    data: { status?: string; currentStep?: number; data?: Record<string, unknown> },
  ): Promise<void> {
    await this.api.updateLessonProgress(lessonId, data);
  }

  async saveExerciseResult(
    lessonId: string,
    exerciseId: string,
    result: Record<string, unknown>,
  ): Promise<void> {
    await this.api.saveExerciseResult(lessonId, exerciseId, result);
  }

  async getExerciseHistory(limit = 50): Promise<ExerciseResult[]> {
    const res = await this.api.getExerciseHistory(limit);
    return res.history;
  }
}