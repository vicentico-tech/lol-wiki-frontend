import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RiotDataService } from '../../core/services/riot-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AbilityDetailComponent } from '../ability-detail/ability-detail.component';
import { AbilityFilters, AbilityRow } from '../../interfaces/riot-data.interface';

interface Option<T extends string> {
  key: T;
  label: string;
}

const KEY_OPTIONS: Option<AbilityFilters['key']>[] = [
  { key: 'all', label: 'Todas' },
  { key: 'P', label: 'Pasiva' },
  { key: 'Q', label: 'Q' },
  { key: 'W', label: 'W' },
  { key: 'E', label: 'E' },
  { key: 'R', label: 'R · Definitiva' }
];

const COST_OPTIONS: Option<AbilityFilters['cost']>[] = [
  { key: 'all', label: 'Todos' },
  { key: 'mana', label: 'Maná' },
  { key: 'energy', label: 'Energía' },
  { key: 'hp', label: 'Vida' },
  { key: 'none', label: 'Sin coste' },
  { key: 'other', label: 'Otro' }
];

const RANGE_OPTIONS: Option<AbilityFilters['range']>[] = [
  { key: 'all', label: 'Cualquiera' },
  { key: 'self', label: 'Propio' },
  { key: 'short', label: 'Corto' },
  { key: 'mid', label: 'Medio' },
  { key: 'long', label: 'Largo' }
];

const KEY_ORDER = 'PQWERS';

@Component({
  selector: 'app-ability-list',
  imports: [NgTemplateOutlet, FormsModule, AbilityDetailComponent],
  templateUrl: './ability-list.component.html',
  styleUrl: './ability-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbilityListComponent implements OnInit {
  readonly spells = signal<AbilityRow[]>([]);
  readonly summoners = signal<AbilityRow[]>([]);
  readonly version = signal('');
  readonly loading = signal(true);
  readonly tab = signal<'spells' | 'summ'>('spells');
  readonly filters = signal<AbilityFilters>({ q: '', key: 'all', cost: 'all', range: 'all', sort: 'champ' });
  readonly selected = signal<AbilityRow | null>(null);
  readonly featured = signal<AbilityRow | null>(null);
  readonly filtersOpen = signal(false);
  readonly isDesktop = signal(true);

  readonly skeletonItems = Array.from({ length: 27 });
  readonly costOptions = COST_OPTIONS;
  readonly rangeOptions = RANGE_OPTIONS;

  readonly isSpells = computed(() => this.tab() === 'spells');
  readonly source = computed(() => (this.isSpells() ? this.spells() : this.summoners()));

  readonly keyOptions = computed(() => {
    const spells = this.spells();
    return KEY_OPTIONS.map(o => ({
      ...o,
      count: o.key === 'all' ? spells.length : spells.filter(s => s.key === o.key).length
    }));
  });

  readonly filtersDirty = computed(() => {
    const f = this.filters();
    return !!(f.q || (this.isSpells() && (f.key !== 'all' || f.cost !== 'all' || f.range !== 'all')));
  });

  readonly filteredItems = computed<AbilityRow[]>(() => {
    const f = this.filters();
    const spellsTab = this.isSpells();
    const q = f.q.trim().toLowerCase();

    const list = this.source().filter(a => {
      if (q && !a.name.toLowerCase().includes(q) && !a.owner.toLowerCase().includes(q)) return false;
      if (spellsTab) {
        if (f.key !== 'all' && a.key !== f.key) return false;
        if (f.cost !== 'all' && a.cost !== f.cost) return false;
        if (f.range !== 'all' && a.range !== f.range) return false;
      }
      return true;
    });

    const byText = (a: string, b: string) => a.localeCompare(b, 'es');
    const cdAsc = (a: AbilityRow) => (a.cd < 0 ? 1e9 : a.cd);
    switch (f.sort) {
      case 'champ': list.sort((a, b) => byText(a.owner, b.owner) || KEY_ORDER.indexOf(a.key) - KEY_ORDER.indexOf(b.key)); break;
      case 'az': list.sort((a, b) => byText(a.name, b.name)); break;
      case 'cd-asc': list.sort((a, b) => cdAsc(a) - cdAsc(b) || byText(a.name, b.name)); break;
      case 'cd-desc': list.sort((a, b) => b.cd - a.cd || byText(a.name, b.name)); break;
    }
    return list;
  });

  readonly headingText = computed(() => {
    const count = this.filteredItems().length;
    if (!this.isSpells()) return `Hechizos de invocador · ${count}`;
    const key = this.filters().key;
    const label = KEY_OPTIONS.find(o => o.key === key)?.label ?? 'Todas';
    return `${key === 'all' ? 'Todas las habilidades' : label} · ${count}`;
  });

  constructor(
    private riotService: RiotDataService,
    private analytics: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isDesktop.set(window.innerWidth > 1024);

    this.riotService.getAbilityCatalog().subscribe({
      next: ({ version, spells, summoners }) => {
        this.spells.set(spells);
        this.summoners.set(summoners);
        this.version.set(version);
        this.loading.set(false);

        const ultimates = spells.filter(s => s.key === 'R');
        if (ultimates.length) {
          this.featured.set(ultimates[Math.floor(Math.random() * ultimates.length)]);
        }
      },
      error: () => {
        this.spells.set([]);
        this.summoners.set([]);
        this.loading.set(false);
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isDesktop.set(window.innerWidth > 1024);
  }

  setFilter<K extends keyof AbilityFilters>(key: K, value: AbilityFilters[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  setTab(tab: 'spells' | 'summ'): void {
    this.tab.set(tab);
  }

  toggleFilters(): void {
    this.filtersOpen.update(v => !v);
  }

  resetFilters(): void {
    this.filters.update(f => ({ q: '', key: 'all', cost: 'all', range: 'all', sort: f.sort }));
  }

  openAbility(ability: AbilityRow): void {
    this.selected.set(ability);
    this.analytics.pushEvent({
      event: 'select_content',
      content_type: 'ability',
      item_id: ability.id,
      item_name: ability.name
    });
  }

  openFeatured(): void {
    const featured = this.featured();
    if (featured) {
      this.openAbility(featured);
    }
  }

  closeAbility(): void {
    this.selected.set(null);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
