import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let mockAuth: {
    checkSession: ReturnType<typeof vi.fn>;
    isLoggedIn: boolean;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  // CanActivateFn signature requires (route, state) — we pass dummies since the guard ignores them.
  const callGuard = () => authGuard({} as never, {} as never);

  beforeEach(() => {
    mockAuth = {
      checkSession: vi.fn().mockResolvedValue(undefined),
      isLoggedIn: false,
    };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when logged in', async () => {
    mockAuth.isLoggedIn = true;

    const result = await TestBed.runInInjectionContext(() => callGuard());

    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /login when session is missing', async () => {
    mockAuth.isLoggedIn = false;

    const result = await TestBed.runInInjectionContext(() => callGuard());

    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should call checkSession (GET /api/me) before deciding', async () => {
    mockAuth.isLoggedIn = true;

    await TestBed.runInInjectionContext(() => callGuard());

    expect(mockAuth.checkSession).toHaveBeenCalled();
  });
});