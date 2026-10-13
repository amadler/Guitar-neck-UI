import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface UserResponse {
  user: { id: string; email: string };
}

export interface OkResponse {
  ok: true;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  register(email: string, password: string): Promise<UserResponse> {
    return firstValueFrom(
      this.http.post<UserResponse>(`${this.baseUrl}/api/auth/register`, { email, password })
    );
  }

  login(email: string, password: string): Promise<UserResponse> {
    return firstValueFrom(
      this.http.post<UserResponse>(`${this.baseUrl}/api/auth/login`, { email, password })
    );
  }

  logout(): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/api/auth/logout`, {})
    );
  }

  async getMe(): Promise<UserResponse | null> {
    try {
      return await firstValueFrom(
        this.http.get<UserResponse>(`${this.baseUrl}/api/me`)
      );
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('401')) return null;
      return null;
    }
  }

  /** Change the logged-in user's password. Requires session. */
  changePassword(currentPassword: string, newPassword: string): Promise<OkResponse> {
    return firstValueFrom(
      this.http.put<OkResponse>(`${this.baseUrl}/api/auth/password`, { currentPassword, newPassword })
    );
  }

  /** Send a password-reset link. Public — always succeeds (no email enumeration). */
  requestPasswordReset(email: string): Promise<OkResponse> {
    return firstValueFrom(
      this.http.post<OkResponse>(`${this.baseUrl}/api/auth/forgot-password`, { email })
    );
  }

  /** Set a new password with a one-time reset token. Public. */
  resetPassword(token: string, newPassword: string): Promise<OkResponse> {
    return firstValueFrom(
      this.http.post<OkResponse>(`${this.baseUrl}/api/auth/reset-password`, { token, newPassword })
    );
  }
}