import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-nav-button',
    imports: [],
    templateUrl: './nav-button.component.html',
    styleUrl: './nav-button.component.scss'
})
export class NavButtonComponent {
  @Input() text: string = '';
  @Input() route?: string;

  constructor(private router: Router) {}

  onClick(): void {
    if (this.route) {
      this.router.navigate([this.route]);
    }
  }
}
