import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthApiService } from '../services/auth-api.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockApi: {
    changePassword: ReturnType<typeof vi.fn>;
    requestPasswordReset: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockApi = {
      changePassword: vi.fn().mockResolvedValue({ ok: true }),
      requestPasswordReset: vi.fn().mockResolvedValue({ ok: true }),
      resetPassword: vi.fn().mockResolvedValue({ ok: true }),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthApiService, useValue: mockApi },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('changePassword should delegate to the API', async () => {
    await service.changePassword('current-pass', 'new-pass');
    expect(mockApi.changePassword).toHaveBeenCalledWith('current-pass', 'new-pass');
  });

  it('requestPasswordReset should delegate to the API', async () => {
    await service.requestPasswordReset('user@example.com');
    expect(mockApi.requestPasswordReset).toHaveBeenCalledWith('user@example.com');
  });

  it('resetPassword should delegate to the API', async () => {
    await service.resetPassword('token-abc', 'new-pass');
    expect(mockApi.resetPassword).toHaveBeenCalledWith('token-abc', 'new-pass');
  });
});