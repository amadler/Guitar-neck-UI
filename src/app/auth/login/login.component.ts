import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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