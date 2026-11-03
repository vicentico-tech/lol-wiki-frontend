import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AbilityKey, AbilityRow } from '../../interfaces/riot-data.interface';

const KEY_LABEL: Record<AbilityKey, string> = {
  P: 'Pasiva',
  Q: 'Tecla Q',
  W: 'Tecla W',
  E: 'Tecla E',
  R: 'Definitiva · R',
  S: 'Invocador'
};

@Component({
  selector: 'app-ability-detail',
  templateUrl: './ability-detail.component.html',
  styleUrl: './ability-detail.component.scss'
})
export class AbilityDetailComponent implements OnInit, OnDestroy {
  @Input({ required: true }) ability!: AbilityRow;
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  get keyLabel(): string {
    return KEY_LABEL[this.ability.key];
  }

  ngOnInit(): void {
    document.body.classList.add('modal-open');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  viewChampion(): void {
    if (!this.ability.ownerId) {
      return;
    }
    this.router.navigate(['/campeones'], { queryParams: { open: this.ability.ownerId } });
  }
}
