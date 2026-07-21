import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { NavButtonComponent } from '../../shared/components/nav-button/nav-button.component';
import { ChampionDetailComponent } from '../champion-detail/champion-detail.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, NavButtonComponent, ChampionDetailComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  selectedChampionId: string | null = null;
}
