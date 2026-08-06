import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { NavButtonComponent } from '../../shared/components/nav-button/nav-button.component';
import { ChampionDetailComponent } from '../champion-detail/champion-detail.component';
import { ItemDetailComponent } from '../item-detail/item-detail.component';

interface Selection {
  type: 'champion' | 'item';
  id: string;
}

@Component({
    selector: 'app-home',
    imports: [CommonModule, SearchBarComponent, NavButtonComponent, ChampionDetailComponent, ItemDetailComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {
  selected: Selection | null = null;

  onChampionSelected(id: string): void {
    this.selected = { type: 'champion', id };
  }

  onItemSelected(id: string): void {
    this.selected = { type: 'item', id };
  }
}
