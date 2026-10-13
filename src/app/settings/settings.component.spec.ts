import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../auth/auth.service';
import { CredentialsApiService } from '../services/credentials-api.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let mockAuth: { changePassword: ReturnType<typeof vi.fn>; user: WritableSignal<null> };
  let mockCredentials: { getOpenRouterStatus: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuth = {
      changePassword: vi.fn().mockResolvedValue(undefined),
      user: signal(null),
    };
    mockCredentials = { getOpenRouterStatus: vi.fn().mockResolvedValue({ configured: false }) };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: CredentialsApiService, useValue: mockCredentials },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call changePassword with current and new password', async () => {
    component.currentPassword = 'old-pass';
    component.newPassword = 'new-pass';
    component.confirmPassword = 'new-pass';

    await component.changePassword();

    expect(mockAuth.changePassword).toHaveBeenCalledWith('old-pass', 'new-pass');
    expect(component.passwordSuccess()).toBe('Hasło zostało zmienione.');
  });

  it('should reject mismatched passwords', async () => {
    component.newPassword = 'aaaaaa1';
    component.confirmPassword = 'bbbbbb2';

    await component.changePassword();

    expect(mockAuth.changePassword).not.toHaveBeenCalled();
    expect(component.passwordError()).toBe('Hasła nie są zgodne');
  });

  it('should surface backend error message on 401 (wrong current password)', async () => {
    mockAuth.changePassword.mockRejectedValue(
      new HttpErrorResponse({ status: 401, error: { error: 'Current password is incorrect' } }),
    );
    component.currentPassword = 'wrong';
    component.newPassword = 'new-pass';
    component.confirmPassword = 'new-pass';

    await component.changePassword();

    expect(component.passwordError()).toBe('Current password is incorrect');
  });
});