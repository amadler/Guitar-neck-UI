import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { By } from '@angular/platform-browser';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('help modal', () => {
    // ngOnInit opens the modal on first visit (no localStorage key).
    // Close it so tests start from a known closed state.
    beforeEach(() => {
      component.helpModalOpen = false;
      fixture.detectChanges();
    });

    function getHelpButton(): HTMLButtonElement {
      const buttons = fixture.debugElement.queryAll(By.css('.icon-btn'));
      const helpBtn = buttons.find(btn =>
        btn.nativeElement.getAttribute('aria-label') === 'Help'
      );
      return helpBtn!.nativeElement;
    }

    function getOverlay(): HTMLElement | null {
      const el = fixture.debugElement.query(By.css('.help-modal-overlay'));
      return el ? el.nativeElement : null;
    }

    function getCloseButton(): HTMLElement | null {
      const el = fixture.debugElement.query(By.css('.help-modal__close'));
      return el ? el.nativeElement : null;
    }

    it('should be closed by default', () => {
      expect(getOverlay()).toBeNull();
    });

    it('should open when ? button is clicked', () => {
      getHelpButton().click();
      fixture.detectChanges();
      expect(getOverlay()).toBeTruthy();
    });

    it('should close when overlay is clicked', () => {
      getHelpButton().click();
      fixture.detectChanges();
      expect(getOverlay()).toBeTruthy();

      getOverlay()!.click();
      fixture.detectChanges();
      expect(getOverlay()).toBeNull();
    });

    it('should close when ✕ button is clicked', () => {
      getHelpButton().click();
      fixture.detectChanges();
      expect(getOverlay()).toBeTruthy();

      getCloseButton()!.click();
      fixture.detectChanges();
      expect(getOverlay()).toBeNull();
    });
  });
});
