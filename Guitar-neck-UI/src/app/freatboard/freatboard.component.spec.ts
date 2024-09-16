import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FreatboardComponent } from './freatboard.component';
import { GuitarNeckService } from '../services/guitar-neck.service';
import { NoteService } from '../services/note.service';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { StringSelectorComponent } from './string-selector/string-selector.component';

fdescribe('FreatboardComponent', () => {
  let component: FreatboardComponent;
  let fixture: ComponentFixture<FreatboardComponent>;
  let guitarNeckService: GuitarNeckService;
  let noteService: NoteService;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FreatboardComponent],
      providers:[GuitarNeckService, NoteService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreatboardComponent);
    component = fixture.componentInstance;
    guitarNeckService = TestBed.inject(GuitarNeckService);
    noteService = TestBed.inject(NoteService);
    component.notes = [
      { string: 1, fret: 0, note: 'E', selected: false, isRoot: false, isFifth: false, isThird: false, visible: true },
      { string: 2, fret: 1, note: 'F', selected: true, isRoot: true, isFifth: false, isThird: false, visible: true },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize strings and frets correctly', () => {
    expect(component.strings).toEqual(guitarNeckService.strings);
    expect(component.frets).toEqual(guitarNeckService.frets)
  });

  it('should render the correct number of strings', () => {
    const stringsElements = fixture.debugElement.queryAll(By.css('.guitar-neck__string'));
    expect(component.strings.length).toBe(stringsElements.length);
  });

  it('should render the correct number of frets', () => {
    const fretElements = fixture.debugElement.queryAll(By.css('.guitar-neck__fret'));
    expect(component.frets.length * component.strings.length).toBe(fretElements.length);
  });

  it('should emit onNoteClicked$ when a fret is clicked', () => {
    spyOn(component.onNoteClicked$, 'emit');
    const noteOnfret = fixture.debugElement.query(By.css('.guitar-neck__dot')).nativeElement;
    noteOnfret.click();
    fixture.detectChanges();
    expect(component.onNoteClicked$.emit).toHaveBeenCalledOnceWith(jasmine.objectContaining({note:'E'}))
  });

  it('should handle stringSelected$ event from StringSelectorComponent', () => {
    const stringSelectorData = { 0: false, 1: true, 2: true, 3: true, 4: true, 5: true }
    spyOn(noteService.selectedStringsSubject, 'next');
    const stringSelector = fixture.debugElement.query(By.directive(StringSelectorComponent)).componentInstance;
    stringSelector.stringSelected$.emit(stringSelectorData);
    fixture.detectChanges();
    expect(noteService.selectedStringsSubject.next).toHaveBeenCalledOnceWith(stringSelectorData);
  });
});
