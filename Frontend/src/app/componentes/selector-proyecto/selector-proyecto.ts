import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../servicios/api.service';
import { ProyectoService } from '../../servicios/proyecto.service';

@Component({
    selector: 'app-selector-proyecto',
    imports: [FormsModule],
    templateUrl: './selector-proyecto.html',
    styleUrl: './selector-proyecto.css'
})
export class SelectorProyecto implements OnInit {
    private readonly api = inject(ApiService);
    private readonly proyectoService = inject(ProyectoService);

    protected readonly proyectos = signal<string[]>([]);
    protected readonly cargando = signal<boolean>(false);
    protected readonly nuevoNombre = signal<string>('');
    protected readonly mensajeError = signal<string>('');

    ngOnInit(): void {
        this.recargar();
    }

    recargar(): void {
        this.cargando.set(true);
        this.mensajeError.set('');
        this.api.listarProyectos().subscribe({
            next: (resp) => {
                this.proyectos.set(resp.proyectos);
                this.cargando.set(false);
            },
            error: (err) => {
                this.mensajeError.set('No se pudo conectar al backend: ' + (err.message || ''));
                this.cargando.set(false);
            }
        });
    }

    crearProyecto(): void {
        const nombre = this.nuevoNombre().trim();
        if (!nombre) {
            this.mensajeError.set('El nombre no puede estar vacio.');
            return;
        }
        this.mensajeError.set('');
        this.api.crearProyecto(nombre).subscribe({
            next: () => {
                this.nuevoNombre.set('');
                this.recargar();
            },
            error: (err) => {
                const detalle = err.error?.error || err.message || 'error desconocido';
                this.mensajeError.set('No se pudo crear: ' + detalle);
            }
        });
    }

    abrirProyecto(nombre: string): void {
        this.proyectoService.seleccionar(nombre);
    }

    eliminarProyecto(nombre: string, event: Event): void {
        event.stopPropagation();
        const ok = confirm('Seguro que deseas eliminar el proyecto "' + nombre + '" y todos sus archivos?');
        if (!ok) return;

        this.api.eliminarProyecto(nombre).subscribe({
            next: () => this.recargar(),
            error: (err) => {
                const detalle = err.error?.error || err.message || 'error desconocido';
                this.mensajeError.set('No se pudo eliminar: ' + detalle);
            }
        });
    }

    onNombreChange(valor: string): void {
        this.nuevoNombre.set(valor);
    }
}