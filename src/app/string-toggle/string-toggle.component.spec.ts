import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StringToggleComponent } from './string-toggle.component';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('StringToggleComponent', () => {
  let component: StringToggleComponent;
  let fixture: ComponentFixture<StringToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StringToggleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StringToggleComponent);
    component = fixture.componentInstance;

    component.stringName = 'E';
    component.stringIndex = 0;
    component.active = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit stringToggled when checkbox is clicked', () => {
    vi.spyOn(component.stringToggled, 'emit').mockReturnValue(undefined);
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();
    expect(component.stringToggled.emit).toHaveBeenCalledWith({ stringIndex: 0, active: false });
  });

  it('should reflect active input on checkbox', () => {
    let checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(true);
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);
  });

  it('should disable checkbox when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox.disabled).toBe(true);
  });
});
