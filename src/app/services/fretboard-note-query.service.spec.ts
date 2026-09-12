import { beforeEach, describe, expect, it, vi, type MockedObject } from "vitest";
import { TestBed } from '@angular/core/testing';
import { FretboardNoteQueryService } from './fretboard-note-query.service';
import { FretboardStateService } from './fretboard-state.service';
import { FretboardNotePositionService } from './note.service';
import { DomainService } from '../domain/domain.service';
import { signal } from "@angular/core";
import { FretboardSnapshot } from "../shared/model/fretboard-snapshot";

describe('FretboardNoteQueryService', () => {
  let service: FretboardNoteQueryService;
  let guitarNeckService: FretboardStateService;
  let domainService: Partial<MockedObject<DomainService>>;
  let mockState: any;

  /** Helper: set currentSnapshot with notes that have the given visibility. */
  function setNotesWithVisibility(
    notes: Array<{ string: number; fret: number; note: string; visible: boolean }>
  ): void {
    const snapshot: FretboardSnapshot = {
      notes: notes.map(n => ({
        string: n.string,
        fret: n.fret,
        note: n.note,
        visible: n.visible,
        selected: false,
        interval: '',
      })),
      hasActiveResult: notes.some(n => n.visible),
      currentSelection: null,
      scaleChordState: null,
    };
    guitarNeckService.currentSnapshot.set(snapshot);
  }

  beforeEach(() => {
    mockState = {
      enabledStrings: [true, true, true, true, true, true],
      markerDisplayMode: 'interval-colors',
      fretRange: { min: 0, max: 24 },
    };

    domainService = {
      execute: vi.fn().mockName("DomainService.execute"),
      currentState: signal(mockState) as any,
    };

    TestBed.configureTestingModule({
      providers: [
        FretboardNoteQueryService,
        FretboardStateService,
        FretboardNotePositionService,
        { provide: DomainService, useValue: domainService },
      ],
    });
    service = TestBed.inject(FretboardNoteQueryService);
    guitarNeckService = TestBed.inject(FretboardStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isNoteOnFret', () => {
    it('should return true when a visible note exists at the position', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: true },
      ]);
      expect(service.isNoteOnFret(0, 0)).toBe(true);
    });

    it('should return false when the string is inactive', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: true },
      ]);
      mockState.enabledStrings[0] = false;
      expect(service.isNoteOnFret(0, 0)).toBe(false);
    });

    it('should return false when no note exists at the position', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: true },
      ]);
      expect(service.isNoteOnFret(99, 99)).toBe(false);
    });

    it('should return false when the note is not visible', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: false },
      ]);
      expect(service.isNoteOnFret(0, 0)).toBe(false);
    });
  });

  describe('getNote', () => {
    it('should return the note at a given position', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: true },
      ]);
      const note = service.getNote(0, 0);
      expect(note).toBeDefined();
      expect(note!.string).toBe(1);
      expect(note!.fret).toBe(0);
    });

    it('should return undefined for non-existent position', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: true },
      ]);
      expect(service.getNote(99, 99)).toBeUndefined();
    });

    it('should return undefined when string is inactive', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: true },
      ]);
      mockState.enabledStrings[0] = false;
      expect(service.getNote(0, 0)).toBeUndefined();
    });

    it('should return undefined when note is not visible', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: false },
      ]);
      expect(service.getNote(0, 0)).toBeUndefined();
    });
  });

  describe('getNoteName', () => {
    it('should return the note name at a given position', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: true },
      ]);
      expect(service.getNoteName(0, 0)).toBe('E');
    });

    it('should return empty string for non-existent position', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: true },
      ]);
      expect(service.getNoteName(99, 99)).toBe('');
    });
  });

  describe('fretNoteClicked', () => {
    it('should return the note when found', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: true },
      ]);
      const result = service.fretNoteClicked(0, 0);
      expect(result).not.toBeNull();
      expect(result!.string).toBe(1);
      expect(result!.fret).toBe(0);
    });

    it('should return null when no note at position', () => {
      setNotesWithVisibility([
        { string: 1, fret: 0, note: 'E', visible: true },
      ]);
      expect(service.fretNoteClicked(99, 99)).toBeNull();
    });
  });
});