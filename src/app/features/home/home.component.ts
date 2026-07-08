import { Component } from '@angular/core';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { NavButtonComponent } from '../../shared/components/nav-button/nav-button.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SearchBarComponent, NavButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
}
