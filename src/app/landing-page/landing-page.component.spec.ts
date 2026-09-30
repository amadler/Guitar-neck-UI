import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { LandingPageComponent } from './landing-page.component';
import { AuthService } from '../auth/auth.service';
import { LessonRegistryService } from '../services/lesson-registry.service';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let router: Router;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [
        provideRouter([
          { path: 'app', component: LandingPageComponent as any },
        ]),
        LessonRegistryService,
        {
          provide: AuthService,
          useValue: {
            user: () => null,
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have lessons from registry', () => {
    expect(component.lessons.length).toBeGreaterThan(0);
  });

  it('goToApp should navigate to /app', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goToApp();
    expect(navigateSpy).toHaveBeenCalledWith(['/app']);
  });

  it('startLesson should navigate to /app with lesson query param', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.startLesson('interwały');
    expect(navigateSpy).toHaveBeenCalledWith(['/app'], { queryParams: { lesson: 'interwały' } });
  });
});