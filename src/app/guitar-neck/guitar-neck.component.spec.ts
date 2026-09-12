import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FretboardStateService } from '../services/fretboard-state.service';
import { FretboardNotePositionService } from '../services/note.service';
import { GuitarNeckComponent } from './guitar-neck.component';
import { FreatboardComponent } from '../freatboard/freatboard.component';
import { By } from '@angular/platform-browser';
import { GuitarNote, createGuitarNote } from '../shared/model/guitarNote';
import { vi } from 'vitest';
describe('GuitarNeckComponent', () => {
  let component: GuitarNeckComponent;
  let fixture: ComponentFixture<GuitarNeckComponent>;
  let guitarNeckService: FretboardStateService;
  let noteService: FretboardNotePositionService;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuitarNeckComponent],
      providers: [FretboardStateService, FretboardNotePositionService]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GuitarNeckComponent);
    component = fixture.componentInstance;
    guitarNeckService = TestBed.inject(FretboardStateService);
    noteService = TestBed.inject(FretboardNotePositionService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the fretboard state service', () => {
    // After construction, the service should have allPositions set
    // and currentSnapshot should be an empty snapshot (fretboard visible, no notes highlighted)
    const snapshot = guitarNeckService.currentSnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.hasActiveResult).toBe(false);
    expect(snapshot!.notes.length).toBeGreaterThan(0);
    // All notes should be visible=false (not highlighted) on init
    expect(snapshot!.notes.every(n => n.visible === false)).toBe(true);
  });

  it('should render FreatboardComponent', () => {
    const freatboardElement = fixture.debugElement.query(By.directive(FreatboardComponent));
    expect(freatboardElement).toBeTruthy();
  });

  it('should call onNoteClicked when a note is clicked in FreatboardComponent', () => {
    vi.spyOn(component, 'onNoteClicked').mockReturnValue(undefined);
    const note: GuitarNote = createGuitarNote(1, 0, 'E');
    const freatboardElement = fixture.debugElement.query(By.directive(FreatboardComponent));
    const freatboardComponent = freatboardElement.componentInstance;

    freatboardComponent.onNoteClicked$.emit(note);
    fixture.detectChanges();
    expect(component.onNoteClicked).toHaveBeenCalledTimes(1);
    expect(component.onNoteClicked).toHaveBeenCalledWith(note);

  });
});