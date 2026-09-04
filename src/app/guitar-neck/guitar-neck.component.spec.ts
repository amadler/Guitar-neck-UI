import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FretboardStateService } from '../services/fretboard-state.service';
import { FretboardNotePositionService } from '../services/note.service';
import { GuitarNeckComponent } from './guitar-neck.component';
import { FreatboardComponent } from '../freatboard/freatboard.component';
import { By } from '@angular/platform-browser';
import { GuitarNote } from '../shared/model/guitarNote';
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
    component.guitarNotes = [
      { string: 1, fret: 0, note: 'E', selected: false, interval: '', visible: true },
      { string: 2, fret: 1, note: 'F', selected: true, interval: 'root', visible: true },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize guitarNotes correctly', () => {
    expect(component.guitarNotes.length).toBeGreaterThan(1);
  });

  it('should render FreatboardComponent', () => {
    const freatboardElement = fixture.debugElement.query(By.directive(FreatboardComponent));
    expect(freatboardElement).toBeTruthy();
  });

  it('should call onNoteClicked when a note is clicked in FreatboardComponent', () => {
    vi.spyOn(component, 'onNoteClicked').mockReturnValue(undefined);
    const note: GuitarNote = { string: 1, fret: 0, note: 'E', selected: false, interval: '', visible: true };
    const freatboardElement = fixture.debugElement.query(By.directive(FreatboardComponent));
    const freatboardComponent = freatboardElement.componentInstance;

    freatboardComponent.onNoteClicked$.emit(note);
    fixture.detectChanges();
    expect(component.onNoteClicked).toHaveBeenCalledTimes(1);
    expect(component.onNoteClicked).toHaveBeenCalledWith(note);

  });
});
