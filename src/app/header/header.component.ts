import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { DomainService } from '../domain/domain.service';

const STORAGE_KEY = 'guitar-neck-ui-visited';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  readonly platformId = inject(PLATFORM_ID);
  readonly domainService = inject(DomainService);

  helpModalOpen = false;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && !localStorage.getItem(STORAGE_KEY)) {
      this.helpModalOpen = true;
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }

  toggleHelpModal(): void {
    this.helpModalOpen = !this.helpModalOpen;
  }

  toggleAiMode(): void {
    const enabled = this.domainService.currentState().aiModeEnabled;
    this.domainService.execute({ type: 'set-ai-mode', enabled: !enabled });
  }
}
