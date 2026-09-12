import { TestBed } from '@angular/core/testing';
import { PatternBuilderService } from './pattern-builder.service';
import { FretboardStateService } from './fretboard-state.service';
import { FretboardNotePositionService } from './note.service';
import { beforeEach, describe, expect, it } from 'vitest';
import { FretboardSnapshot } from '../shared/model/fretboard-snapshot';

describe('PatternBuilderService', () => {
  let service: PatternBuilderService;
  let fretboardState: FretboardStateService;

  /** Helper: set a minimal snapshot so currentSnapshot is not null. */
  function initSnapshot(): void {
    const snapshot: FretboardSnapshot = {
      notes: [],
      hasActiveResult: false,
      currentSelection: null,
      scaleChordState: null,
    };
    fretboardState.currentSnapshot.set(snapshot);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PatternBuilderService,
        FretboardStateService,
        FretboardNotePositionService,
      ],
    });
    service = TestBed.inject(PatternBuilderService);
    fretboardState = TestBed.inject(FretboardStateService);
    initSnapshot();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setCurrentPattern', () => {
    it('should set currentPattern for a known scale', () => {
      service.setCurrentPattern('major', 'C', 'scale');
      expect(service.currentPattern()).not.toBeNull();
      expect(service.currentPattern()!.name).toBe('major');
      expect(service.currentPattern()!.rootNote).toBe('C');
      expect(service.currentPattern()!.type).toBe('scale');
      expect(service.currentPattern()!.notes).toContain('C');
      expect(service.currentPattern()!.notes).toContain('E');
      expect(service.currentPattern()!.notes).toContain('G');
    });

    it('should set currentPattern() for a known chord', () => {
      service.setCurrentPattern('major', 'C', 'chord');
      expect(service.currentPattern()).not.toBeNull();
      expect(service.currentPattern()!.name).toBe('major');
      expect(service.currentPattern()!.rootNote).toBe('C');
      expect(service.currentPattern()!.type).toBe('chord');
      expect(service.currentPattern()!.notes).toEqual(['C', 'E', 'G']);
    });

    it('should set null for unknown pattern name', () => {
      service.setCurrentPattern('nonexistent', 'C', 'scale');
      expect(service.currentPattern()).toBeNull();
    });

    it('should set null for unknown root note', () => {
      service.setCurrentPattern('major', 'X', 'scale');
      expect(service.currentPattern()).toBeNull();
    });

    it('should update currentSelection in snapshot', () => {
      service.setCurrentPattern('major', 'C', 'scale');
      expect(fretboardState.currentSnapshot()!.currentSelection).not.toBeNull();
      expect(fretboardState.currentSnapshot()!.currentSelection!.name).toBe('major');
      expect(fretboardState.currentSnapshot()!.currentSelection!.rootNote).toBe('C');
    });

    it('should clear currentSelection when pattern is unknown', () => {
      // First set a selection
      service.setCurrentPattern('major', 'C', 'scale');
      expect(fretboardState.currentSnapshot()!.currentSelection).not.toBeNull();

      // Then clear with unknown pattern
      service.setCurrentPattern('nonexistent', 'C', 'scale');
      expect(fretboardState.currentSnapshot()!.currentSelection).toBeNull();
    });
  });

  describe('setRelatedChord', () => {
    it('should set relatedChord for a known chord', () => {
      service.setRelatedChord('major', 'C');
      expect(service.relatedChord()).not.toBeNull();
      expect(service.relatedChord()!.name).toBe('major');
      expect(service.relatedChord()!.rootNote).toBe('C');
      expect(service.relatedChord()!.type).toBe('chord');
    });

    it('should set null for unknown chord name', () => {
      service.setRelatedChord('nonexistent', 'C');
      expect(service.relatedChord()).toBeNull();
    });

    it('should set null for unknown root note', () => {
      service.setRelatedChord('major', 'X');
      expect(service.relatedChord()).toBeNull();
    });
  });

  describe('clearCurrentPattern', () => {
    it('should clear currentPattern, relatedChord, and currentSelection', () => {
      service.setCurrentPattern('major', 'C', 'scale');
      service.setRelatedChord('major', 'C');
      expect(service.currentPattern()).not.toBeNull();
      expect(service.relatedChord()).not.toBeNull();

      service.clearCurrentPattern();
      expect(service.currentPattern()).toBeNull();
      expect(service.relatedChord()).toBeNull();
      expect(fretboardState.currentSnapshot()!.currentSelection).toBeNull();
    });
  });
});