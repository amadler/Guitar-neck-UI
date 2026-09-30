import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private router = inject(Router);
  protected auth = inject(AuthService);

  email = '';
  password = '';
  confirmPassword = '';
  error = '';

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

    try {
      await this.auth.register(this.email, this.password);
      this.router.navigate(['/app']);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Błąd rejestracji';
    }
  }
}