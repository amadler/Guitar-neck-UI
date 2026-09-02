import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownComponent } from './dropdown.component';

describe('DropdownComponent', () => {
  let component: DropdownComponent<string>;
  let fixture: ComponentFixture<DropdownComponent<string>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DropdownComponent<string>);
    component = fixture.componentInstance;
    component.options = ['C', 'C#', 'D'];
    component.selectedValue = 'C';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit valueChange on select', () => {
    spyOn(component.valueChange, 'emit');

    component.select('D');
    expect(component.valueChange.emit).toHaveBeenCalledWith('D');
    expect(component.isOpen()).toBe(false);
  });

  it('should filter options when showFilter is true', () => {
    component.showFilter = true;
    component.isOpen.set(true);
    component.filterText.set('c#');

    const filtered = component.filteredOptions();
    expect(filtered).toEqual(['C#']);
  });

  it('should return all options when filter is empty', () => {
    component.showFilter = true;
    component.filterText.set('');

    const filtered = component.filteredOptions();
    expect(filtered).toEqual(['C', 'C#', 'D']);
  });
});