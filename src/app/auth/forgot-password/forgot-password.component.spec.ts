import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../auth.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let mockAuth: { requestPasswordReset: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuth = {
      requestPasswordReset: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call requestPasswordReset with the email on submit', async () => {
    component.email = 'user@example.com';
    await component.onSubmit();

    expect(mockAuth.requestPasswordReset).toHaveBeenCalledWith('user@example.com');
  });

  it('should show success message after submit (no email enumeration)', async () => {
    component.email = 'user@example.com';
    await component.onSubmit();

    expect(component.sent).toBe(true);
  });
});