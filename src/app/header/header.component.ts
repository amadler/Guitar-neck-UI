import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, ChangeDetectionStrategy, signal, ApplicationRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
  private readonly router = inject(Router);
  private readonly appRef = inject(ApplicationRef);

  helpModalOpen = false;

  /** True when on the landing page — header shows only the brand. */
  readonly isLanding = signal(true);

  private routerEventsSub: Subscription | null = null;

  ngOnInit(): void {
    // Set initial value based on current URL (initial navigation already completed)
    this.isLanding.set(this.isRootUrl(this.router.url));

    // Subscribe to subsequent navigations
    this.routerEventsSub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.isLanding.set(this.isRootUrl(e.url));
      // Force full change detection to ensure the header re-renders
      this.appRef.tick();
    });

    // Only open help modal on the app page, not on landing
    if (isPlatformBrowser(this.platformId) && !this.isLanding() && !localStorage.getItem(STORAGE_KEY)) {
      this.helpModalOpen = true;
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
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