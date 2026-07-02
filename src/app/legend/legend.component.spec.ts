import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { LegendComponent } from './legend.component';
import { FretboardStateService } from '../services/guitar-neck.service';

describe('LegendComponent', () => {
  let component: LegendComponent;
  let fixture: ComponentFixture<LegendComponent>;
  let guitarNeckService: FretboardStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LegendComponent);
    component = fixture.componentInstance;
    guitarNeckService = TestBed.inject(FretboardStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render an "Interval colors" checkbox', () => {
    const checkbox = fixture.debugElement.query(
      By.css('.switch-line input[type="checkbox"]')
    );
    // There are multiple checkboxes; find the one next to "Interval colors"
    const labels = fixture.debugElement.queryAll(By.css('.switch-line'));
    const intervalColorsLabel = labels.find(label =>
      label.nativeElement.textContent?.includes('Interval colors')
    );
    expect(intervalColorsLabel).toBeTruthy();
    const input = intervalColorsLabel!.query(By.css('input[type="checkbox"]'));
    expect(input).toBeTruthy();
  });

  it('should be checked by default', () => {
    const labels = fixture.debugElement.queryAll(By.css('.switch-line'));
    const intervalColorsLabel = labels.find(label =>
      label.nativeElement.textContent?.includes('Interval colors')
    );
    const input = intervalColorsLabel!.query(By.css('input[type="checkbox"]'));
    expect(input!.nativeElement.checked).toBeTrue();
  });

  it('should toggle intervalColorsEnabled when checkbox is clicked', () => {
    expect(guitarNeckService.intervalColorsEnabled).toBeTrue();

    const labels = fixture.debugElement.queryAll(By.css('.switch-line'));
    const intervalColorsLabel = labels.find(label =>
      label.nativeElement.textContent?.includes('Interval colors')
    );
    const input = intervalColorsLabel!.query(By.css('input[type="checkbox"]'));

    // Uncheck
    input!.nativeElement.click();
    fixture.detectChanges();
    expect(guitarNeckService.intervalColorsEnabled).toBeFalse();

    // Re-check
    input!.nativeElement.click();
    fixture.detectChanges();
    expect(guitarNeckService.intervalColorsEnabled).toBeTrue();
  });
});
