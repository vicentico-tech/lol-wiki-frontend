import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ChampionDetailData, RiotDataService } from '../../core/services/riot-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';

interface StatRow {
  label: string;
  value: string;
  pct: number;
}

interface AbilityView {
  key: string;
  name: string;
  icon: string;
  meta: string;
  desc: string;
}

interface ParsedChampion {
  id: string;
  name: string;
  title: string;
  roleLabel: string;
  resourceLabel: string;
  iconUrl: string;
  splashUrl: string;
  difficultyPips: number;
  stats: StatRow[];
  abilities: AbilityView[];
}

const ROLE_ES: Record<string, string> = {
  Fighter: 'Luchador',
  Tank: 'Tanque',
  Mage: 'Mago',
  Assassin: 'Asesino',
  Marksman: 'Tirador',
  Support: 'Soporte'
};

const STAT_MAX: Record<string, number> = {
  hp: 1100,
  attackdamage: 75,
  armor: 50,
  spellblock: 40,
  attackspeed: 1.0,
  movespeed: 400
};

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function statPct(value: number, max: number): number {
  return Math.max(6, Math.min(100, Math.round((value / max) * 100)));
}

@Component({
    selector: 'app-champion-detail',
    imports: [CommonModule],
    templateUrl: './champion-detail.component.html',
    styleUrl: './champion-detail.component.scss'
})
export class ChampionDetailComponent implements OnInit, OnDestroy {
  @Input()
  set championId(value: string) {
    if (value && value !== this._championId) {
      this._championId = value;
      this.loadChampion(value);
    }
  }
  get championId(): string {
    return this._championId;
  }
  private _championId = '';

  @Output() close = new EventEmitter<void>();

  champion: ParsedChampion | null = null;
  loading = true;
  selectedAbility = 'P';

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

  get selectedAbilityData(): AbilityView | undefined {
    if (!this.champion) {
      return undefined;
    }
    return this.champion.abilities.find(a => a.key === this.selectedAbility) ?? this.champion.abilities[0];
  }

  selectAbility(key: string): void {
    this.selectedAbility = key;
  }

  onClose(): void {
    this.close.emit();
  }

  private loadChampion(id: string): void {
    this.loading = true;
    this.selectedAbility = 'P';
    this.riotService.getChampionDetail(id).subscribe({
      next: ({ version, champion }) => {
        this.champion = this.parseChampion(champion, version);
        this.loading = false;

        this.analytics.pushEvent({
          event: 'view_champion_detail',
          champion_id: this.champion.id,
          champion_name: this.champion.name
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private parseChampion(c: ChampionDetailData, version: string): ParsedChampion {
    const s = c.stats;
    const attackSpeed = typeof s['attackspeed'] === 'number'
      ? s['attackspeed']
      : 0.625 / (1 + (s['attackspeedoffset'] || 0));

    const stats: StatRow[] = [
      { label: 'Vida', value: String(Math.round(s['hp'])), pct: statPct(s['hp'], STAT_MAX['hp']) },
      { label: 'Daño de ataque', value: String(Math.round(s['attackdamage'])), pct: statPct(s['attackdamage'], STAT_MAX['attackdamage']) },
      { label: 'Armadura', value: String(Math.round(s['armor'])), pct: statPct(s['armor'], STAT_MAX['armor']) },
      { label: 'Resist. mágica', value: String(Math.round(s['spellblock'])), pct: statPct(s['spellblock'], STAT_MAX['spellblock']) },
      { label: 'Vel. ataque', value: attackSpeed.toFixed(3), pct: statPct(attackSpeed, STAT_MAX['attackspeed']) },
      { label: 'Vel. movimiento', value: String(Math.round(s['movespeed'])), pct: statPct(s['movespeed'], STAT_MAX['movespeed']) }
    ];

    const keys = ['Q', 'W', 'E', 'R'];
    const abilities: AbilityView[] = [
      {
        key: 'P',
        name: c.passive.name,
        icon: this.riotService.getPassiveIconUrl(c.passive.image.full),
        meta: 'Pasiva',
        desc: stripHtml(c.passive.description)
      },
      ...c.spells.map((sp, i) => ({
        key: keys[i],
        name: sp.name,
        icon: this.riotService.getSpellIconUrl(sp.image.full),
        meta: sp.costBurn && sp.costBurn !== '0'
          ? `Coste ${sp.costBurn} · Recarga ${sp.cooldownBurn}s`
          : `Recarga ${sp.cooldownBurn}s`,
        desc: stripHtml(sp.description)
      }))
    ];

    const pipsOn = Math.max(1, Math.min(3, Math.round(c.info.difficulty / 3.34)));
    const roleLabel = (c.tags || []).map(t => ROLE_ES[t] || t).join(' · ');

    return {
      id: c.id,
      name: c.name,
      title: c.title,
      roleLabel,
      resourceLabel: `Recurso · ${c.partype || '—'}`,
      iconUrl: this.riotService.getChampionIconUrl(`${c.id}.png`),
      splashUrl: this.riotService.getChampionSplashUrl(c.id),
      difficultyPips: pipsOn,
      stats,
      abilities
    };
  }
}
