import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'campeones',
    loadComponent: () =>
      import('./features/champion-list/champion-list.component').then(m => m.ChampionListComponent)
  },
  {
    path: 'objetos',
    loadComponent: () =>
      import('./features/item-list/item-list.component').then(m => m.ItemListComponent)
  },
  {
    path: 'habilidades',
    loadComponent: () =>
      import('./features/ability-list/ability-list.component').then(m => m.AbilityListComponent)
  },
];
