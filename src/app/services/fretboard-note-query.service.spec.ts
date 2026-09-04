import { beforeEach, describe, expect, it, vi, type MockedObject } from "vitest";
import { TestBed } from '@angular/core/testing';
import { FretboardNoteQueryService } from './fretboard-note-query.service';
import { FretboardStateService } from './fretboard-state.service';
import { FretboardNotePositionService } from './note.service';
import { DomainService } from '../domain/domain.service';
import { signal } from "@angular/core";

describe('FretboardNoteQueryService', () => {
  let service: FretboardNoteQueryService;
  let guitarNeckService: FretboardStateService;
  let domainService: Partial<MockedObject<DomainService>>;
  let mockState: any;

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
      // Set up a known note: string 1, fret 0 is visible
      const note = guitarNeckService.notes.find(n => n.string === 1 && n.fret === 0)!;
      note.visible = true;
      expect(service.isNoteOnFret(0, 0)).toBe(true);
    });

    it('should return false when the string is inactive', () => {
      mockState.enabledStrings[0] = false;
      expect(service.isNoteOnFret(0, 0)).toBe(false);
    });

    it('should return false when no note exists at the position', () => {
      expect(service.isNoteOnFret(99, 99)).toBe(false);
    });

    it('should return false when the note is not visible', () => {
      const note = guitarNeckService.notes.find(n => n.string === 1 && n.fret === 0)!;
      note.visible = false;
      expect(service.isNoteOnFret(0, 0)).toBe(false);
    });
  });

  describe('getNote', () => {
    it('should return the note at a given position', () => {
      const note = service.getNote(0, 0);
      expect(note).toBeDefined();
      expect(note!.string).toBe(1);
      expect(note!.fret).toBe(0);
    });

    it('should return undefined for non-existent position', () => {
      expect(service.getNote(99, 99)).toBeUndefined();
    });

    it('should return undefined when string is inactive', () => {
      mockState.enabledStrings[0] = false;
      expect(service.getNote(0, 0)).toBeUndefined();
    });

    it('should return undefined when note is not visible', () => {
      const note = guitarNeckService.notes.find(n => n.string === 1 && n.fret === 0)!;
      note.visible = false;
      expect(service.getNote(0, 0)).toBeUndefined();
    });
  });

  describe('getNoteName', () => {
    it('should return the note name at a given position', () => {
      const note = guitarNeckService.notes.find(n => n.string === 1 && n.fret === 0)!;
      note.visible = true;
      expect(service.getNoteName(0, 0)).toBe(note.note);
    });

    it('should return empty string for non-existent position', () => {
      expect(service.getNoteName(99, 99)).toBe('');
    });
  });

  describe('fretNoteClicked', () => {
    it('should return the note when found', () => {
      const note = guitarNeckService.notes.find(n => n.string === 1 && n.fret === 0)!;
      note.visible = true;
      const result = service.fretNoteClicked(0, 0);
      expect(result).not.toBeNull();
      expect(result!.string).toBe(1);
      expect(result!.fret).toBe(0);
    });

    it('should return null when no note at position', () => {
      expect(service.fretNoteClicked(99, 99)).toBeNull();
    });
  });
});
