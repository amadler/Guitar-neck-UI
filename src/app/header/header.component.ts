import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DomainService } from '../domain/domain.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly domainService = inject(DomainService);
  readonly auth = inject(AuthService);

  toggleAiMode(): void {
    const enabled = this.domainService.currentState().aiModeEnabled;
    this.domainService.execute({ type: 'set-ai-mode', enabled: !enabled });
  }
}
