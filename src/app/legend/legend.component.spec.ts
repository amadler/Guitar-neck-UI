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

  it('should render a "Markers" select with three options', () => {
    const labels = fixture.debugElement.queryAll(By.css('.switch-line'));
    const markersLabel = labels.find(label =>
      label.nativeElement.textContent?.includes('Markers')
    );
    expect(markersLabel).toBeTruthy();
    const select = markersLabel!.query(By.css('select'));
    expect(select).toBeTruthy();
    const options = select!.queryAll(By.css('option'));
    expect(options.length).toBe(3);
    expect(options[0].nativeElement.value).toBe('interval-colors');
    expect(options[1].nativeElement.value).toBe('note-names');
    expect(options[2].nativeElement.value).toBe('neutral-dots');
  });

  it('should default to interval-colors', () => {
    const labels = fixture.debugElement.queryAll(By.css('.switch-line'));
    const markersLabel = labels.find(label =>
      label.nativeElement.textContent?.includes('Markers')
    );
    const select = markersLabel!.query(By.css('select'));
    expect(select!.nativeElement.value).toBe('interval-colors');
  });

  it('should switch display mode when dropdown changes', () => {
    expect(guitarNeckService.markerDisplayMode).toBe('interval-colors');

    const labels = fixture.debugElement.queryAll(By.css('.switch-line'));
    const markersLabel = labels.find(label =>
      label.nativeElement.textContent?.includes('Markers')
    );
    const select = markersLabel!.query(By.css('select'));

    // Switch to note-names
    select!.nativeElement.value = 'note-names';
    select!.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(guitarNeckService.markerDisplayMode).toBe('note-names');

    // Switch to neutral-dots
    select!.nativeElement.value = 'neutral-dots';
    select!.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(guitarNeckService.markerDisplayMode).toBe('neutral-dots');
  });
});
