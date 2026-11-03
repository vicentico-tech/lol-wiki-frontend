import { Component, signal } from '@angular/core';
import { ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RiotDataService } from '../../core/services/riot-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ItemDetailData, ParsedItem, Filters } from '../../interfaces/riot-data.interface';

const CATEGORY_ES: Record<string, string> = {
  Damage: 'Daño de ataque',
  SpellDamage: 'Poder de habilidad',
  Health: 'Vida',
  Armor: 'Armadura',
  SpellBlock: 'Resist. mágica',
  AttackSpeed: 'Vel. de ataque',
  CriticalStrike: 'Crítico',
  Mana: 'Maná',
  Boots: 'Botas',
  Consumable: 'Consumibles',
  Vision: 'Visión'
};


function isPurchasable(item: ItemDetailData): boolean {
  return !!item.gold.purchasable && item.gold.total > 0 && !!item.maps?.['11'] && !item.requiredAlly && item.inStore !== false;
}

function deriveRarity(it: ItemDetailData): 'basic' | 'epic' | 'legendary' {
  const depth = it.depth ?? 1;
  if (depth >= 3 || (depth === 2 && !it.into?.length)) return 'legendary';
  if (depth === 2) return 'epic';
  return 'basic';
}

@Component({
  selector: 'app-item-list',
  imports: [],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemListComponent implements OnInit {

  itemDataCatalog = signal<ItemDetailData[]>([]);




  constructor(private riotService: RiotDataService, private analytics: AnalyticsService) { }


  ngOnInit(): void {
    this.getItemList();
  }


  getItemList() {
    this.riotService.getItemCatalog().subscribe({
      next: itemCatalog => {
        this.itemDataCatalog.set(itemCatalog.all ? Object.values(itemCatalog.all) : []);
      },
      error: err => {
        console.error('Error fetching item catalog:', err);
      }
    })
  }

}


