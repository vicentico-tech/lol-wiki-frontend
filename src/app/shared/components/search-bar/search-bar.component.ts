import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { RiotDataService, ChampionData, ItemData } from '../../../core/services/riot-data.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

interface SearchResult {
  type: 'champion' | 'item';
  id: string;
  name: string;
  icon: string;
  subtitle: string;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnInit {
  @Output() championSelected = new EventEmitter<string>();
  @Output() itemSelected = new EventEmitter<string>();

  searchTerm$ = new Subject<string>();
  searchResults: SearchResult[] = [];
  isSearching = false;
  showDropdown = false;

  private allChampions: ChampionData[] = [];
  private allItems: {id: string, data: ItemData}[] = [];

  constructor(
    private riotService: RiotDataService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit() {
    this.riotService.getChampions().subscribe(champs => this.allChampions = champs);
    this.riotService.getItems().subscribe(items => this.allItems = items);

    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.performSearch(term);
    });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm$.next(value);
  }

  onFocus() {
    if (this.searchResults.length > 0) {
      this.showDropdown = true;
    }
  }

  onBlur() {
    setTimeout(() => this.showDropdown = false, 200);
  }

  performSearch(term: string) {
    if (!term || term.trim().length < 2) {
      this.searchResults = [];
      this.showDropdown = false;
      return;
    }

    const lowerTerm = term.toLowerCase().trim();
    this.isSearching = true;

    const champs = this.allChampions
      .filter(c => c.name.toLowerCase().includes(lowerTerm))
      .slice(0, 4)
      .map(c => ({
        type: 'champion' as const,
        id: c.id,
        name: c.name,
        subtitle: c.title,
        icon: this.riotService.getChampionIconUrl(c.image.full)
      }));

    const items = this.allItems
      .filter(i => i.data.name.toLowerCase().includes(lowerTerm))
      .slice(0, 4)
      .map(i => ({
        type: 'item' as const,
        id: i.id,
        name: i.data.name,
        subtitle: i.data.plaintext || 'Objeto',
        icon: this.riotService.getItemIconUrl(i.data.image.full)
      }));

    this.searchResults = [...champs, ...items];
    this.showDropdown = this.searchResults.length > 0;
    this.isSearching = false;

    this.analytics.pushEvent({
      event: 'search',
      search_term: lowerTerm,
      results_count: this.searchResults.length
    });
  }

  onResultClick(result: SearchResult) {
    this.analytics.pushEvent({
      event: 'select_content',
      content_type: result.type,
      item_id: result.id,
      item_name: result.name
    });

    if (result.type === 'champion') {
      this.championSelected.emit(result.id);
    } else {
      this.itemSelected.emit(result.id);
    }
    this.showDropdown = false;
  }
}
