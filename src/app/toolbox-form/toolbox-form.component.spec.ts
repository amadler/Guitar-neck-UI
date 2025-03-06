import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ToolboxFormComponent } from './toolbox-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ToolboxSearchQuery } from '../shared/model/musicElements';

describe('ToolboxFormComponent', () => {
  let component: ToolboxFormComponent;
  let fixture: ComponentFixture<ToolboxFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ToolboxFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolboxFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize formGroup with Single note control', () => {
    const mockControls: ToolboxSearchQuery = {
      keys: 'A',
      musicElements: 'Single note'
    };
    expect(component.guitarForm.value).toEqual({
      elementType: 'basic',
      pattern: 'Single note',
      key: 'A'
    });
  });

  it('should render the correct number of options for patterns', () => {
    const options = fixture.debugElement.queryAll(By.css('#pattern option'));
    expect(options.length).toBe(component.availablePatterns.length);
  });

  it('should render the correct number of options for keys', () => {
    const options = fixture.debugElement.queryAll(By.css('#key option'));
    expect(options.length).toBe(component.keys.length);
  });

  it('should emit the correct value when form is submitted', () => {
    spyOn(component.onSubmit$, 'emit');
    component.guitarForm.patchValue({
      elementType: 'basic',
      pattern: 'Single note',
      key: 'A'
    });
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(component.onSubmit$.emit).toHaveBeenCalledOnceWith({
      musicElements: 'Single note',
      keys: 'A'
    });
  });
});
