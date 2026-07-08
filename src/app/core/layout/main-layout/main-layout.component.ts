import { Component } from '@angular/core';
import { HomeComponent } from '../../../features/home/home.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [HomeComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
}
