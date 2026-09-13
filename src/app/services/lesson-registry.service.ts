import { Injectable } from '@angular/core';

export interface LessonInfo {
  id: string;
  title: string;
  description: string;
  level: 'podstawowy' | 'średni' | 'zaawansowany';
}

/**
 * LessonRegistryService — hardcoded registry of available lessons.
 *
 * Lessons are authored as Markdown files in lessons/.
 * When switching to RAG, this service becomes the lesson index.
 */
@Injectable({ providedIn: 'root' })
export class LessonRegistryService {
  readonly lessons: LessonInfo[] = [
    {
      id: 'interwaly',
      title: 'Interwały na gryfie',
      description: 'Poznaj podstawowe interwały — root, tercje, kwinty. Zobacz jak skale i akordy zbudowane są z relacji względem prymy.',
      level: 'podstawowy',
    },
  ];

  getLesson(id: string): LessonInfo | undefined {
    return this.lessons.find(l => l.id === id);
  }
}