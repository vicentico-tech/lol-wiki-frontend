import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ItemDetailData, RiotDataService } from '../../core/services/riot-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';

interface StatLine {
  label: string;
  value: string;
}

interface RelatedItem {
  id: string;
  name: string;
  icon: string;
}

interface ParsedItem {
  id: string;
  name: string;
  iconUrl: string;
  tags: string[];
  totalGold: string;
  sellGold: string;
  desc: string;
  stats: StatLine[];
  from: RelatedItem[];
  into: RelatedItem[];
}

const ITEM_TAG_ES: Record<string, string> = {
  Damage: 'Daño',
  SpellDamage: 'Poder de habilidad',
  Health: 'Vida',
  HealthRegen: 'Regen. de vida',
  Mana: 'Maná',
  ManaRegen: 'Regen. de maná',
  Armor: 'Armadura',
  SpellBlock: 'Resist. mágica',
  AttackSpeed: 'Vel. de ataque',
  Boots: 'Botas',
  NonbootsMovement: 'Vel. de movimiento',
  CriticalStrike: 'Golpe crítico',
  SpellVamp: 'Robo de vida (habilidades)',
  LifeSteal: 'Robo de vida',
  Aura: 'Aura',
  Active: 'Activo',
  Consumable: 'Consumible',
  Vision: 'Visión',
  Slow: 'Ralentización',
  Tenacity: 'Tenacidad',
  CooldownReduction: 'Reducción de enfriamiento',
  ArmorPenetration: 'Penetración de armadura',
  MagicPenetration: 'Penetración mágica',
  GoldPer: 'Oro por turno',
  Jungle: 'Jungla',
  Lane: 'Línea',
  Trinket: 'Objeto de utilidad',
  Stealth: 'Sigilo',
  OnHit: 'Al golpear'
};

const ITEM_STAT_LABELS: Record<string, string> = {
  FlatHPPoolMod: 'vida',
  FlatMPPoolMod: 'maná',
  FlatPhysicalDamageMod: 'daño de ataque',
  FlatMagicDamageMod: 'poder de habilidad',
  FlatArmorMod: 'armadura',
  FlatSpellBlockMod: 'resistencia mágica',
  FlatCritChanceMod: 'prob. de golpe crítico',
  FlatHPRegenMod: 'regen. de vida',
  FlatMPRegenMod: 'regen. de maná',
  PercentAttackSpeedMod: 'velocidad de ataque',
  FlatMovementSpeedMod: 'velocidad de movimiento',
  PercentMovementSpeedMod: 'velocidad de movimiento',
  PercentLifeStealMod: 'robo de vida'
};

function formatTag(tag: string): string {
  return ITEM_TAG_ES[tag] || tag.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function parseItemStats(stats: Record<string, number> | undefined): StatLine[] {
  return Object.entries(stats || {})
    .filter(([, v]) => !!v)
    .map(([key, v]) => {
      const label = ITEM_STAT_LABELS[key] || key;
      const isPct = key.startsWith('Percent') || key === 'FlatCritChanceMod';
      const value = isPct ? `${Math.round(v * 100)}%` : (Number.isInteger(v) ? String(v) : v.toFixed(1));
      return { label, value: `+${value}` };
    });
}

function stripItemDescription(html: string): string {
  if (!html) {
    return '';
  }
  return html
    .replace(/<stats>[\s\S]*?<\/stats>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatGold(amount: number | undefined): string {
  return amount != null ? `${amount} PO` : '—';
}

@Component({
    selector: 'app-item-detail',
    imports: [CommonModule],
    templateUrl: './item-detail.component.html',
    styleUrl: './item-detail.component.scss'
})
export class ItemDetailComponent implements OnInit, OnDestroy {
  @Input()
  set itemId(value: string) {
    if (value && value !== this._itemId) {
      this._itemId = value;
      this.loadItem(value);
    }
  }
  get itemId(): string {
    return this._itemId;
  }
  private _itemId = '';

  @Output() close = new EventEmitter<void>();

  item: ParsedItem | null = null;
  loading = true;

  constructor(
    private riotService: RiotDataService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    document.body.classList.add('modal-open');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  private loadItem(id: string): void {
    this.loading = true;
    this.riotService.getItemDetail(id).subscribe({
      next: ({ version, item, all }) => {
        this.item = this.parseItem(id, item, all, version);
        this.loading = false;

        this.analytics.pushEvent({
          event: 'view_item_detail',
          item_id: this.item.id,
          item_name: this.item.name
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private parseItem(
    id: string,
    it: ItemDetailData,
    all: Record<string, ItemDetailData>,
    version: string
  ): ParsedItem {
    const nameOf = (refId: string) => (all[refId] || {}).name || refId;
    const resolve = (refId: string): RelatedItem => ({
      id: refId,
      name: nameOf(refId),
      icon: this.riotService.getItemIconUrl(`${refId}.png`)
    });

    return {
      id,
      name: it.name,
      iconUrl: this.riotService.getItemIconUrl(`${id}.png`),
      tags: (it.tags || []).slice(0, 4).map(formatTag),
      totalGold: formatGold(it.gold?.total),
      sellGold: formatGold(it.gold?.sell),
      desc: stripItemDescription(it.description),
      stats: parseItemStats(it.stats),
      from: (it.from || []).map(resolve),
      into: (it.into || []).map(resolve)
    };
  }
}
