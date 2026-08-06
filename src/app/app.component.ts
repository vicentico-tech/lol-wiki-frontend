import { Component } from '@angular/core';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { AnalyticsService } from './core/services/analytics.service';

@Component({
    selector: 'app-root',
    imports: [MainLayoutComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'lol-wiki-frontend';

  constructor(analytics: AnalyticsService) {
    analytics.init();
  }
}
