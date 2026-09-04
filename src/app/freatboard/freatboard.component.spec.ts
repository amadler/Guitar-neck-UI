import { beforeEach, describe, expect, it, vi, type MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FreatboardComponent } from './freatboard.component';
import { FretboardStateService } from '../services/fretboard-state.service';
import { FretboardNoteQueryService } from '../services/fretboard-note-query.service';
import { FretboardDisplayService } from '../services/fretboard-display.service';
import { FretboardNotePositionService } from '../services/note.service';
import { DomainService } from '../domain/domain.service';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { neckConfig } from 'guitar-neck-shared';
import { signal } from '@angular/core';

describe('FreatboardComponent', () => {
  let component: FreatboardComponent;
  let fixture: ComponentFixture<FreatboardComponent>;
  let guitarNeckService: FretboardStateService;
  let noteService: FretboardNotePositionService;
  let domainService: Partial<MockedObject<DomainService>>;
  let mockState: any;

  beforeEach(async () => {
    mockState = {
      fretRange: { min: 0, max: 24 },
      enabledStrings: [true, true, true, true, true, true],
      markerDisplayMode: 'interval-colors',
    };

    domainService = {
      execute: vi.fn().mockName("DomainService.execute"),
      currentState: signal(mockState) as any
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FreatboardComponent],
      providers: [
        FretboardStateService,
        FretboardNotePositionService,
        FretboardDisplayService,
        FretboardNoteQueryService,
        { provide: DomainService, useValue: domainService },
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FreatboardComponent);
    component = fixture.componentInstance;
    guitarNeckService = TestBed.inject(FretboardStateService);
    noteService = TestBed.inject(FretboardNotePositionService);
    fixture.componentRef.setInput('notes', [
      { string: 1, fret: 0, note: 'E', selected: false, interval: '', visible: true },
      { string: 2, fret: 1, note: 'F', selected: true, interval: 'root', visible: true },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize strings and frets correctly', () => {
    expect(component.strings).toEqual(neckConfig.stringNotes);
    expect(component.frets).toEqual(Array.from({ length: neckConfig.numberOfFrets }, (_, i) => i + 1));
  });

  it('should render the correct number of strings', () => {
    const stringsElements = fixture.debugElement.queryAll(By.css('.fretboard__string'));
    expect(component.strings.length).toBe(stringsElements.length);
  });

  it('should render a StringToggleComponent for each string', () => {
    const toggleElements = fixture.debugElement.queryAll(By.css('app-string-toggle'));
    expect(toggleElements.length).toBe(component.strings.length);
  });

  it('should render the correct number of frets', () => {
    const fretElements = fixture.debugElement.queryAll(By.css('.fretboard__fret'));
    expect(fretElements.length).toBe(component.frets.length * component.strings.length);
  });

  it('should render fret index labels', () => {
    const fretIndexElements = fixture.debugElement.queryAll(By.css('.fretboard__fret-index-cell'));
    expect(fretIndexElements.length).toBe(component.frets.length);
  });

  it('should number frets from 1 instead of 0', () => {
    const fretIndexElements = fixture.debugElement.queryAll(By.css('.fretboard__fret-index-cell'));
    expect(fretIndexElements.length).toBe(component.frets.length);
    expect(fretIndexElements[0].nativeElement.textContent.trim()).toBe('1');
    expect(fretIndexElements[fretIndexElements.length - 1].nativeElement.textContent.trim()).toBe(String(component.frets.length));
  });

  it('should render one nut label per string', () => {
    const nutLabelElements = fixture.debugElement.queryAll(By.css('.fretboard__nut-label'));
    expect(nutLabelElements.length).toBe(component.strings.length);
  });

  it('should emit onNoteClicked$ when a fret is clicked', () => {
    vi.spyOn(component.onNoteClicked$, 'emit').mockReturnValue(undefined);
    const noteOnfret = fixture.debugElement.query(By.css('.fretboard__dot')).nativeElement;
    noteOnfret.click();
    fixture.detectChanges();
    expect(component.onNoteClicked$.emit).toHaveBeenCalledTimes(1);
    expect(component.onNoteClicked$.emit).toHaveBeenCalledWith(expect.objectContaining({ note: 'E' }));
  });

  it('should toggle string visibility via DomainService', () => {
    const toggle = fixture.debugElement.query(By.css('app-string-toggle'));
    toggle.triggerEventHandler('stringToggled', { stringIndex: 0, active: false });
    fixture.detectChanges();
    expect(domainService.execute).toHaveBeenCalledWith({ type: 'set-view', enabledStrings: [false, true, true, true, true, true] });
  });
});
