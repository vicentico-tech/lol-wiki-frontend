import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RiotDataService } from '../../core/services/riot-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ItemDetailComponent } from '../item-detail/item-detail.component';
import { ItemDetailData, ParsedItem, Filters } from '../../interfaces/riot-data.interface';

interface CategoryOption {
  key: string;
  label: string;
  count: number;
}

interface ChoiceOption<T extends string> {
  key: T;
  label: string;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'Damage', label: 'Daño de ataque' },
  { key: 'SpellDamage', label: 'Poder de habilidad' },
  { key: 'Health', label: 'Vida' },
  { key: 'Armor', label: 'Armadura' },
  { key: 'SpellBlock', label: 'Resist. mágica' },
  { key: 'AttackSpeed', label: 'Vel. de ataque' },
  { key: 'CriticalStrike', label: 'Crítico' },
  { key: 'Mana', label: 'Maná' },
  { key: 'Boots', label: 'Botas' },
  { key: 'Consumable', label: 'Consumibles' },
  { key: 'Vision', label: 'Visión' }
];

const TIER_OPTIONS: ChoiceOption<Filters['tier']>[] = [
  { key: 'all', label: 'Todos' },
  { key: 'basic', label: 'Básico' },
  { key: 'epic', label: 'Épico' },
  { key: 'legendary', label: 'Legendario' }
];

const PRICE_OPTIONS: (ChoiceOption<Filters['price']> & { min: number; max: number })[] = [
  { key: 'all', label: 'Cualquiera', min: 0, max: Infinity },
  { key: 'lt1000', label: '< 1000', min: 0, max: 999 },
  { key: '1000-2500', label: '1000 – 2500', min: 1000, max: 2500 },
  { key: '2500-3500', label: '2500 – 3500', min: 2501, max: 3500 },
  { key: 'gt3500', label: '> 3500', min: 3501, max: Infinity }
];

function isPurchasable(item: ItemDetailData): boolean {
  return !!item.gold?.purchasable && item.gold.total > 0 && !!item.maps?.['11'] && !item.requiredAlly && item.inStore !== false;
}

// Data Dragon repite objetos con otro id (32xxxx, 66xxxx, 1105-1107...) que también marcan
// el mapa 11; la versión canónica es la de id más bajo.
function dedupeByName(entries: [string, ItemDetailData][]): [string, ItemDetailData][] {
  const canonical = new Map<string, [string, ItemDetailData]>();
  for (const entry of entries) {
    const current = canonical.get(entry[1].name);
    if (!current || Number(entry[0]) < Number(current[0])) {
      canonical.set(entry[1].name, entry);
    }
  }
  return entries.filter(([id, it]) => canonical.get(it.name)?.[0] === id);
}

function deriveRarity(it: ItemDetailData): ParsedItem['rarity'] {
  const depth = it.depth ?? 1;
  if (depth >= 3 || (depth === 2 && !it.into?.length)) return 'legendary';
  if (depth === 2) return 'epic';
  return 'basic';
}

@Component({
  selector: 'app-item-list',
  imports: [CommonModule, FormsModule, ItemDetailComponent],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemListComponent implements OnInit {
  readonly items = signal<ParsedItem[]>([]);
  readonly version = signal('');
  readonly loading = signal(true);
  readonly filters = signal<Filters>({ q: '', cat: 'all', tier: 'all', price: 'all', sort: 'price-asc', onlyFinal: false });
  readonly selectedId = signal<string | null>(null);
  readonly featured = signal<ParsedItem | null>(null);
  readonly filtersOpen = signal(false);
  readonly isDesktop = signal(true);

  readonly skeletonItems = Array.from({ length: 24 });
  readonly tierOptions = TIER_OPTIONS;
  readonly priceOptions = PRICE_OPTIONS;

  readonly categoryOptions = computed<CategoryOption[]>(() => {
    const items = this.items();
    return CATEGORIES.map(c => ({
      ...c,
      count: c.key === 'all' ? items.length : items.filter(i => i.tags.includes(c.key)).length
    }));
  });

  readonly filtersDirty = computed<boolean>(() => {
    const f = this.filters();
    return !!(f.q || f.cat !== 'all' || f.tier !== 'all' || f.price !== 'all' || f.onlyFinal);
  });

  readonly filteredItems = computed<ParsedItem[]>(() => {
    const f = this.filters();
    const q = f.q.trim().toLowerCase();
    const range = PRICE_OPTIONS.find(p => p.key === f.price) ?? PRICE_OPTIONS[0];

    const list = this.items().filter(it => {
      if (q && !it.name.toLowerCase().includes(q) && !it.plaintext.toLowerCase().includes(q)) return false;
      if (f.cat !== 'all' && !it.tags.includes(f.cat)) return false;
      if (f.tier !== 'all' && it.rarity !== f.tier) return false;
      if (it.price < range.min || it.price > range.max) return false;
      if (f.onlyFinal && !it.isFinal) return false;
      return true;
    });

    const byName = (a: ParsedItem, b: ParsedItem) => a.name.localeCompare(b.name, 'es');
    switch (f.sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price || byName(a, b)); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price || byName(a, b)); break;
      case 'az': list.sort(byName); break;
      case 'za': list.sort((a, b) => byName(b, a)); break;
    }
    return list;
  });

  readonly headingText = computed<string>(() => {
    const count = this.filteredItems().length;
    const cat = this.filters().cat;
    const label = CATEGORIES.find(c => c.key === cat)?.label ?? 'Todos';
    return `${cat === 'all' ? 'Todos los objetos' : label} · ${count}`;
  });

  constructor(
    private riotService: RiotDataService,
    private analytics: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isDesktop.set(window.innerWidth > 1024);

    this.riotService.getItemCatalog().subscribe({
      next: ({ version, all }) => {
        const items = dedupeByName(Object.entries(all).filter(([, it]) => isPurchasable(it)))
          .map(([id, it]) => this.toParsedItem(id, it));
        this.items.set(items);
        this.version.set(version);
        this.loading.set(false);

        const legendary = items.filter(i => i.rarity === 'legendary');
        const pool = legendary.length ? legendary : items;
        if (pool.length) {
          this.featured.set(pool[Math.floor(Math.random() * pool.length)]);
        }
      },
      error: () => {
        this.items.set([]);
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

  toggleFinal(): void {
    this.filters.update(f => ({ ...f, onlyFinal: !f.onlyFinal }));
  }

  toggleFilters(): void {
    this.filtersOpen.update(v => !v);
  }

  resetFilters(): void {
    this.filters.update(f => ({ q: '', cat: 'all', tier: 'all', price: 'all', sort: f.sort, onlyFinal: false }));
  }

  openItem(item: ParsedItem): void {
    this.selectedId.set(item.id);
    this.analytics.pushEvent({
      event: 'select_content',
      content_type: 'item',
      item_id: item.id,
      item_name: item.name
    });
  }

  openFeatured(): void {
    const featured = this.featured();
    if (featured) {
      this.openItem(featured);
    }
  }

  closeItem(): void {
    this.selectedId.set(null);
  }

  trackById(_: number, item: ParsedItem): string {
    return item.id;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private toParsedItem(id: string, it: ItemDetailData): ParsedItem {
    return {
      id,
      name: it.name,
      plaintext: it.plaintext ?? '',
      iconUrl: this.riotService.getItemIconUrl(`${id}.png`),
      tags: it.tags ?? [],
      price: it.gold.total,
      rarity: deriveRarity(it),
      isFinal: !it.into?.length
    };
  }
}
