import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FreatboardComponent } from './freatboard.component';
import { FretboardStateService } from '../services/guitar-neck.service';
import { FretboardNotePositionService } from '../services/note.service';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('FreatboardComponent', () => {
  let component: FreatboardComponent;
  let fixture: ComponentFixture<FreatboardComponent>;
  let guitarNeckService: FretboardStateService;
  let noteService: FretboardNotePositionService;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FreatboardComponent],
      providers:[FretboardStateService, FretboardNotePositionService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreatboardComponent);
    component = fixture.componentInstance;
    guitarNeckService = TestBed.inject(FretboardStateService);
    noteService = TestBed.inject(FretboardNotePositionService);
    component.notes = [
      { string: 1, fret: 0, note: 'E', selected: false, interval: '', visible: true },
      { string: 2, fret: 1, note: 'F', selected: true, interval: 'root', visible: true },
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
});
