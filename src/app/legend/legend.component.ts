import { Component } from '@angular/core';
import { FretboardStateService } from '../services/guitar-neck.service';

@Component({
  selector: 'app-legend',
  standalone: true,
  imports: [],
  templateUrl: './legend.component.html',
  styleUrl: './legend.component.scss'
})
export class LegendComponent {

  constructor(protected guitarNeckService: FretboardStateService) {}
}
