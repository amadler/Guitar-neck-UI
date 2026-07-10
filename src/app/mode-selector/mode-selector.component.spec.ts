import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ModeSelectorComponent } from './mode-selector.component';
import { AppStateService } from '../app-state.service';

describe('ModeSelectorComponent', () => {
  let component: ModeSelectorComponent;
  let fixture: ComponentFixture<ModeSelectorComponent>;
  let appState: AppStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeSelectorComponent],
      providers: [AppStateService],
    }).compileComponents();

    fixture = TestBed.createComponent(ModeSelectorComponent);
    component = fixture.componentInstance;
    appState = TestBed.inject(AppStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render two mode selection cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('.mode-selector__card, .mode-card'));
    // Accept either class name
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('should render a Scale button', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const scaleBtn = buttons.find(btn =>
      btn.nativeElement.textContent?.toLowerCase().includes('scale')
    );
    expect(scaleBtn).toBeTruthy();
  });

  it('should render a Scale + Chord button', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const scaleChordBtn = buttons.find(btn =>
      btn.nativeElement.textContent?.toLowerCase().includes('chord')
    );
    expect(scaleChordBtn).toBeTruthy();
  });

  it('should set mode to scale when Scale is clicked', () => {
    spyOn(appState, 'setMode');
    component.selectScale();
    expect(appState.setMode).toHaveBeenCalledWith('scale');
  });

  it('should set mode to scale-chord when Scale + Chord is clicked', () => {
    spyOn(appState, 'setMode');
    component.selectScaleChord();
    expect(appState.setMode).toHaveBeenCalledWith('scale-chord');
  });
});
