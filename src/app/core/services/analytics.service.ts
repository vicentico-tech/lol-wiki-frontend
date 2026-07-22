import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private readonly router: Router) {}

  init(): void {
    if (!environment.production) {
      return;
    }

    this.injectGtmScript();
    this.injectGtmNoscript();
    this.trackRouteChanges();
  }

  pushEvent(event: Record<string, unknown>): void {
    if (!environment.production) {
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
  }

  private trackRouteChanges(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.pushEvent({
          event: 'page_view',
          page_path: event.urlAfterRedirects
        });
      }
    });
  }

  private injectGtmScript(): void {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${environment.gtmId}&l=dataLayer`;
    document.head.insertBefore(script, document.head.firstChild);
  }

  private injectGtmNoscript(): void {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${environment.gtmId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';

    const noscript = document.createElement('noscript');
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  }
}
