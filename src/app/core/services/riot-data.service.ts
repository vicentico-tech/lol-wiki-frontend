import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, switchMap, map } from 'rxjs';

export interface ChampionData {
  id: string;
  name: string;
  title: string;
  blurb: string;
  image: { full: string; sprite: string; group: string; x: number; y: number; w: number; h: number };
}

export interface ItemData {
  name: string;
  description: string;
  plaintext: string;
  image: { full: string };
}

export interface ItemDetailData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  gold: { total: number; sell: number };
  stats: Record<string, number>;
  from?: string[];
  into?: string[];
  image: { full: string };
}

export interface ChampionDetailData {
  id: string;
  name: string;
  title: string;
  tags: string[];
  partype: string;
  info: { difficulty: number };
  stats: Record<string, number>;
  passive: { name: string; description: string; image: { full: string } };
  spells: Array<{
    name: string;
    description: string;
    costBurn: string;
    cooldownBurn: string;
    image: { full: string };
  }>;
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

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la versión actual de Data Dragon.
   */
  getLatestVersion(): Observable<string> {
    if (this.currentVersion) {
      return of(this.currentVersion);
    }
    return this.http.get<string[]>(`${this.baseUrl}/api/versions.json`).pipe(
      map(versions => versions[0]),
      tap(version => this.currentVersion = version)
    );
  }

  /**
   * Obtiene el catálogo de campeones en español.
   */
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

  /**
   * Obtiene el catálogo de objetos en español.
   */
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

  /**
   * Obtiene el detalle completo de un campeón (stats + habilidades).
   */
  getChampionDetail(id: string): Observable<{ version: string; champion: ChampionDetailData }> {
    return this.getLatestVersion().pipe(
      switchMap(version => this.http.get<any>(`${this.baseUrl}/cdn/${version}/data/es_ES/champion/${id}.json`).pipe(
        map(res => ({ version, champion: res.data[id] as ChampionDetailData }))
      ))
    );
  }

  /**
   * Helper para obtener la URL del splash art de un campeón.
   */
  getChampionSplashUrl(id: string): string {
    return `${this.baseUrl}/cdn/img/champion/splash/${id}_0.jpg`;
  }

  /**
   * Helper para obtener la URL del icono de un campeón.
   */
  getChampionIconUrl(imageName: string): string {
    return `${this.baseUrl}/cdn/${this.currentVersion}/img/champion/${imageName}`;
  }

  /**
   * Helper para obtener la URL del icono de una pasiva.
   */
  getPassiveIconUrl(imageName: string): string {
    return `${this.baseUrl}/cdn/${this.currentVersion}/img/passive/${imageName}`;
  }

  /**
   * Helper para obtener la URL del icono de una habilidad (Q/W/E/R).
   */
  getSpellIconUrl(imageName: string): string {
    return `${this.baseUrl}/cdn/${this.currentVersion}/img/spell/${imageName}`;
  }

  /**
   * Helper para obtener la URL del icono de un objeto.
   */
  getItemIconUrl(imageName: string): string {
    return `${this.baseUrl}/cdn/${this.currentVersion}/img/item/${imageName}`;
  }

  /**
   * Obtiene el catálogo completo de objetos (item.json) en español, cacheado en memoria.
   * Se usa tanto para el detalle de un objeto como para resolver "Compuesto por"/"Se combina en".
   */
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

  /**
   * Obtiene el detalle completo de un objeto (stats, precio, receta).
   */
  getItemDetail(id: string): Observable<{ version: string; item: ItemDetailData; all: Record<string, ItemDetailData> }> {
    return this.getItemCatalog().pipe(
      map(({ version, all }) => ({ version, all, item: { ...all[id], id } as ItemDetailData }))
    );
  }
}
