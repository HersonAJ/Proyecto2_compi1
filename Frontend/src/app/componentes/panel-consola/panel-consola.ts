import { Component, signal, inject, computed } from '@angular/core';
import { AnalisisService } from '../../servicios/analisis.service';

@Component({
    selector: 'app-panel-consola',
    imports: [],
    templateUrl: './panel-consola.html',
    styleUrl: './panel-consola.css'
})
export class PanelConsola {
    private readonly analisis = inject(AnalisisService);

    protected readonly tabActiva = signal<'errores' | 'sql'>('errores');
    protected readonly errores = this.analisis.errores;
    protected readonly analizando = this.analisis.analizando;

    protected readonly cantidadErrores = computed(() => this.errores().length);

    cambiarTab(tab: 'errores' | 'sql'): void {
        this.tabActiva.set(tab);
    }
}