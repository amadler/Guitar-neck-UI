import { GuitarNote } from "../shared/model/guitarNote";
import { GuitarNeckService } from "./guitar-neck.service"
import { IntervalService } from "./interval.service";
import { NoteService } from "./note.service"
import { TestBed } from "@angular/core/testing";

xdescribe('GuitarNeckService', ()=>{
  let neckService: GuitarNeckService
  let noteServiceSpy: jasmine.SpyObj<NoteService>;
  let intervalServiceSpy: jasmine.SpyObj<IntervalService>;

  beforeEach(()=>{

    TestBed.configureTestingModule({
      providers: [
        GuitarNeckService,
        {privide: NoteService, useValue: noteServiceSpy },
        {privide: IntervalService, useValue: intervalServiceSpy }
      ]
    });

    neckService = TestBed.inject(GuitarNeckService)
    noteServiceSpy = TestBed.inject(NoteService) as jasmine.SpyObj<NoteService>;
    intervalServiceSpy = TestBed.inject(IntervalService) as jasmine.SpyObj<IntervalService>

    const mockNotes: GuitarNote[] = [
      { id: 'some-id', note: 'A', string: 1, fret: 0, visible: true, selected: false, isRoot: false, isFifth: false, isThird: false },
      { id: '49dac623-4654-429e-8901-e62eb65510e5', note: 'D', string: 2, fret: 5, visible: true, selected: false, isRoot: false, isFifth: false, isThird: false },
    ];

    neckService.notes = mockNotes;
   // noteServiceSpy.getAllNotes.and.returnValue(mockNotes);
  })
  it('should get note from guitar neck.', ()=>{
    const result: GuitarNote= {  id: 'some-id', note: 'A', string: 1, fret: 0, visible: true, selected: false, isRoot: false, isFifth: false, isThird: false  }
    const note = neckService.getNote('A', 0);
    expect(note).toEqual(result);

  })
})
