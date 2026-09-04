import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'guitar-neck-ui-visited';

@Component({
    selector: 'app-header',
    imports: [],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

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
}
