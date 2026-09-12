import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, ChangeDetectionStrategy, signal } from '@angular/core';
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

  helpModalOpen = false;

  /** True when on the landing page — header shows only the brand. */
  readonly isLanding = signal(true);

  private routerEventsSub: Subscription | null = null;

  ngOnInit(): void {
    // Set initial value based on current URL (initial navigation already completed)
    this.isLanding.set(this.router.url === '/');

    // Subscribe to subsequent navigations
    this.routerEventsSub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.isLanding.set(e.url === '/');
    });

    if (isPlatformBrowser(this.platformId) && !localStorage.getItem(STORAGE_KEY)) {
      this.helpModalOpen = true;
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
  }

  toggleHelpModal(): void {
    this.helpModalOpen = !this.helpModalOpen;
  }

  toggleAiMode(): void {
    const enabled = this.domainService.currentState().aiModeEnabled;
    this.domainService.execute({ type: 'set-ai-mode', enabled: !enabled });
  }
}