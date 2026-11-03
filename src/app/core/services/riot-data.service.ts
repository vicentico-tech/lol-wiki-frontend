import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, switchMap, map, forkJoin, shareReplay } from 'rxjs';
import { AbilityCatalog, AbilityKey, AbilityRow, ChampionData, ChampionDetailData, ItemData, ItemDetailData } from '../../interfaces/riot-data.interface';

function stripAbilityHtml(html: string): string {
  return (html || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function abilityCostKind(sp: any): AbilityRow['cost'] {
  if ((sp.costBurn || '0') === '0' || /sin coste/i.test(sp.costType || '')) return 'none';
  const type = (sp.costType || '').toLowerCase();
  if (type.includes('maná') || type.includes('mana')) return 'mana';
  if (type.includes('energ')) return 'energy';
  if (type.includes('vida') || type.includes('salud')) return 'hp';
  return 'other';
}

function abilityRangeKind(sp: any): AbilityRow['range'] {
  const range = parseFloat(sp.rangeBurn);
  if (isNaN(range) || range <= 0) return 'self';
  if (range <= 500) return 'short';
  if (range <= 900) return 'mid';
  return 'long';
}

function abilityCooldown(burn: string): number {
  const n = parseFloat(burn);
  return isNaN(n) ? -1 : n;
}

@Injectable({
  providedIn: 'root'
})
export class RiotDataService {
  private readonly baseUrl = 'https://ddragon.leagueoflegends.com';
  
  private currentVersion: string = '';
  private championsCache: Record<string, ChampionData> | null = null;
  private itemsCache: Record<string, ItemData> | null = null;
  private itemDetailCache: Record<string, ItemDetailData> | null = null;
  private abilityCatalog$: Observable<AbilityCatalog> | null = null;

  constructor(private http: HttpClient) {}

  getLatestVersion(): Observable<string> {
    if (this.currentVersion) {
      return of(this.currentVersion);
    }
    return this.http.get<string[]>(`${this.baseUrl}/api/versions.json`).pipe(
      map(versions => versions[0]),
      tap(version => this.currentVersion = version)
    );
  }


  getChampions(): Observable<ChampionData[]> {
    if (this.championsCache) {
      return of(Object.values(this.championsCache));
    }
    return this.getLatestVersion().pipe(
      switchMap(version => this.http.get<any>(`${this.baseUrl}/cdn/${version}/data/es_ES/champion.json`)),
      tap(data => this.championsCache = data.data),
      map(data => Object.values(data.data as Record<string, ChampionData>))
    );
  }

  getItems(): Observable<{id: string, data: ItemData}[]> {
    if (this.itemsCache) {
      return of(Object.entries(this.itemsCache).map(([id, data]) => ({id, data})));
    }
    return this.getLatestVersion().pipe(
      switchMap(version => this.http.get<any>(`${this.baseUrl}/cdn/${version}/data/es_ES/item.json`)),
      tap(data => this.itemsCache = data.data),
      map(data => Object.entries(data.data as Record<string, ItemData>).map(([id, itemData]) => ({id, data: itemData})))
    );
  }

  getChampionDetail(id: string): Observable<{ version: string; champion: ChampionDetailData }> {
    return this.getLatestVersion().pipe(
      switchMap(version => this.http.get<any>(`${this.baseUrl}/cdn/${version}/data/es_ES/champion/${id}.json`).pipe(
        map(res => ({ version, champion: res.data[id] as ChampionDetailData }))
      ))
    );
  }

  getChampionSplashUrl(id: string): string {
    return `${this.baseUrl}/cdn/img/champion/splash/${id}_0.jpg`;
  }

  getChampionIconUrl(imageName: string): string {
    return `${this.baseUrl}/cdn/${this.currentVersion}/img/champion/${imageName}`;
  }

  getChampionLoadingUrl(id: string): string {
    return `${this.baseUrl}/cdn/img/champion/loading/${id}_0.jpg`;
  }

  getPassiveIconUrl(imageName: string): string {
    return `${this.baseUrl}/cdn/${this.currentVersion}/img/passive/${imageName}`;
  }

  getSpellIconUrl(imageName: string): string {
    return `${this.baseUrl}/cdn/${this.currentVersion}/img/spell/${imageName}`;
  }

  getItemIconUrl(imageName: string): string {
    return `${this.baseUrl}/cdn/${this.currentVersion}/img/item/${imageName}`;
  }

  getItemCatalog(): Observable<{ version: string; all: Record<string, ItemDetailData> }> {
    if (this.itemDetailCache) {
      return this.getLatestVersion().pipe(map(version => ({ version, all: this.itemDetailCache! })));
    }
    return this.getLatestVersion().pipe(
      switchMap(version => this.http.get<any>(`${this.baseUrl}/cdn/${version}/data/es_ES/item.json`).pipe(
        tap(data => this.itemDetailCache = data.data),
        map(data => ({ version, all: data.data as Record<string, ItemDetailData> }))
      ))
    );
  }

  getAbilityCatalog(): Observable<AbilityCatalog> {
    if (!this.abilityCatalog$) {
      this.abilityCatalog$ = this.getLatestVersion().pipe(
        switchMap(version => forkJoin({
          full: this.http.get<any>(`${this.baseUrl}/cdn/${version}/data/es_ES/championFull.json`),
          summoner: this.http.get<any>(`${this.baseUrl}/cdn/${version}/data/es_ES/summoner.json`)
        }).pipe(map(({ full, summoner }) => this.parseAbilityCatalog(version, full.data, summoner.data)))),
        shareReplay(1)
      );
    }
    return this.abilityCatalog$;
  }

  private parseAbilityCatalog(version: string, champions: Record<string, any>, summoners: Record<string, any>): AbilityCatalog {
    const slots: AbilityKey[] = ['Q', 'W', 'E', 'R'];
    const spells: AbilityRow[] = [];

    for (const ch of Object.values(champions)) {
      spells.push({
        id: `${ch.id}_P`, key: 'P', name: ch.passive.name, owner: ch.name, ownerId: ch.id,
        icon: this.getPassiveIconUrl(ch.passive.image.full), desc: stripAbilityHtml(ch.passive.description),
        cost: 'none', range: 'self', cd: -1,
        stats: [
          { label: 'Enfriamiento', value: '—' },
          { label: 'Coste', value: 'Sin coste' },
          { label: 'Alcance', value: 'Propio' },
          { label: 'Rangos', value: 'Pasiva' }
        ]
      });

      (ch.spells || []).forEach((sp: any, i: number) => {
        const cost = abilityCostKind(sp);
        const range = abilityRangeKind(sp);
        spells.push({
          id: `${ch.id}_${slots[i]}`, key: slots[i], name: sp.name, owner: ch.name, ownerId: ch.id,
          icon: this.getSpellIconUrl(sp.image.full), desc: stripAbilityHtml(sp.description),
          cost, range, cd: abilityCooldown(sp.cooldownBurn),
          stats: [
            { label: 'Enfriamiento', value: sp.cooldownBurn ? `${String(sp.cooldownBurn).replace(/\//g, ' / ')} s` : '—' },
            { label: 'Coste', value: cost === 'none' ? 'Sin coste' : `${String(sp.costBurn).replace(/\//g, ' / ')} ${(sp.costType || '').toLowerCase()}`.trim() },
            { label: 'Alcance', value: range === 'self' ? 'Propio' : String(sp.rangeBurn).replace(/\//g, ' / ') },
            { label: 'Rangos', value: String(sp.maxrank) }
          ]
        });
      });
    }

    const summonerRows: AbilityRow[] = Object.values(summoners).map((s: any) => ({
      id: s.id, key: 'S', name: s.name, owner: 'Hechizo de invocador', ownerId: null,
      icon: this.getSpellIconUrl(s.image.full), desc: stripAbilityHtml(s.description),
      cost: 'none', range: 'self', cd: abilityCooldown(s.cooldownBurn),
      stats: [
        { label: 'Enfriamiento', value: `${s.cooldownBurn} s` },
        { label: 'Nivel requerido', value: String(s.summonerLevel) },
        { label: 'Modos', value: `${(s.modes || []).length} modos de juego` },
        { label: 'Tipo', value: 'Invocador' }
      ]
    }));

    return { version, spells, summoners: summonerRows };
  }

  getItemDetail(id: string): Observable<{ version: string; item: ItemDetailData; all: Record<string, ItemDetailData> }> {
    return this.getItemCatalog().pipe(
      map(({ version, all }) => ({ version, all, item: { ...all[id], id } as ItemDetailData }))
    );
  }
}
