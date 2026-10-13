import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let http: { put: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    http = {
      put: vi.fn().mockReturnValue(of({ ok: true })),
      post: vi.fn().mockReturnValue(of({ ok: true })),
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthApiService,
        { provide: HttpClient, useValue: http },
      ],
    });

    service = TestBed.inject(AuthApiService);
  });

  it('changePassword should PUT /api/auth/password with current and new password', async () => {
    await service.changePassword('old-pass', 'new-pass');

    expect(http.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/password'),
      { currentPassword: 'old-pass', newPassword: 'new-pass' },
    );
  });

  it('requestPasswordReset should POST /api/auth/forgot-password with email', async () => {
    await service.requestPasswordReset('user@example.com');

    expect(http.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/forgot-password'),
      { email: 'user@example.com' },
    );
  });

  it('resetPassword should POST /api/auth/reset-password with token and new password', async () => {
    await service.resetPassword('reset-token-123', 'new-pass');

    expect(http.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/reset-password'),
      { token: 'reset-token-123', newPassword: 'new-pass' },
    );
  });

  it('should resolve ok:true for all password endpoints', async () => {
    await expect(service.changePassword('a', 'b')).resolves.toEqual({ ok: true });
    await expect(service.requestPasswordReset('a@b.c')).resolves.toEqual({ ok: true });
    await expect(service.resetPassword('t', 'p')).resolves.toEqual({ ok: true });
  });
});