import { AfterViewInit, Component, DestroyRef, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { RiotDataService } from '../../../core/services/riot-data.service';
import type { ChampionData, ItemData } from '../../../interfaces/riot-data.interface';
import { AnalyticsService } from '../../../core/services/analytics.service';

interface SearchResult {
  type: 'champion' | 'item';
  id: string;
  name: string;
  icon: string;
  subtitle: string;
}

type DataStatus = 'loading' | 'ready' | 'error';

const MIN_QUERY_LENGTH = 2;
const MAX_PER_TYPE = 4;

/** Lowercase and strip accents so "Kaisa", "kai'sa" and "Kai'Sa" all match, as do "ojo" and "Ojó". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** 0 = name starts with the query, 1 = a word in the name starts with it, 2 = appears inside, -1 = no match. */
function rank(name: string, query: string): number {
  const n = normalize(name);
  if (n.startsWith(query)) return 0;
  if (n.split(/[\s'’\-]+/).some(word => word.startsWith(query))) return 1;
  return n.includes(query) ? 2 : -1;
}

@Component({
    selector: 'app-search-bar',
    imports: [],
    templateUrl: './search-bar.component.html',
    styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @Output() championSelected = new EventEmitter<string>();
  @Output() itemSelected = new EventEmitter<string>();

  term = '';
  results: SearchResult[] = [];
  activeIndex = -1;
  dataStatus: DataStatus = 'loading';

  private focused = false;
  private dismissed = false;
  private allChampions: ChampionData[] = [];
  private allItems: { id: string; data: ItemData }[] = [];
  private readonly analyticsTerm$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private riotService: RiotDataService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit() {
    this.loadData();

    // Filtering is in-memory and instant; only the analytics event is debounced
    this.analyticsTerm$.pipe(
      debounceTime(700),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => {
      if (term.length < MIN_QUERY_LENGTH) return;
      this.analytics.pushEvent({
        event: 'search',
        search_term: term,
        results_count: this.results.length
      });
    });
  }

  ngAfterViewInit() {
    // Focus on load only where a keyboard is likely; on touch it would pop the keyboard open
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      this.searchInput?.nativeElement.focus();
    }
  }

  loadData() {
    this.dataStatus = 'loading';
    forkJoin([this.riotService.getChampions(), this.riotService.getItems()])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([champions, items]) => {
          this.allChampions = champions;
          this.allItems = items;
          this.dataStatus = 'ready';
          this.performSearch();
        },
        error: () => {
          this.dataStatus = 'error';
        }
      });
  }

  // "/" jumps to the search from anywhere that isn't a text field or an open modal
  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (document.body.classList.contains('modal-open')) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable]')) return;
    event.preventDefault();
    this.searchInput?.nativeElement.focus();
  }

  /** True when there is something to show under the field: results or a status message. */
  get panelOpen(): boolean {
    return this.focused && !this.dismissed && (this.results.length > 0 || this.message !== null);
  }

  /** The one thing to tell the player when there are no results to list. */
  get message(): string | null {
    const query = this.term.trim();
    if (!query) return null;
    if (this.dataStatus === 'error') return 'No se pudieron cargar los datos de Riot.';
    if (query.length < MIN_QUERY_LENGTH) return `Escribe al menos ${MIN_QUERY_LENGTH} letras.`;
    if (this.dataStatus === 'loading') return 'Cargando datos…';
    if (this.results.length === 0) return `Sin resultados para «${query}». Revisa la ortografía o prueba con otro nombre.`;
    return null;
  }

  /** Text for the screen-reader live region; mirrors what a sighted player sees. */
  get liveMessage(): string {
    if (!this.focused || this.dismissed) return '';
    if (this.results.length > 0) {
      const n = this.results.length;
      return `${n} ${n === 1 ? 'resultado' : 'resultados'}. Usa las flechas arriba y abajo para elegir.`;
    }
    return this.message ?? '';
  }

  get activeId(): string | null {
    return this.activeIndex >= 0 ? this.optionId(this.activeIndex) : null;
  }

  optionId(index: number): string {
    return `search-option-${index}`;
  }

  onSearchInput(event: Event) {
    this.term = (event.target as HTMLInputElement).value;
    this.dismissed = false;
    this.performSearch();
    this.analyticsTerm$.next(normalize(this.term.trim()));
  }

  onFocus() {
    this.focused = true;
    this.dismissed = false;
  }

  onBlur() {
    this.focused = false;
    this.activeIndex = -1;
  }

  onKeydown(event: KeyboardEvent) {
    const count = this.results.length;
    switch (event.key) {
      case 'ArrowDown':
        if (!count) return;
        event.preventDefault();
        this.dismissed = false;
        this.moveActive(this.activeIndex + 1 >= count ? 0 : this.activeIndex + 1);
        break;
      case 'ArrowUp':
        if (!count) return;
        event.preventDefault();
        this.dismissed = false;
        this.moveActive(this.activeIndex <= 0 ? count - 1 : this.activeIndex - 1);
        break;
      case 'Enter':
        // With nothing highlighted, Enter takes the best match: the fastest path for a lookup
        if (this.panelOpen && count) {
          event.preventDefault();
          this.onResultClick(this.results[this.activeIndex >= 0 ? this.activeIndex : 0]);
        }
        break;
      case 'Escape':
        if (this.panelOpen) {
          this.dismissed = true;
          this.activeIndex = -1;
        } else if (this.term) {
          this.clear();
        }
        break;
    }
  }

  onSearchButton() {
    if (this.results.length) {
      this.onResultClick(this.results[this.activeIndex >= 0 ? this.activeIndex : 0]);
    } else {
      this.searchInput?.nativeElement.focus();
    }
  }

  clear() {
    this.term = '';
    this.results = [];
    this.activeIndex = -1;
    this.dismissed = false;
    const input = this.searchInput?.nativeElement;
    if (input) {
      input.value = '';
      input.focus();
    }
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
    this.dismissed = true;
    this.activeIndex = -1;
  }

  onIconError(event: Event) {
    // A missing icon should leave the dark plate, not a broken-image glyph
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }

  private moveActive(index: number) {
    this.activeIndex = index;
    // Keep the highlighted row visible inside the scrolling panel
    setTimeout(() => document.getElementById(this.optionId(index))?.scrollIntoView({ block: 'nearest' }));
  }

  private performSearch() {
    const query = normalize(this.term.trim());
    this.activeIndex = -1;

    if (query.length < MIN_QUERY_LENGTH || this.dataStatus !== 'ready') {
      this.results = [];
      return;
    }

    const byRank = <T>(items: T[], nameOf: (item: T) => string) =>
      items
        .map(item => ({ item, score: rank(nameOf(item), query) }))
        .filter(entry => entry.score >= 0)
        .sort((a, b) => a.score - b.score || nameOf(a.item).localeCompare(nameOf(b.item), 'es'))
        .slice(0, MAX_PER_TYPE)
        .map(entry => entry.item);

    const champions = byRank(this.allChampions, c => c.name).map(c => ({
      type: 'champion' as const,
      id: c.id,
      name: c.name,
      subtitle: c.title,
      icon: this.riotService.getChampionIconUrl(c.image.full)
    }));

    const items = byRank(this.allItems, i => i.data.name).map(i => ({
      type: 'item' as const,
      id: i.id,
      name: i.data.name,
      subtitle: i.data.plaintext || 'Objeto',
      icon: this.riotService.getItemIconUrl(i.data.image.full)
    }));

    this.results = [...champions, ...items];
  }
}
