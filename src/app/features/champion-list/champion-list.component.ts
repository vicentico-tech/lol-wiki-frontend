import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, signal } from '@angular/core';
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
  styleUrl: './champion-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChampionListComponent implements OnInit {
  readonly champions = signal<ChampionData[]>([]);
  readonly version = signal('');
  readonly loading = signal(true);
  readonly filters = signal<Filters>({ q: '', role: 'all', diff: 'all', res: 'all', sort: 'az' });
  readonly selectedId = signal<string | null>(null);
  readonly featured = signal<ChampionData | null>(null);
  readonly filtersOpen = signal(false);
  readonly isDesktop = signal(true);

  readonly skeletonItems = Array.from({ length: 30 });

  readonly roleOptions = computed<RoleOption[]>(() => {
    const champions = this.champions();
    const options: RoleOption[] = [{ key: 'all', label: 'Todos los roles', count: champions.length }];
    for (const role of Object.keys(ROLE_ES)) {
      options.push({
        key: role,
        label: ROLE_ES[role],
        count: champions.filter(c => (c.tags || []).includes(role)).length
      });
    }
    return options;
  });

  readonly resourceOptions = computed<string[]>(() => {
    const set = new Set<string>();
    for (const c of this.champions()) {
      if (c.partype) set.add(c.partype);
    }
    return Array.from(set);
  });

  readonly filtersDirty = computed<boolean>(() => {
    const f = this.filters();
    return !!(f.q || f.role !== 'all' || f.diff !== 'all' || f.res !== 'all');
  });

  readonly filteredChampions = computed<ChampionData[]>(() => {
    const f = this.filters();
    const q = f.q.trim().toLowerCase();

    const list = this.champions().filter(c => {
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
  });

  readonly headingText = computed<string>(() => {
    const count = this.filteredChampions().length;
    const role = this.filters().role;
    if (role === 'all') {
      return `Todos los campeones · ${count}`;
    }
    return `${ROLE_ES[role] ?? role}s · ${count}`;
  });

  constructor(
    private riotService: RiotDataService,
    private analytics: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isDesktop.set(window.innerWidth > 1024);

    this.riotService.getChampions().subscribe({
      next: champions => {
        this.champions.set(champions);
        this.loading.set(false);
        if (champions.length) {
          this.featured.set(champions[Math.floor(Math.random() * champions.length)]);
        }
        this.riotService.getLatestVersion().subscribe(v => this.version.set(v));
      },
      error: () => {
        this.champions.set([]);
        this.loading.set(false);
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isDesktop.set(window.innerWidth > 1024);
  }

  setFilter<K extends keyof Filters>(key: K, value: Filters[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  difficultyPips(difficulty: number): boolean[] {
    const on = Math.max(1, Math.min(3, Math.ceil(difficulty / 3.34)));
    return [0, 1, 2].map(i => i < on);
  }

  iconUrl(champion: ChampionData): string {
    return this.riotService.getChampionIconUrl(champion.image.full);
  }

  featuredArtUrl(kind: 'loading' | 'splash'): string {
    const featured = this.featured();
    if (!featured) return '';
    return kind === 'splash'
      ? this.riotService.getChampionSplashUrl(featured.id)
      : this.riotService.getChampionLoadingUrl(featured.id);
  }

  toggleFilters(): void {
    this.filtersOpen.update(v => !v);
  }

  resetFilters(): void {
    this.filters.update(f => ({ q: '', role: 'all', diff: 'all', res: 'all', sort: f.sort }));
  }

  openChampion(champion: ChampionData): void {
    this.selectedId.set(champion.id);
    this.analytics.pushEvent({
      event: 'select_content',
      content_type: 'champion',
      item_id: champion.id,
      item_name: champion.name
    });
  }

  openFeatured(): void {
    const featured = this.featured();
    if (featured) {
      this.openChampion(featured);
    }
  }

  closeChampion(): void {
    this.selectedId.set(null);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
