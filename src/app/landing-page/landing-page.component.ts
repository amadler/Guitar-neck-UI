import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LessonRegistryService } from '../services/lesson-registry.service';

@Component({
  selector: 'app-landing-page',
  imports: [FormsModule],
  templateUrl: './landing-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  private router = inject(Router);
  private lessonRegistry = inject(LessonRegistryService);
  lessons = this.lessonRegistry.lessons;


  goToApp(): void {
    this.router.navigate(['/app']);
  }

  startLesson(lessonId: string): void {
    this.router.navigate(['/app'], { queryParams: { lesson: lessonId } });
  }
}
