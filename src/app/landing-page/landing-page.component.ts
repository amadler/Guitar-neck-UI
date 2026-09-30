import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LessonRegistryService } from '../services/lesson-registry.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-landing-page',
  imports: [FormsModule, RouterModule],
  templateUrl: './landing-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  private router = inject(Router);
  private lessonRegistry = inject(LessonRegistryService);
  protected auth = inject(AuthService);
  lessons = this.lessonRegistry.lessons;


  goToApp(): void {
    this.router.navigate(['/app']);
  }

  goToAppWithAction(action: string): void {
    this.router.navigate(['/app'], { queryParams: { action } });
  }

  startLesson(lessonId: string): void {
    this.router.navigate(['/app'], { queryParams: { lesson: lessonId } });
  }
}
