import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../chat/services/chat.service';
import { StorageService } from '../../utils/Storage.util';

@Component({
  selector: 'app-landing-page',
  imports: [FormsModule],
  templateUrl: './landing-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  private router = inject(Router);
  private chatService = inject(ChatService);
  private storage = inject(StorageService);
  apiKey = this.storage.apiKey;
  selectedModel = this.storage.selectedModel;
  saved = this.storage.saved;
  models = this.storage.models;

  saveAndGo(): void {
    const key = this.apiKey().trim();
    const model = this.selectedModel();

    if (!key) return;
    this.storage.saveConfig(key, this.selectedModel());
    // Clear cached agent so next chat uses the new key/model
    this.chatService.resetAgent();

    this.router.navigate(['/app']);
  }

  skipSetup(): void {
    this.router.navigate(['/app']);
  }
}
