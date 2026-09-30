import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
}