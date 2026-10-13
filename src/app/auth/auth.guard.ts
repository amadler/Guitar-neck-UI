import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Route guard — verifies the HTTP-only session by calling GET /api/me.
 * If the session is missing/expired (401), redirects to /login.
 */
export const authGuard: CanActivateFn = async (): Promise<boolean> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.checkSession();

  if (!auth.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};