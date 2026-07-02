import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StringToggleComponent } from './string-toggle.component';

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
    spyOn(component.stringToggled, 'emit');
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();
    expect(component.stringToggled.emit).toHaveBeenCalledWith({ stringIndex: 0, active: false });
  });

  it('should reflect active input on checkbox', () => {
    let checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBeTrue();

    component.active = false;
    fixture.detectChanges();
    checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBeFalse();
  });

  it('should disable checkbox when disabled input is true', () => {
    component.disabled = true;
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox.disabled).toBeTrue();
  });
});
