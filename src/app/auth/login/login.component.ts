import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Zaloguj się</h2>

        <form (ngSubmit)="onSubmit()">
          <label>
            Email
            <input type="email" [(ngModel)]="email" name="email" required autocomplete="email" />
          </label>

          <label>
            Hasło
            <input type="password" [(ngModel)]="password" name="password" required autocomplete="current-password" />
          </label>

          <button type="submit" [disabled]="auth.loading()">
            {{ auth.loading() ? 'Logowanie...' : 'Zaloguj' }}
          </button>
        </form>

        @if (error) {
          <p class="error">{{ error }}</p>
        }

        <p class="link">
          Nie masz konta? <a routerLink="/register">Zarejestruj się</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
    .auth-card { background: #1e1e2e; padding: 2rem; border-radius: 12px; width: 100%; max-width: 400px; }
    h2 { margin: 0 0 1.5rem; color: #cdd6f4; }
    label { display: block; margin-bottom: 1rem; color: #a6adc8; }
    input { width: 100%; padding: 0.5rem; border: 1px solid #45475a; border-radius: 6px; background: #181825; color: #cdd6f4; margin-top: 0.25rem; }
    button { width: 100%; padding: 0.75rem; background: #89b4fa; color: #1e1e2e; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.5; }
    .error { color: #f38ba8; margin-top: 1rem; }
    .link { margin-top: 1rem; text-align: center; color: #a6adc8; }
    .link a { color: #89b4fa; }
  `],
})
export class LoginComponent {
  private router = inject(Router);
  protected auth = inject(AuthService);

  email = '';
  password = '';
  error = '';

  async onSubmit(): Promise<void> {
    this.error = '';
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/app']);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Błąd logowania';
    }
  }
}