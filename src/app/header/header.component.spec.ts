import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HeaderComponent } from './header.component';
import { DomainService } from '../domain/domain.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let domainService: DomainService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        provideRouter([
          { path: 'app', component: HeaderComponent as any },
        ]),
        DomainService,
      ]
    })
    .compileComponents();

    domainService = TestBed.inject(DomainService);
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleAiMode', () => {
    it('should toggle aiModeEnabled from false to true', () => {
      const executeSpy = vi.spyOn(domainService, 'execute');
      component.toggleAiMode();
      expect(executeSpy).toHaveBeenCalledWith({ type: 'set-ai-mode', enabled: true });
    });

    it('should toggle aiModeEnabled from true to false', () => {
      domainService.execute({ type: 'set-ai-mode', enabled: true });
      const executeSpy = vi.spyOn(domainService, 'execute');
      component.toggleAiMode();
      expect(executeSpy).toHaveBeenCalledWith({ type: 'set-ai-mode', enabled: false });
    });
  });
});