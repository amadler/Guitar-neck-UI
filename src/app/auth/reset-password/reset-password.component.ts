import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth.service';

type ResetState = 'form' | 'expired';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  state = signal<ResetState>('form');
  password = '';
  confirmPassword = '';
  error = '';
  sending = false;

  private token = '';

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.token = token;
    // Missing token — nothing to reset (same UI as an invalid/expired link).
    this.state.set(token ? 'form' : 'expired');
  }

  async onSubmit(): Promise<void> {
    this.error = '';

    if (this.password !== this.confirmPassword) {
      this.error = 'Hasła nie są zgodne';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Hasło musi mieć co najmniej 6 znaków';
      return;
    }

    this.sending = true;
    try {
      await this.auth.resetPassword(this.token, this.password);
      // Redirect to login with a success banner (per spec: "sukces → redirect na login z informacją").
      this.router.navigate(['/login'], { queryParams: { passwordChanged: '1' } });
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 400) {
        // "Invalid or expired token" — one-time token already used or past its 1h validity.
        this.state.set('expired');
      } else {
        this.error = err instanceof Error ? err.message : 'Wystąpił błąd. Spróbuj ponownie.';
      }
    } finally {
      this.sending = false;
    }
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}