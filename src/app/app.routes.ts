import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'campeones',
    loadComponent: () =>
      import('./features/champion-list/champion-list.component').then(m => m.ChampionListComponent)
  }
];
