import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AgentApiService } from '../services/agent-api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterModule],
  template: `
    <div class="settings-page">
      <div class="settings-card">
        <h2>Ustawienia</h2>

        <!-- User info -->
        <section>
          <h3>Konto</h3>
          @if (auth.user(); as user) {
            <p class="user-info">Zalogowany jako: <strong>{{ user.email }}</strong></p>
          }
        </section>

        <!-- OpenRouter API Key -->
        <section>
          <h3>Klucz OpenRouter</h3>
          <p class="desc">
            Aby korzystać z asystenta AI, potrzebujesz klucza API OpenRouter.
            Klucz jest szyfrowany i przechowywany na serwerze.
          </p>

          @if (keyStatus() === 'loading') {
            <p>Sprawdzanie statusu...</p>
          } @else if (keyStatus() === 'configured') {
            <p class="status ok">✅ Klucz jest skonfigurowany</p>
            <button class="btn btn--danger" (click)="deleteKey()" [disabled]="saving()">
              Usuń klucz
            </button>
          } @else {
            <p class="status missing">❌ Klucz nie jest skonfigurowany</p>

            <form (ngSubmit)="saveKey()">
              <label>
                Klucz API OpenRouter
                <input
                  type="password"
                  [(ngModel)]="apiKey"
                  name="apiKey"
                  placeholder="sk-or-v1-..."
                  required
                />
              </label>
              <button type="submit" class="btn btn--primary" [disabled]="saving() || !apiKey.trim()">
                {{ saving() ? 'Zapisywanie...' : 'Zapisz klucz' }}
              </button>
            </form>
          }

          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          @if (success()) {
            <p class="success">{{ success() }}</p>
          }
        </section>

        <div class="nav-back">
          <a routerLink="/app">← Powrót do aplikacji</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page { display: flex; justify-content: center; padding: 2rem; }
    .settings-card { background: #1e1e2e; padding: 2rem; border-radius: 12px; width: 100%; max-width: 500px; }
    h2 { margin: 0 0 1.5rem; color: #cdd6f4; }
    h3 { margin: 1.5rem 0 0.5rem; color: #cdd6f4; }
    section { margin-bottom: 2rem; }
    .desc { color: #a6adc8; font-size: 0.9rem; margin-bottom: 1rem; }
    .user-info { color: #a6adc8; }
    .status { font-weight: 600; margin-bottom: 1rem; }
    .status.ok { color: #a6e3a1; }
    .status.missing { color: #f38ba8; }
    label { display: block; margin-bottom: 1rem; color: #a6adc8; }
    input { width: 100%; padding: 0.5rem; border: 1px solid #45475a; border-radius: 6px; background: #181825; color: #cdd6f4; margin-top: 0.25rem; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn--primary { background: #89b4fa; color: #1e1e2e; }
    .btn--danger { background: #f38ba8; color: #1e1e2e; }
    .btn:disabled { opacity: 0.5; }
    .error { color: #f38ba8; margin-top: 0.5rem; }
    .success { color: #a6e3a1; margin-top: 0.5rem; }
    .nav-back { margin-top: 2rem; }
    .nav-back a { color: #89b4fa; }
  `],
})
export class SettingsComponent {
  private api = inject(AgentApiService);
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
      const status = await this.api.getOpenRouterStatus();
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
      await this.api.saveOpenRouterKey(this.apiKey);
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
      await this.api.deleteOpenRouterKey();
      this.keyStatus.set('missing');
      this.success.set('Klucz został usunięty.');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Błąd usuwania klucza');
    } finally {
      this.saving.set(false);
    }
  }
}