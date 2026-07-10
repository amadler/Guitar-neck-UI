import { Injectable } from '@angular/core';
import { Observable, catchError, finalize, map, of } from 'rxjs';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';
import { FretboardNotePositionService } from './note.service';
import { IntervalService } from './interval.service';
import { FretboardStateService } from './guitar-neck.service';
import { LoadingService } from './loading.service';
import { MusicPatternApiService } from './scales-and-triads.service';
import { MarkerRoleService } from './marker-role.service';
import { CHORD_PATTERNS, neckConfig } from 'guitar-neck-shared';

@Injectable({ providedIn: 'root' })
export class FretboardOrchestrationService {
  constructor(
    private noteService: FretboardNotePositionService,
    private patternApi: MusicPatternApiService,
    private intervalService: IntervalService,
    private guitarNeckService: FretboardStateService,
    private loadingService: LoadingService,
    private markerRoleService: MarkerRoleService,
  ) {}

  displayScale(scaleName: string, rootNote: string): Observable<GuitarNote[]> {
    this.loadingService.show();
    return this.patternApi.resolveScaleNotes(scaleName, rootNote).pipe(
      map(scaleNotes => {
        const selectedNotes = this.noteService.findPositionsByScaleNotes(scaleNotes);
        const highlightedNotes = this.guitarNeckService.applyHighlightedNotes(selectedNotes);
        this.intervalService.markIntervals(rootNote, scaleName, highlightedNotes, 'scale');
        return highlightedNotes;
      }),
      catchError(error => {
        console.error('Error selecting scale:', error);
        return of([]);
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  displayChord(triadType: string, rootNote: string): Observable<GuitarNote[]> {
    this.clearFretboard();
    this.loadingService.show();

    return this.patternApi.resolveChordNotes(triadType, rootNote).pipe(
      map(chordNotes => {
        const selectedNotes = this.noteService.findPositionsByChordNotes(chordNotes);
        const highlightedNotes = this.guitarNeckService.applyHighlightedNotes(selectedNotes);
        this.intervalService.markIntervals(rootNote, triadType, highlightedNotes);

        return highlightedNotes;
      }),
      catchError(error => {
        console.error('Error selecting triad:', error);
        return of([]);
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  displaySingleNote(noteName: string){
    const selectedNotes = this.noteService.findPositionsByNoteName(noteName);
   this.guitarNeckService.applyHighlightedNotes(selectedNotes);
  }

  displayAllNotes() {
    this.guitarNeckService.showAll();
  }
  public resetFretboard(): void {
    this.intervalService.removeIntervals(this.guitarNeckService.notes);
    this.guitarNeckService.clearFretboard();
  }

  private clearFretboard(): void {
    this.intervalService.removeIntervals(this.guitarNeckService.notes);
    this.guitarNeckService.clearFretboard();
  }

  displayCustomPattern(notes: string[], rootNote: string) {
    this.clearFretboard();
    const selectedNotes = this.noteService.findPositionsByScaleNotes(notes);
    const highlightedNotes = this.guitarNeckService.applyHighlightedNotes(selectedNotes);

    this.intervalService.markCustomIntervals(rootNote, highlightedNotes);

    return highlightedNotes;
  }

  // ---- Scale + Chord relation ----

  /**
   * Display a scale on the fretboard, then overlay chord tones for a chord
   * built on a degree of that scale. The chord tones are computed client-side
   * from CHORD_PATTERNS — no additional API call needed.
   */
  displayScaleWithChord(
    scaleName: string,
    scaleRoot: string,
    chordName: string,
    chordRoot: string,
  ): Observable<GuitarNote[]> {
    this.loadingService.show();

    return this.patternApi.resolveScaleNotes(scaleName, scaleRoot).pipe(
      map(scaleNotes => {
        // 1. Clear any stale interval data from previous views
        this.intervalService.removeIntervals(this.guitarNeckService.notes);

        // 2. Resolve chord note names client-side from CHORD_PATTERNS
        const chordPattern = CHORD_PATTERNS.find(p => p.name === chordName);
        const chordNoteNames: string[] = [];
        if (chordPattern) {
          const chromatic = neckConfig.chromaticNotes;
          const rootIndex = chromatic.indexOf(chordRoot);
          if (rootIndex !== -1) {
            const noteSet = new Set<string>();
            noteSet.add(chordRoot);
            let cumulative = 0;
            for (const step of chordPattern.intervals) {
              cumulative += step;
              noteSet.add(chromatic[(rootIndex + cumulative) % 12]);
            }
            chordNoteNames.push(...noteSet);
          }
        }

        // 3. Find chord notes that are NOT in the scale — these need positions too
        const outsideChordNotes = chordNoteNames.filter(n => !scaleNotes.includes(n));

        // 4. Find positions for scale notes AND outside chord notes, then highlight all
        const scalePositions = this.noteService.findPositionsByScaleNotes(scaleNotes);
        const outsidePositions = this.noteService.findPositionsByScaleNotes(outsideChordNotes);
        const allPositions = [...scalePositions, ...outsidePositions];
        const highlightedNotes = this.guitarNeckService.applyHighlightedNotes(allPositions);

        // 5. Skip interval marking — role-based coloring handles visuals via MarkerRoleService
        //    IntervalService.markIntervals is NOT called here intentionally.
        //    See FretboardDisplayService.getMarkerCssClass() which returns '' when chord is active.

        // 6. Build chord selection from pattern
        const chordSelection: MusicSelection = {
          type: 'chord',
          name: chordName,
          rootNote: chordRoot,
        };

        // 7. Set dual selection state
        this.guitarNeckService.scaleChordState = {
          scale: {
            type: 'scale',
            name: scaleName,
            rootNote: scaleRoot,
            notes: scaleNotes,
          },
          chord: chordSelection,
        };

        // 8. Compute marker roles (covers ALL notes including outside chord tones)
        this.markerRoleService.computeRoles(
          this.guitarNeckService.notes,
          this.guitarNeckService.scaleChordState.scale,
          chordSelection,
        );

        return highlightedNotes;
      }),
      catchError(error => {
        console.error('Error displaying scale with chord:', error);
        return of([]);
      }),
      finalize(() => this.loadingService.hide()),
    );
  }

  /** Remove the chord relation, keeping the scale visible. */
  clearRelation(): void {
    if (this.guitarNeckService.scaleChordState) {
      this.guitarNeckService.scaleChordState = {
        scale: this.guitarNeckService.scaleChordState.scale,
        chord: null,
      };
      this.markerRoleService.lastRoles = new Map();
    }
  }
}
