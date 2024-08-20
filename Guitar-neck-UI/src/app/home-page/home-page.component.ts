import { Component } from '@angular/core';
import { ToolboxFormComponent } from '../toolbox-form/toolbox-form.component';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [ToolboxFormComponent, GuitarNeckComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {

}
