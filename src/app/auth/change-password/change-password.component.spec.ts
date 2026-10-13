import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangePasswordComponent } from './change-password.component';
import { AuthService } from '../auth.service';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let mockAuth: { changePassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuth = { changePassword: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call changePassword with current and new password and show success', async () => {
    component.currentPassword = 'old-pass';
    component.newPassword = 'new-pass';
    component.confirmPassword = 'new-pass';

    await component.onSubmit();

    expect(mockAuth.changePassword).toHaveBeenCalledWith('old-pass', 'new-pass');
    expect(component.success()).toBe(true);
  });

  it('should reject mismatched passwords', async () => {
    component.newPassword = 'aaaaaa1';
    component.confirmPassword = 'bbbbbb2';

    await component.onSubmit();

    expect(mockAuth.changePassword).not.toHaveBeenCalled();
    expect(component.error()).toBe('Hasła nie są zgodne');
  });

  it('should surface backend error message on 401 (wrong current password)', async () => {
    mockAuth.changePassword.mockRejectedValue(
      new HttpErrorResponse({ status: 401, error: { error: 'Current password is incorrect' } }),
    );
    component.currentPassword = 'wrong';
    component.newPassword = 'new-pass';
    component.confirmPassword = 'new-pass';

    await component.onSubmit();

    expect(component.error()).toBe('Current password is incorrect');
  });
});