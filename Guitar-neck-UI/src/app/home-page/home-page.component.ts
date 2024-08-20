import { Component } from '@angular/core';
import { ToolboxFormComponent } from '../toolbox-form/toolbox-form.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [ToolboxFormComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {

}
