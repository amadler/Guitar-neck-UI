import { Component } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  helpModalOpen = false;

  toggleHelpModal(): void {
    this.helpModalOpen = !this.helpModalOpen;
  }
}
