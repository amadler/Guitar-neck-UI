import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreatboardComponent } from './freatboard.component';

describe('FreatboardComponent', () => {
  let component: FreatboardComponent;
  let fixture: ComponentFixture<FreatboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FreatboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FreatboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
