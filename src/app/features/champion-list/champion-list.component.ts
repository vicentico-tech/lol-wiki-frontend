import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChampionData, RiotDataService } from '../../core/services/riot-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ChampionDetailComponent } from '../champion-detail/champion-detail.component';

interface Filters {
  q: string;
  role: string;
  diff: 'all' | 'low' | 'mid' | 'high';
  res: string;
  sort: 'az' | 'za' | 'new' | 'old';
}

interface RoleOption {
  key: string;
  label: string;
  count: number;
}

const ROLE_ES: Record<string, string> = {
  Fighter: 'Luchador',
  Tank: 'Tanque',
  Mage: 'Mago',
  Assassin: 'Asesino',
  Marksman: 'Tirador',
  Support: 'Soporte'
};

function difficultyBucket(value: number): 'low' | 'mid' | 'high' {
  if (value <= 3) return 'low';
  if (value <= 7) return 'mid';
  return 'high';
}

@Component({
    selector: 'app-champion-list',
    imports: [CommonModule, FormsModule, ChampionDetailComponent],
    templateUrl: './champion-list.component.html',
    styleUrl: './champion-list.component.scss'
})
export class ChampionListComponent implements OnInit {
  champions: ChampionData[] = [];
  version = '';
  loading = true;

  filters: Filters = { q: '', role: 'all', diff: 'all', res: 'all', sort: 'az' };
  selectedId: string | null = null;
  featured: ChampionData | null = null;
  filtersOpen = false;
  isDesktop = true;

  readonly skeletonItems = Array.from({ length: 30 });

  constructor(
    private riotService: RiotDataService,
    private analytics: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isDesktop = window.innerWidth > 1024;

    this.riotService.getChampions().subscribe({
      next: champions => {
        this.champions = champions;
        this.loading = false;
        if (champions.length) {
          this.featured = champions[Math.floor(Math.random() * champions.length)];
        }
        this.riotService.getLatestVersion().subscribe(v => this.version = v);
      },
      error: () => {
        this.champions = [];
        this.loading = false;
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isDesktop = window.innerWidth > 1024;
  }

  get roleOptions(): RoleOption[] {
    const options: RoleOption[] = [{ key: 'all', label: 'Todos los roles', count: this.champions.length }];
    for (const role of Object.keys(ROLE_ES)) {
      options.push({
        key: role,
        label: ROLE_ES[role],
        count: this.champions.filter(c => (c.tags || []).includes(role)).length
      });
    }
    return options;
  }

  get resourceOptions(): string[] {
    const set = new Set<string>();
    for (const c of this.champions) {
      if (c.partype) set.add(c.partype);
    }
    return Array.from(set);
  }

  get filtersDirty(): boolean {
    const f = this.filters;
    return !!(f.q || f.role !== 'all' || f.diff !== 'all' || f.res !== 'all');
  }

  get filteredChampions(): ChampionData[] {
    const f = this.filters;
    const q = f.q.trim().toLowerCase();

    const list = this.champions.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return false;
      if (f.role !== 'all' && !(c.tags || []).includes(f.role)) return false;
      if (f.diff !== 'all' && difficultyBucket(c.info.difficulty) !== f.diff) return false;
      if (f.res !== 'all' && c.partype !== f.res) return false;
      return true;
    });

    const byKey = (c: ChampionData) => parseInt(c.key, 10);
    switch (f.sort) {
      case 'az': list.sort((a, b) => a.name.localeCompare(b.name, 'es')); break;
      case 'za': list.sort((a, b) => b.name.localeCompare(a.name, 'es')); break;
      case 'new': list.sort((a, b) => byKey(b) - byKey(a)); break;
      case 'old': list.sort((a, b) => byKey(a) - byKey(b)); break;
    }
    return list;
  }

  get headingText(): string {
    const count = this.filteredChampions.length;
    if (this.filters.role === 'all') {
      return `Todos los campeones · ${count}`;
    }
    const label = ROLE_ES[this.filters.role] ?? this.filters.role;
    return `${label}s · ${count}`;
  }

  difficultyPips(difficulty: number): boolean[] {
    const on = Math.max(1, Math.min(3, Math.ceil(difficulty / 3.34)));
    return [0, 1, 2].map(i => i < on);
  }

  iconUrl(champion: ChampionData): string {
    return this.riotService.getChampionIconUrl(champion.image.full);
  }

  featuredArtUrl(kind: 'loading' | 'splash'): string {
    if (!this.featured) return '';
    return kind === 'splash'
      ? this.riotService.getChampionSplashUrl(this.featured.id)
      : this.riotService.getChampionLoadingUrl(this.featured.id);
  }

  setRole(role: string): void {
    this.filters.role = role;
  }

  setDifficulty(diff: Filters['diff']): void {
    this.filters.diff = diff;
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  resetFilters(): void {
    this.filters = { q: '', role: 'all', diff: 'all', res: 'all', sort: this.filters.sort };
  }

  openChampion(champion: ChampionData): void {
    this.selectedId = champion.id;
    this.analytics.pushEvent({
      event: 'select_content',
      content_type: 'champion',
      item_id: champion.id,
      item_name: champion.name
    });
  }

  openFeatured(): void {
    if (this.featured) {
      this.openChampion(this.featured);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
