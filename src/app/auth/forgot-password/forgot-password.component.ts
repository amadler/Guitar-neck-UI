import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);

  email = '';
  sent = false;
  error = '';
  sending = false;

  async onSubmit(): Promise<void> {
    this.error = '';
    this.sending = true;

    try {
      // Backend always returns 200 (no email enumeration) — always show the success message.
      await this.auth.requestPasswordReset(this.email);
      this.sent = true;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Wystąpił błąd. Spróbuj ponownie.';
    } finally {
      this.sending = false;
    }
  }
}