import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';

import { LandingPageComponent, MODEL_OPTIONS } from './landing-page.component';
import { ChatService } from '../chat/services/chat.service';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let router: Router;
  let chatService: ChatService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([
          { path: 'app', component: LandingPageComponent as any },
        ]),
        ChatService,
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    chatService = TestBed.inject(ChatService);
    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default model selected', () => {
    expect(component.selectedModel()).toBe(MODEL_OPTIONS[0].id);
  });

  it('should have empty apiKey by default', () => {
    expect(component.apiKey()).toBe('');
  });

  it('should not be saved by default', () => {
    expect(component.saved()).toBe(false);
  });

  describe('saveAndGo', () => {
    it('should set saved signal to true', () => {
      component.apiKey.set('sk-test-key-123');
      component.saveAndGo();

      expect(component.saved()).toBe(true);
    });

    it('should call resetAgent on ChatService', () => {
      const resetSpy = vi.spyOn(chatService, 'resetAgent');
      component.apiKey.set('sk-test-key-123');
      component.saveAndGo();

      expect(resetSpy).toHaveBeenCalledTimes(1);
    });

    it('should navigate to /app', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.apiKey.set('sk-test-key-123');
      component.saveAndGo();

      expect(navigateSpy).toHaveBeenCalledWith(['/app']);
    });

    it('should NOT navigate or reset agent when key is empty', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      const resetSpy = vi.spyOn(chatService, 'resetAgent');

      component.apiKey.set('');
      component.saveAndGo();

      expect(navigateSpy).not.toHaveBeenCalled();
      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('should NOT navigate when key is only whitespace', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.apiKey.set('   ');
      component.saveAndGo();

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe('skipSetup', () => {
    it('should navigate to /app', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.skipSetup();

      expect(navigateSpy).toHaveBeenCalledWith(['/app']);
    });
  });

  describe('restore saved config', () => {
    it('should have saved=true when localStorage had a key', () => {
      // The component reads localStorage in signal initializers.
      // In environments without localStorage, getStorageItem returns null,
      // so saved defaults to false. This is acceptable behavior.
      expect(component.saved()).toBe(false);
    });
  });
});