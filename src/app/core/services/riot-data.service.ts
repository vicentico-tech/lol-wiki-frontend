import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, switchMap, map } from 'rxjs';
import { ChampionData, ChampionDetailData, ItemData, ItemDetailData } from '../../interfaces/riot-data.interface';

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

  getItemDetail(id: string): Observable<{ version: string; item: ItemDetailData; all: Record<string, ItemDetailData> }> {
    return this.getItemCatalog().pipe(
      map(({ version, all }) => ({ version, all, item: { ...all[id], id } as ItemDetailData }))
    );
  }
}
