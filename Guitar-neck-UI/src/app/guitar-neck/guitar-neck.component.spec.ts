import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuitarNeckComponent } from './guitar-neck.component';

describe('GuitarNeckComponent', () => {
  let component: GuitarNeckComponent;
  let fixture: ComponentFixture<GuitarNeckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuitarNeckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuitarNeckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
