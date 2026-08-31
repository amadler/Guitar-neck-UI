import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RelationshipStripComponent } from './relationship-strip.component';
import { FretboardStateService } from '../services/fretboard-state.service';
import { MarkerRoleService } from '../services/marker-role.service';
import { FretboardNotePositionService } from '../services/note.service';
import { TonalFacadeService } from '../services/tonal-facade.service';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';

describe('RelationshipStripComponent', () => {
  let component: RelationshipStripComponent;
  let fixture: ComponentFixture<RelationshipStripComponent>;
  let fretboardState: FretboardStateService;
  let markerRole: MarkerRoleService;

  const mockScaleChordState = {
    scale: { type: 'scale', name: 'major', rootNote: 'C' } as MusicSelection,
    chord: { type: 'chord', name: 'major', rootNote: 'C' } as MusicSelection,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelationshipStripComponent],
      providers: [
        FretboardStateService,
        MarkerRoleService,
        FretboardNotePositionService,
        TonalFacadeService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RelationshipStripComponent);
    component = fixture.componentInstance;
    fretboardState = TestBed.inject(FretboardStateService);
    markerRole = TestBed.inject(MarkerRoleService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('hasRelation', () => {
    it('should be false when no scale-chord state', () => {
      fretboardState.scaleChordState = null;
      expect(component.hasRelation).toBeFalse();
    });

    it('should be true when scale-chord state has chord', () => {
      fretboardState.scaleChordState = mockScaleChordState as any;
      expect(component.hasRelation).toBeTrue();
    });

    it('should be false when chord is null', () => {
      fretboardState.scaleChordState = { scale: mockScaleChordState.scale, chord: null } as any;
      expect(component.hasRelation).toBeFalse();
    });
  });

  describe('scaleName and scaleRoot', () => {
    it('should return empty when no state', () => {
      fretboardState.scaleChordState = null;
      expect(component.scaleName).toBe('');
      expect(component.scaleRoot).toBe('');
    });

    it('should return scale info when state exists', () => {
      fretboardState.scaleChordState = mockScaleChordState as any;
      expect(component.scaleName).toBe('major');
      expect(component.scaleRoot).toBe('C');
    });
  });

  describe('chordName and chordRoot', () => {
    it('should return empty when chord is null', () => {
      fretboardState.scaleChordState = { scale: mockScaleChordState.scale, chord: null } as any;
      expect(component.chordName).toBe('');
      expect(component.chordRoot).toBe('');
    });

    it('should return chord info when chord exists', () => {
      fretboardState.scaleChordState = mockScaleChordState as any;
      expect(component.chordName).toBe('major');
      expect(component.chordRoot).toBe('C');
    });
  });

  describe('chordTonesInScale', () => {
    it('should return empty array when no relation', () => {
      fretboardState.scaleChordState = null;
      expect(component.chordTonesInScale).toEqual([]);
    });

    it('should compute chord tones that are in the scale — C major chord in C major scale', () => {
      fretboardState.scaleChordState = mockScaleChordState as any;
      // C major chord: C, E, G → all in C major scale
      expect(component.chordTonesInScale).toEqual(['C', 'E', 'G']);
    });

    it('should compute partial overlap — F major chord in C major scale', () => {
      fretboardState.scaleChordState = {
        scale: { type: 'scale', name: 'major', rootNote: 'C' },
        chord: { type: 'chord', name: 'major', rootNote: 'F' },
      } as any;
      // F major chord: F, A, C → all in C major scale
      expect(component.chordTonesInScale).toEqual(['A', 'C', 'F']);
    });
  });

  describe('chordTonesOutsideScale', () => {
    it('should return empty array when no relation', () => {
      fretboardState.scaleChordState = null;
      expect(component.chordTonesOutsideScale).toEqual([]);
    });

    it('should return empty for C major chord in C major scale', () => {
      fretboardState.scaleChordState = mockScaleChordState as any;
      expect(component.chordTonesOutsideScale).toEqual([]);
    });

    it('should detect outside tones for non-diatonic chord', () => {
      fretboardState.scaleChordState = {
        scale: { type: 'scale', name: 'major', rootNote: 'C' },
        chord: { type: 'chord', name: 'diminished', rootNote: 'C' },
      } as any;
      // C diminished = C, D#, F# → D# and F# are not in C major
      const outside = component.chordTonesOutsideScale;
      expect(outside).toContain('D#');
      expect(outside).toContain('F#');
      expect(outside).not.toContain('C');
    });
  });

  it('should render legend items', () => {
    fretboardState.scaleChordState = mockScaleChordState as any;
    fixture.detectChanges();

    const legendDots = fixture.debugElement.queryAll(By.css('[class*="rel-legend__dot"]'));
    expect(legendDots.length).toBeGreaterThan(0);
  });
});
