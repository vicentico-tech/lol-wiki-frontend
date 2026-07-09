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

@Injectable({
  providedIn: 'root'
})
export class RiotDataService {
  private readonly baseUrl = 'https://ddragon.leagueoflegends.com';
  
  private currentVersion: string = '';
  private championsCache: Record<string, ChampionData> | null = null;
  private itemsCache: Record<string, ItemData> | null = null;

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
   * Helper para obtener la URL del icono de un campeón.
   */
  getChampionIconUrl(imageName: string): string {
    return `${this.baseUrl}/cdn/${this.currentVersion}/img/champion/${imageName}`;
  }

  /**
   * Helper para obtener la URL del icono de un objeto.
   */
  getItemIconUrl(imageName: string): string {
    return `${this.baseUrl}/cdn/${this.currentVersion}/img/item/${imageName}`;
  }
}
