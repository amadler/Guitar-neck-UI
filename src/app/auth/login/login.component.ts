import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected auth = inject(AuthService);

  email = '';
  password = '';
  error = '';
  info = signal('');

  constructor() {
    // Show a success banner when redirected here after changing/resetting the password.
    if (this.route.snapshot.queryParamMap.get('passwordChanged') === '1') {
      this.info.set('Hasło zostało zmienione. Zaloguj się nowym hasłem.');
    }
  }

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