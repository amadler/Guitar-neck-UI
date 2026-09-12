import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { DomainService } from '../domain/domain.service';

const STORAGE_KEY = 'guitar-neck-ui-visited';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  readonly platformId = inject(PLATFORM_ID);
  readonly domainService = inject(DomainService);
  private readonly location = inject(Location);

  helpModalOpen = false;

  /** True when on the landing page — header shows only the brand. */
  readonly isLanding = signal(true);

  private locationSub: (url: string) => void = () => {};

  ngOnInit(): void {
    // Set initial value based on current URL
    this.isLanding.set(this.isRootUrl(this.location.path()));

    // Listen for URL changes — fires on every navigation
    this.locationSub = this.location.onUrlChange((url) => {
      this.isLanding.set(this.isRootUrl(url));
    });

    // Only open help modal on the app page, not on landing
    if (isPlatformBrowser(this.platformId) && !this.isLanding() && !localStorage.getItem(STORAGE_KEY)) {
      this.helpModalOpen = true;
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }

  ngOnDestroy(): void {
    // Location.onUrlChange cleanup is handled internally
  }

  /** Check if a URL path is the root landing page, ignoring trailing slash and query params. */
  private isRootUrl(url: string): boolean {
    const path = url.split('?')[0].replace(/\/$/, '');
    return path === '' || path === '/';
  }

  toggleHelpModal(): void {
    this.helpModalOpen = !this.helpModalOpen;
  }

  toggleAiMode(): void {
    const enabled = this.domainService.currentState().aiModeEnabled;
    this.domainService.execute({ type: 'set-ai-mode', enabled: !enabled });
  }
}