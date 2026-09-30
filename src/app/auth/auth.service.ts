import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AgentApiService } from '../services/agent-api.service';

export interface User {
  id: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(AgentApiService);
  private router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly loading = signal(false);

  get isLoggedIn(): boolean {
    return this.user() !== null;
  }

  async checkSession(): Promise<void> {
    try {
      const res = await this.api.getMe();
      this.user.set(res?.user ?? null);
    } catch {
      this.user.set(null);
    }
  }

  async register(email: string, password: string): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.register(email, password);
      this.user.set(res.user);
    } finally {
      this.loading.set(false);
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.login(email, password);
      this.user.set(res.user);
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.api.logout();
    this.user.set(null);
    this.router.navigate(['/']);
  }
}