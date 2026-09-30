import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface UserResponse {
  user: { id: string; email: string };
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
}