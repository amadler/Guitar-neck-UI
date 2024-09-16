import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuitarNeckService } from '../services/guitar-neck.service';
import { NoteService } from '../services/note.service';
import { GuitarNeckComponent } from './guitar-neck.component';
import { FreatboardComponent } from '../freatboard/freatboard.component';
import { By } from '@angular/platform-browser';
import { GuitarNote } from '../shared/model/guitarNote';

fdescribe('GuitarNeckComponent', () => {
  let component: GuitarNeckComponent;
  let fixture: ComponentFixture<GuitarNeckComponent>;
  let guitarNeckService: GuitarNeckService;
  let noteService: NoteService;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuitarNeckComponent],
      providers:[GuitarNeckService, NoteService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuitarNeckComponent);
    component = fixture.componentInstance;
    guitarNeckService = TestBed.inject(GuitarNeckService);
    noteService = TestBed.inject(NoteService);
    component.guitarNotes = [
      { string: 1, fret: 0, note: 'E', selected: false, isRoot: false, isFifth: false, isThird: false, visible: true },
      { string: 2, fret: 1, note: 'F', selected: true, isRoot: true, isFifth: false, isThird: false, visible: true },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize guitarNotes correctly', () => {
    expect(component.guitarNotes.length).toBeGreaterThan(1)
  });

  it('should render FreatboardComponent', () => {
    const freatboardElement = fixture.debugElement.query(By.directive(FreatboardComponent));
    expect(freatboardElement).toBeTruthy()
  });

  it('should call onNoteClicked when a note is clicked in FreatboardComponent', () => {
    spyOn(component, 'onNoteClicked');
    const note: GuitarNote = { string: 1, fret: 0, note: 'E', selected: false, isRoot: false, isFifth: false, isThird: false, visible: true };
    const freatboardElement = fixture.debugElement.query(By.directive(FreatboardComponent));
    const freatboardComponent = freatboardElement.componentInstance;

    freatboardComponent.onNoteClicked$.emit(note);
    fixture.detectChanges();
    expect(component.onNoteClicked).toHaveBeenCalledOnceWith(note);

  });
});
