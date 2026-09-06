import { GUITAR_SHAPES, GuitarShape } from './guitar-shapes';

/**
 * Chromatic scale for note calculation.
 * Standard tuning: E2(6), A2(5), D3(4), G3(3), B3(2), E4(1)
 */
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OPEN_STRINGS: Record<number, string> = { 1: 'E', 2: 'B', 3: 'G', 4: 'D', 5: 'A', 6: 'E' };

function getNoteAt(string: number, fret: number): string {
  const openNote = OPEN_STRINGS[string];
  const openIndex = CHROMATIC.indexOf(openNote);
  if (openIndex === -1) return '?';
  return CHROMATIC[(openIndex + fret) % 12];
}

function getIntervalLabel(rootNote: string, otherNote: string): string {
  const rootIndex = CHROMATIC.indexOf(rootNote);
  const otherIndex = CHROMATIC.indexOf(otherNote);
  if (rootIndex === -1 || otherIndex === -1) return '?';
  const semitones = (otherIndex - rootIndex + 12) % 12;
  const intervalMap: Record<number, string> = {
    0: 'root',
    1: 'b2',
    2: '2',
    3: 'b3',
    4: '3',
    5: '4',
    6: 'b5',
    7: '5',
    8: '#5',
    9: '6',
    10: 'b7',
    11: '7',
  };
  return intervalMap[semitones] ?? '?';
}

describe('GUITAR_SHAPES', () => {
  describe('cowboy shapes', () => {
    const cowboyShapes = GUITAR_SHAPES.filter(s => s.category === 'cowboy');

    it('should have rootNote and chordType for every cowboy shape', () => {
      for (const shape of cowboyShapes) {
        expect(shape.rootNote).toBeDefined();
        expect(shape.chordType).toBeDefined();
      }
    });

    it('should have correct interval labels for every position', () => {
      for (const shape of cowboyShapes) {
        const fixedFret = shape.fixedFret ?? 0;
        for (const pos of shape.positions) {
          const actualFret = pos.fretOffset + fixedFret;
          const actualNote = getNoteAt(pos.string, actualFret);
          const expectedLabel = getIntervalLabel(shape.rootNote!, actualNote);
          expect(pos.label).toBe(expectedLabel);
        }
      }
    });

    it('should have valid string numbers (1-6)', () => {
      for (const shape of cowboyShapes) {
        expect(shape.rootString).toBeGreaterThanOrEqual(1);
        expect(shape.rootString).toBeLessThanOrEqual(6);
        for (const pos of shape.positions) {
          expect(pos.string).toBeGreaterThanOrEqual(1);
          expect(pos.string).toBeLessThanOrEqual(6);
        }
      }
    });
  });

  describe('barre shapes', () => {
    const barreShapes = GUITAR_SHAPES.filter(s => s.category === 'barre');

    it('should have stringSet defined', () => {
      for (const shape of barreShapes) {
        expect(shape.stringSet).toBeDefined();
        expect(shape.stringSet!.length).toBeGreaterThan(0);
      }
    });

    it('should have valid rootString in stringSet', () => {
      for (const shape of barreShapes) {
        expect(shape.stringSet!.includes(shape.rootString)).toBe(true);
      }
    });

    it('should not have rootNote (they are movable)', () => {
      for (const shape of barreShapes) {
        expect(shape.rootNote).toBeUndefined();
      }
    });
  });

  describe('all shapes', () => {
    it('should have unique IDs', () => {
      const ids = GUITAR_SHAPES.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have at least one position per shape', () => {
      for (const shape of GUITAR_SHAPES) {
        expect(shape.positions.length).toBeGreaterThan(0);
      }
    });
  });
});