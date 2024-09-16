import { NoteService } from './note.service';
import { GuitarNote } from '../shared/model/guitarNote';
import { Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';

describe('NoteService', () => {
  let noteService: NoteService;
  let mockSubject: Subject<GuitarNote[]>;
  let testNotes: GuitarNote[];
  beforeEach(() => {
    mockSubject = new Subject<GuitarNote[]>();
    TestBed.configureTestingModule({
      providers: [
        NoteService,
        {provide: Subject, useValue: mockSubject}
      ]
    });
    noteService = TestBed.inject(NoteService);
    testNotes = [new GuitarNote(1, 1, 'A'), new GuitarNote(2, 2, 'B')];
    noteService['guitarNotes'] = testNotes;
  });



  it('should return notes in getAllNotes', ()=>{
    const notes = noteService.getAllNotes();
    expect(notes).toEqual(testNotes);
  })

  it('should return notes by names', ()=>{
    const notes = noteService.getNotesByNoteName('B');
    expect(notes).toEqual([testNotes[1]]);
  })
});
