import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  private auth = inject(AuthService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  sending = signal(false);
  success = signal(false);
  error = signal('');

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.success.set(false);

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Hasła nie są zgodne');
      return;
    }

    if (this.newPassword.length < 6) {
      this.error.set('Nowe hasło musi mieć co najmniej 6 znaków');
      return;
    }

    this.sending.set(true);
    try {
      await this.auth.changePassword(this.currentPassword, this.newPassword);
      this.success.set(true);
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401 && typeof err.error === 'object' && err.error !== null && 'error' in err.error) {
        const msg = String((err.error as { error: string }).error);
        this.error.set(msg === 'Unauthorized' ? 'Sesja wygasła. Zaloguj się ponownie.' : msg);
      } else {
        this.error.set(err instanceof Error ? err.message : 'Błąd zmiany hasła');
      }
    } finally {
      this.sending.set(false);
    }
  }
}