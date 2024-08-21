import { Component } from '@angular/core';
import { ToolboxFormComponent } from '../toolbox-form/toolbox-form.component';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { NoteService } from '../services/note.service';
import { GuitarNeckService } from '../services/guitar-neck.service';
import { SCALE_PATTERNS, TRIAD_PATTERNS } from '../shared/model/scales';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [ToolboxFormComponent, GuitarNeckComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  constructor(
    private noteService: NoteService,
    private guitarNeckService: GuitarNeckService,

  ) { }
  toolboxSubmit(event:any): void {
    console.log('toolboxSubmit', event.musicElement, event.keys);
    this.guitarNeckService.clearFretboard();

    if (event.musicElements === 'Single note') {
      console.log('Single note', event.keys);
      const notes = this.noteService.getNotesByNoteName(event.keys);
      this.guitarNeckService.selectNotes(notes);
    } else if (event.musicElements === 'All notes') {
      console.log('All notes', event.keys);
      this.guitarNeckService.showAllNotes();
    }
    else if (event.musicElements.includes('Triad')) {
      const triadPattern = TRIAD_PATTERNS.find(pattern => pattern.name === event.musicElements);
      if (triadPattern) {
        console.log(triadPattern.name, event.keys);
        this.guitarNeckService.selectTriad(triadPattern.name, event.keys);
      } else {
        console.log('Unknown music element');
      }
    }
    else {
      const scalePattern = SCALE_PATTERNS.find(pattern => pattern.name === event.musicElements);
      if (scalePattern) {
        console.log(scalePattern.name, event.keys);
        this.guitarNeckService.selectScale(scalePattern.name, event.keys);
      } else {
        console.log('Unknown music element');
      }
    }
  }
}
