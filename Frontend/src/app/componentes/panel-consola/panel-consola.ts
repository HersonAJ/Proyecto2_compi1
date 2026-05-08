import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalisisService } from '../../servicios/analisis.service';
import { SqlService } from '../../servicios/sql.service';
import { ProyectoService } from '../../servicios/proyecto.service';

@Component({
    selector: 'app-panel-consola',
    imports: [FormsModule],
    templateUrl: './panel-consola.html',
    styleUrl: './panel-consola.css'
})
export class PanelConsola {
    private readonly analisis = inject(AnalisisService);
    protected readonly sql = inject(SqlService);
    private readonly proyectoService = inject(ProyectoService);

    protected readonly tabActiva = signal<'errores' | 'sql'>('errores');
    protected readonly errores = this.analisis.errores;
    protected readonly analizando = this.analisis.analizando;

    protected readonly cantidadErrores = computed(() => this.errores().length);
    protected readonly historialSql = this.sql.historial;
    protected readonly ejecutandoSql = this.sql.ejecutando;
    protected readonly proyectoActivo = this.proyectoService.proyectoActivo;

    protected readonly queryActual = signal<string>('');

    cambiarTab(tab: 'errores' | 'sql'): void {
        this.tabActiva.set(tab);
    }

    onQueryChange(valor: string): void {
        this.queryActual.set(valor);
    }

    ejecutarSql(): void {
        const proyecto = this.proyectoActivo();
        if (!proyecto) return;
        const codigo = this.queryActual().trim();
        if (!codigo) return;

        this.sql.ejecutar(codigo, proyecto);
        this.queryActual.set('');
    }

    limpiarSql(): void {
        this.sql.limpiarHistorial();
    }

    onKeydownSql(event: KeyboardEvent): void {
        // Ctrl+Enter ejecuta
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            this.ejecutarSql();
        }
    }

    formatearHora(d: Date): string {
        return d.toLocaleTimeString();
    }
}