import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface LessonProgress {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  currentStep: number;
  startedAt?: string;
  completedAt?: string;
  data?: Record<string, unknown>;
}

export interface ExerciseResult {
  lessonId: string;
  exerciseId: string;
  result: Record<string, unknown>;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProgressApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getProgress(): Promise<{ progress: LessonProgress[] }> {
    return firstValueFrom(
      this.http.get<{ progress: LessonProgress[] }>(`${this.baseUrl}/api/progress`)
    );
  }

  getLessonProgress(lessonId: string): Promise<{ progress: LessonProgress }> {
    return firstValueFrom(
      this.http.get<{ progress: LessonProgress }>(`${this.baseUrl}/api/progress/${lessonId}`)
    );
  }

  updateLessonProgress(
    lessonId: string,
    data: { status?: string; currentStep?: number; data?: Record<string, unknown> },
  ): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.baseUrl}/api/progress/${lessonId}`, data)
    );
  }

  saveExerciseResult(
    lessonId: string,
    exerciseId: string,
    result: Record<string, unknown>,
  ): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/api/progress/exercises/result`, { lessonId, exerciseId, result })
    );
  }

  getExerciseHistory(limit = 50): Promise<{ history: ExerciseResult[] }> {
    return firstValueFrom(
      this.http.get<{ history: ExerciseResult[] }>(`${this.baseUrl}/api/progress/exercises/history?limit=${limit}`)
    );
  }
}