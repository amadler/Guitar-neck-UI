import { TestBed } from '@angular/core/testing';
import { MarkerRoleService } from './marker-role.service';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';
import { beforeEach, describe, expect, it } from 'vitest';

describe('MarkerRoleService', () => {
  let service: MarkerRoleService;

  function makeNote(string: number, fret: number, note: string): GuitarNote {
    return { string, fret, note, visible: false, selected: false, interval: '' };
  }

  const mockNotes: GuitarNote[] = [
    // C major scale notes on fretboard (simplified)
    makeNote(1, 0, 'E'), // E
    makeNote(1, 3, 'G'), // G  → chord-tone (C major)
    makeNote(1, 5, 'A'), // A  → scale-tone
    makeNote(1, 7, 'B'), // B  → scale-tone
    makeNote(1, 8, 'C'), // C  → scale-root / chord-root
    makeNote(1, 12, 'E'), // E  → chord-tone
    // Non-scale notes
    makeNote(2, 1, 'F#'), // F# → not in C major scale → no role
    makeNote(2, 6, 'A#'), // A# → chord-tone-outside-scale (C major chord has E, G, but not A#)
  ];

  const scaleSelection: MusicSelection = {
    type: 'scale',
    name: 'major',
    rootNote: 'C',
  };

  const chordSelection: MusicSelection = {
    type: 'chord',
    name: 'major',
    rootNote: 'C',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarkerRoleService],
    });
    service = TestBed.inject(MarkerRoleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('computeRoles with scale only (no chord)', () => {
    it('should return scale-tone for scale notes and scale-root for root', () => {
      const roles = service.computeRoles(mockNotes, scaleSelection, null);

      // C (string 1, fret 8) = scale-root → key '0-8'
      expect(roles.get('0-8')).toBe('scale-root');

      // A (string 1, fret 5) = scale-tone → key '0-5'
      expect(roles.get('0-5')).toBe('scale-tone');

      // B (string 1, fret 7) = scale-tone → key '0-7'
      expect(roles.get('0-7')).toBe('scale-tone');

      // F# (string 2, fret 1) = not in scale → no role → key '1-1'
      expect(roles.has('1-1')).toBe(false);
    });
  });

  describe('computeRoles with scale + chord', () => {
    it('should return chord-tone for notes in both scale and chord', () => {
      const roles = service.computeRoles(mockNotes, scaleSelection, chordSelection);

      // G (string 1, fret 3) = in C major scale AND C major chord → chord-tone → key '0-3'
      expect(roles.get('0-3')).toBe('chord-tone');

      // E (string 1, fret 0) = in C major scale AND C major chord → chord-tone → key '0-0'
      expect(roles.get('0-0')).toBe('chord-tone');

      // E (string 1, fret 12) = in C major scale AND C major chord → chord-tone → key '0-12'
      expect(roles.get('0-12')).toBe('chord-tone');
    });

    it('should return scale-tone for notes in scale but not in chord', () => {
      const roles = service.computeRoles(mockNotes, scaleSelection, chordSelection);

      // A (string 1, fret 5) = in C major scale, NOT in C major chord → scale-tone → key '0-5'
      expect(roles.get('0-5')).toBe('scale-tone');

      // B (string 1, fret 7) = in C major scale, NOT in C major chord → scale-tone → key '0-7'
      expect(roles.get('0-7')).toBe('scale-tone');
    });

    it('should return chord-root for C when scale-root equals chord-root', () => {
      const roles = service.computeRoles(mockNotes, scaleSelection, chordSelection);

      // C (string 1, fret 8) = root of scale AND root of chord → chord-root wins → key '0-8'
      expect(roles.get('0-8')).toBe('chord-root');
    });

    it('should return chord-root when chord root differs from scale root', () => {
      const chordOnG: MusicSelection = {
        type: 'chord',
        name: 'major',
        rootNote: 'G',
      };

      const roles = service.computeRoles(mockNotes, scaleSelection, chordOnG);

      // G (string 1, fret 3) is the chord root → key '0-3'
      expect(roles.get('0-3')).toBe('chord-root');
      // C (string 1, fret 8) is still the scale root → key '0-8'
      expect(roles.get('0-8')).toBe('scale-root');
    });

    it('should return chord-tone-outside-scale for chord notes not in the scale', () => {
      const diminishedChord: MusicSelection = {
        type: 'chord',
        name: 'diminished',
        rootNote: 'C',
      };

      // C diminished = C, D#, F# → F# (Gb) not in C major scale
      // We need a note that's F#/Gb on our mock board
      const notesWithGb = [...mockNotes, makeNote(3, 2, 'F#')];

      const roles = service.computeRoles(notesWithGb, scaleSelection, diminishedChord);

      // F# (string 3, fret 2) = in C diminished chord, NOT in C major scale → chord-tone-outside-scale → key '2-2'
      expect(roles.get('2-2')).toBe('chord-tone-outside-scale');
    });
  });

  describe('lastRoles cache', () => {
    it('should store the last computed roles', () => {
      service.computeRoles(mockNotes, scaleSelection, null);
      expect(service.lastRoles().size).toBeGreaterThan(0);
      expect(service.lastRoles().get('0-8')).toBe('scale-root');
    });
  });
});
