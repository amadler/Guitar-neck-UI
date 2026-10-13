import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { CredentialsApiService } from '../services/credentials-api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private credentialsApi = inject(CredentialsApiService);
  protected auth = inject(AuthService);

  apiKey = '';
  keyStatus = signal<'loading' | 'configured' | 'missing'>('loading');
  saving = signal(false);
  error = signal('');
  success = signal('');

  // Change password
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  changingPassword = signal(false);
  passwordError = signal('');
  passwordSuccess = signal('');

  constructor() {
    this.checkStatus();
  }

  private async checkStatus(): Promise<void> {
    try {
      const status = await this.credentialsApi.getOpenRouterStatus();
      this.keyStatus.set(status.configured ? 'configured' : 'missing');
    } catch {
      this.keyStatus.set('missing');
    }
  }

  async saveKey(): Promise<void> {
    this.error.set('');
    this.success.set('');
    this.saving.set(true);

    try {
      await this.credentialsApi.saveOpenRouterKey(this.apiKey);
      this.keyStatus.set('configured');
      this.apiKey = '';
      this.success.set('Klucz został zapisany.');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Błąd zapisu klucza');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteKey(): Promise<void> {
    this.error.set('');
    this.success.set('');
    this.saving.set(true);

    try {
      await this.credentialsApi.deleteOpenRouterKey();
      this.keyStatus.set('missing');
      this.success.set('Klucz został usunięty.');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Błąd usuwania klucza');
    } finally {
      this.saving.set(false);
    }
  }

  async changePassword(): Promise<void> {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('Hasła nie są zgodne');
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordError.set('Nowe hasło musi mieć co najmniej 6 znaków');
      return;
    }

    this.changingPassword.set(true);
    try {
      await this.auth.changePassword(this.currentPassword, this.newPassword);
      this.passwordSuccess.set('Hasło zostało zmienione.');
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401 && typeof err.error === 'object' && err.error !== null && 'error' in err.error) {
        this.passwordError.set(String((err.error as { error: string }).error));
      } else {
        this.passwordError.set(err instanceof Error ? err.message : 'Błąd zmiany hasła');
      }
    } finally {
      this.changingPassword.set(false);
    }
  }
}