import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ItemListComponent } from './item-list.component';

const buyable = { purchasable: true, total: 1000, sell: 700 };

describe('ItemListComponent', () => {
  let component: ItemListComponent;
  let fixture: ComponentFixture<ItemListComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemListComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne('https://ddragon.leagueoflegends.com/api/versions.json').flush(['1.0.0']);
    http.expectOne('https://ddragon.leagueoflegends.com/cdn/1.0.0/data/es_ES/item.json').flush({
      data: {
        '1': { name: 'Espada', plaintext: 'Daño', tags: ['Damage'], depth: 1, into: ['2'], maps: { '11': true }, gold: buyable },
        '2': { name: 'Gran Espada', plaintext: '', tags: ['Damage'], depth: 2, from: ['1'], maps: { '11': true }, gold: { ...buyable, total: 3000 } },
        '3': { name: 'Objeto de Ornn', tags: [], maps: { '11': true }, requiredAlly: 'Ornn', gold: buyable },
        '4': { name: 'Retirado', tags: [], maps: { '11': false }, gold: buyable },
        '323004': { name: 'Gran Espada', tags: ['Damage'], depth: 2, maps: { '11': true }, gold: buyable }
      }
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps only purchasable Summoner\'s Rift items and derives rarity', () => {
    const items = component.items();
    expect(items.map(i => i.id)).toEqual(['1', '2']);
    expect(items.find(i => i.id === '1')?.rarity).toBe('basic');
    expect(items.find(i => i.id === '2')?.rarity).toBe('legendary');
  });

  it('combines filters and sorts by price', () => {
    component.setFilter('sort', 'price-desc');
    expect(component.filteredItems().map(i => i.id)).toEqual(['2', '1']);

    component.setFilter('price', 'gt3500');
    expect(component.filteredItems()).toEqual([]);

    component.resetFilters();
    component.toggleFinal();
    expect(component.filteredItems().map(i => i.id)).toEqual(['2']);
  });
});
