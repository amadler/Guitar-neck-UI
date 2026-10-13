import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../auth.service';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let mockAuth: { resetPassword: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const createComponent = async (token: string | null) => {
    mockAuth = { resetPassword: vi.fn() };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: (_k: string) => token },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should show form when a token is present', async () => {
    await createComponent('valid-token');
    expect(component.state()).toBe('form');
  });

  it('should show expired state when token is missing', async () => {
    await createComponent(null);
    expect(component.state()).toBe('expired');
  });

  it('should call resetPassword with token and new password, then redirect to login with info', async () => {
    await createComponent('valid-token');
    mockAuth.resetPassword.mockResolvedValue(undefined);
    component.password = 'newpass1';
    component.confirmPassword = 'newpass1';

    await component.onSubmit();

    expect(mockAuth.resetPassword).toHaveBeenCalledWith('valid-token', 'newpass1');
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { passwordChanged: '1' } },
    );
  });

  it('should show expired state on 400 (invalid or expired token)', async () => {
    await createComponent('bad-token');
    mockAuth.resetPassword.mockRejectedValue(
      new HttpErrorResponse({ status: 400, error: { error: 'Invalid or expired token' } }),
    );
    component.password = 'newpass1';
    component.confirmPassword = 'newpass1';

    await component.onSubmit();

    expect(component.state()).toBe('expired');
  });

  it('should reject when passwords do not match', async () => {
    await createComponent('valid-token');
    component.password = 'aaaaaa1';
    component.confirmPassword = 'bbbbbb2';

    await component.onSubmit();

    expect(mockAuth.resetPassword).not.toHaveBeenCalled();
    expect(component.error).toBe('Hasła nie są zgodne');
  });

  it('should navigate to forgot-password for a new link', async () => {
    await createComponent(null);
    component.goToForgotPassword();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/forgot-password']);
  });
});