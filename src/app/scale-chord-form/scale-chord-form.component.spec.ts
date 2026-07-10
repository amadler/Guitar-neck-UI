import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { ScaleChordFormComponent, ScaleChordRelation } from './scale-chord-form.component';
import { MusicPatternApiService } from '../services/scales-and-triads.service';

describe('ScaleChordFormComponent', () => {
  let component: ScaleChordFormComponent;
  let fixture: ComponentFixture<ScaleChordFormComponent>;
  let mockPatternApi: jasmine.SpyObj<MusicPatternApiService>;

  beforeEach(async () => {
    mockPatternApi = jasmine.createSpyObj('MusicPatternApiService', [
      'getAvailableScales',
      'getAvailableTriads',
    ]);
    mockPatternApi.getAvailableScales.and.returnValue(of(['major', 'minor', 'harmonic-minor']));
    mockPatternApi.getAvailableTriads.and.returnValue(of(['major', 'minor', 'diminished']));

    await TestBed.configureTestingModule({
      imports: [ScaleChordFormComponent],
      providers: [
        { provide: MusicPatternApiService, useValue: mockPatternApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScaleChordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load scales and chords on init', () => {
    expect(mockPatternApi.getAvailableScales).toHaveBeenCalled();
    expect(mockPatternApi.getAvailableTriads).toHaveBeenCalled();
    expect(component.scales.length).toBe(3);
    expect(component.chords.length).toBe(3);
  });

  it('should set default selections', () => {
    expect(component.selectedScale).toBe('major');
    expect(component.selectedChord).toBe('major');
    expect(component.selectedScaleKey).toBe('C');
    expect(component.selectedChordKey).toBe('C');
  });

  it('should emit showRelation with correct data', () => {
    spyOn(component.showRelation, 'emit');
    component.selectedScale = 'minor';
    component.selectedScaleKey = 'G';
    component.selectedChord = 'diminished';
    component.selectedChordKey = 'D';

    component.onShow();

    expect(component.showRelation.emit).toHaveBeenCalledWith({
      scaleName: 'minor',
      scaleRoot: 'G',
      chordName: 'diminished',
      chordRoot: 'D',
    } as ScaleChordRelation);
  });

  it('should not emit when selections are empty', () => {
    spyOn(component.showRelation, 'emit');
    component.selectedScale = '';
    component.onShow();
    expect(component.showRelation.emit).not.toHaveBeenCalled();
  });

  it('should render scale dropdown, chord dropdown, and Show button', () => {
    const selects = fixture.debugElement.queryAll(By.css('select'));
    // Expect at least two selects (scale, scale key, chord, chord key) or however the template is structured
    expect(selects.length).toBeGreaterThanOrEqual(2);

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const showBtn = buttons.find(btn =>
      btn.nativeElement.textContent?.toLowerCase().includes('show')
    );
    expect(showBtn).toBeTruthy();
  });

  it('should populate scale and chord keys dropdowns', () => {
    const keys = component.keys;
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toContain('C');
    expect(keys).toContain('G');
  });
});
