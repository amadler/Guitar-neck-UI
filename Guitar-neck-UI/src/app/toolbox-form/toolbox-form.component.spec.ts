import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolboxFormComponent } from './toolbox-form.component';

describe('ToolboxFormComponent', () => {
  let component: ToolboxFormComponent;
  let fixture: ComponentFixture<ToolboxFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolboxFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolboxFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
