import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-panel-consola',
  imports: [],
  templateUrl: './panel-consola.html',
  styleUrl: './panel-consola.css',
})
export class PanelConsola {

  protected readonly tabActiva = signal<'errores'  | 'sql'>('errores');

  cambiarTab(tab: 'errores' | 'sql'): void {
    this.tabActiva.set(tab);
  }
}
