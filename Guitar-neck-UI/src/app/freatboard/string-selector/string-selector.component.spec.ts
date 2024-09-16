import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringSelectorComponent } from './string-selector.component';
import { By } from '@angular/platform-browser';

describe('StringSelectorComponent', () => {
  let component: StringSelectorComponent;
  let fixture: ComponentFixture<StringSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StringSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StringSelectorComponent);
    component = fixture.componentInstance;
    component.strings = ['E', 'A', 'D', 'G', 'B', 'e']; // Przykładowe dane wejściowe
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize formGroup with correct controls', () => {
    expect(component.formGroup.contains('0')).toBeTrue();
    expect(component.formGroup.contains('1')).toBeTrue();
    expect(component.formGroup.contains('2')).toBeTrue();
    expect(component.formGroup.contains('3')).toBeTrue();
    expect(component.formGroup.contains('4')).toBeTrue();
    expect(component.formGroup.contains('5')).toBeTrue();
  });

  it('should emit the correct value when a checkbox is changed ', () => {
    spyOn(component.stringSelected$, "emit");
    const checkbox = fixture.debugElement.query(By.css('input[type="checkbox"]')).nativeElement;
    checkbox.click();
    fixture.detectChanges();
    expect(component.stringSelected$.emit).toHaveBeenCalledOnceWith(
      {
        0: false,
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
      }
    )
  });
});
