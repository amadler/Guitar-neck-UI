import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';
import { FretboardStateService } from '../services/guitar-neck.service';
import { FretboardOrchestrationService } from '../services/music-theory-facade.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { FretboardNotePositionService } from '../services/note.service';
import { FretboardDisplayService } from '../services/fretboard-display.service';
import { FretboardNoteQueryService } from '../services/fretboard-note-query.service';
import { MarkerRoleService } from '../services/marker-role.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;
  let fretboardOrchestration: jasmine.SpyObj<FretboardOrchestrationService>;
  let guitarNeckService: jasmine.SpyObj<FretboardStateService>;
  let patternBuilder: jasmine.SpyObj<PatternBuilderService>;

  beforeEach(async () => {
    const orchestrationSpy = jasmine.createSpyObj('FretboardOrchestrationService', [
      'displayScale',
      'displayChord',
      'displayCustomPattern',
      'displayScaleWithChord',
    ]);
    const neckSpy = jasmine.createSpyObj('FretboardStateService', [
      'clearFretboard',
      'hideAllNotes',
    ]);
    const patternSpy = jasmine.createSpyObj('PatternBuilderService', [
      'setCurrentPattern',
      'setRelatedChord',
      'clearCurrentPattern',
    ]);

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        { provide: FretboardOrchestrationService, useValue: orchestrationSpy },
        { provide: FretboardStateService, useValue: neckSpy },
        { provide: PatternBuilderService, useValue: patternSpy },
        FretboardNotePositionService,
        FretboardDisplayService,
        FretboardNoteQueryService,
        MarkerRoleService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(HomePageComponent, {
      set: { template: '<div></div>', imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fretboardOrchestration = TestBed.inject(FretboardOrchestrationService) as jasmine.SpyObj<FretboardOrchestrationService>;
    guitarNeckService = TestBed.inject(FretboardStateService) as jasmine.SpyObj<FretboardStateService>;
    patternBuilder = TestBed.inject(PatternBuilderService) as jasmine.SpyObj<PatternBuilderService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have displayMode null by default', () => {
    expect(component.displayMode()).toBeNull();
  });

  describe('onToolboxEvent', () => {
    it('should clear fretboard and pattern on any event', () => {
      component.onToolboxEvent({ kind: 'scale', key: 'C', scaleType: 'major' } as any);
      expect(guitarNeckService.clearFretboard).toHaveBeenCalled();
      expect(patternBuilder.clearCurrentPattern).toHaveBeenCalled();
    });

    it('should handle scale command', () => {
      component.onToolboxEvent({ kind: 'scale', key: 'C', scaleType: 'major' } as any);
      expect(fretboardOrchestration.displayScale).toHaveBeenCalledWith('major', 'C');
      expect(patternBuilder.setCurrentPattern).toHaveBeenCalledWith('major', 'C', 'scale');
      expect(component.displayMode()).toBe('legend');
    });

    it('should handle chord command', () => {
      component.onToolboxEvent({ kind: 'chord', key: 'C', chordType: 'major' } as any);
      expect(fretboardOrchestration.displayChord).toHaveBeenCalledWith('major', 'C');
      expect(patternBuilder.setCurrentPattern).toHaveBeenCalledWith('major', 'C', 'chord');
      expect(component.displayMode()).toBe('legend');
    });

    it('should handle interval command', () => {
      component.onToolboxEvent({ kind: 'interval', key: 'C', interval: 'b3' } as any);
      expect(fretboardOrchestration.displayCustomPattern).toHaveBeenCalled();
      expect(component.displayMode()).toBe('legend');
    });

    it('should handle scaleChordRelation command', () => {
      component.onToolboxEvent({
        kind: 'scaleChordRelation',
        scaleKey: 'C',
        scaleType: 'major',
        chordKey: 'C',
        chordType: 'major',
      } as any);
      expect(fretboardOrchestration.displayScaleWithChord).toHaveBeenCalledWith('major', 'C', 'major', 'C');
      expect(patternBuilder.setCurrentPattern).toHaveBeenCalledWith('major', 'C', 'scale');
      expect(patternBuilder.setRelatedChord).toHaveBeenCalledWith('major', 'C');
      expect(component.displayMode()).toBe('relationship');
    });
  });
});