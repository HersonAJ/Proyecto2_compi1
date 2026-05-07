import { Component, inject, signal, computed, effect } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ApiService } from '../../servicios/api.service';
import { ProyectoService } from '../../servicios/proyecto.service';
import { ArchivoActivoService } from '../../servicios/archivo-activo.service';
import { NodoArbol } from '../../modelos/arbol.model';

@Component({
    selector: 'app-panel-arbol',
    imports: [NgTemplateOutlet],
    templateUrl: './panel-arbol.html',
    styleUrl: './panel-arbol.css',
})
export class PanelArbol {
    private readonly api = inject(ApiService);
    protected readonly proyectoService = inject(ProyectoService);
    private readonly archivoService = inject(ArchivoActivoService);

    protected readonly arbol = signal<NodoArbol | null>(null);
    protected readonly cargando = signal<boolean>(false);
    protected readonly mensajeError = signal<string>('');

    //Conjunto de rutas de carpetas expandidas.
    protected readonly carpetasExpandidas = signal<Set<string>>(new Set());

    //Carpeta donde se crearan los nuevos archivos/carpetas. '' = raiz
    protected readonly carpetaActiva = signal<string>('');

    //Ruta del archivo actualmente seleccionado
    protected readonly rutaActiva = computed(() => this.archivoService.archivo()?.ruta ?? null);

    constructor() {
        effect(() => {
            const proyecto = this.proyectoService.proyectoActivo();
            if (proyecto) {
                this.recargar();
            } else {
                this.arbol.set(null);
            }
        });
    }

    recargar(): void {
        const proyecto = this.proyectoService.proyectoActivo();
        if (!proyecto) return;

        this.cargando.set(true);
        this.mensajeError.set('');

        this.api.listarArchivos(proyecto).subscribe({
            next: (resp) => {
                this.arbol.set(resp.arbol);
                this.carpetasExpandidas.set(new Set(['']));
                this.carpetaActiva.set('');
                this.cargando.set(false);
            },
            error: (err) => {
                const detalle = err.error?.error || err.message || 'error desconocido';
                this.mensajeError.set('No se pudo cargar el arbol: ' + detalle);
                this.cargando.set(false);
            }
        });
    }

    //Click en una carpeta: la marca como activa y alterna su expansion
    clickCarpeta(ruta: string): void {
        this.carpetaActiva.set(ruta);
        const set = new Set(this.carpetasExpandidas());
        if (set.has(ruta)) {
            set.delete(ruta);
        } else {
            set.add(ruta);
        }
        this.carpetasExpandidas.set(set);
    }

    estaExpandida(ruta: string): boolean {
        return this.carpetasExpandidas().has(ruta);
    }

    abrirArchivo(nodo: NodoArbol): void {
        const proyecto = this.proyectoService.proyectoActivo();
        if (!proyecto) return;

        this.api.leerArchivo(proyecto, nodo.ruta).subscribe({
            next: (resp) => {
                this.archivoService.abrir(proyecto, resp.ruta, resp.contenido);
            },
            error: (err) => {
                const detalle = err.error?.error || err.message || 'error desconocido';
                this.mensajeError.set('No se pudo leer el archivo: ' + detalle);
            }
        });
    }

    crearArchivo(): void {
        const proyecto = this.proyectoService.proyectoActivo();
        if (!proyecto) return;

        const padre = this.carpetaActiva();
        const ubicacion = padre === '' ? 'la raiz' : padre;
        const nombre = prompt(`Nombre del archivo (se creara en: ${ubicacion}):`);
        if (!nombre || !nombre.trim()) return;

        const rutaCompleta = padre === '' ? nombre.trim() : `${padre}/${nombre.trim()}`;

        this.mensajeError.set('');
        this.api.guardarArchivo(proyecto, rutaCompleta, '').subscribe({
            next: () => {
                // Asegurar que la carpeta padre quede expandida para ver el archivo nuevo
                const set = new Set(this.carpetasExpandidas());
                set.add(padre);
                this.carpetasExpandidas.set(set);
                this.recargar();
            },
            error: (err) => {
                const detalle = err.error?.error || err.message || 'error desconocido';
                this.mensajeError.set('No se pudo crear el archivo: ' + detalle);
            }
        });
    }

    crearCarpeta(): void {
        const proyecto = this.proyectoService.proyectoActivo();
        if (!proyecto) return;

        const padre = this.carpetaActiva();
        const ubicacion = padre === '' ? 'la raiz' : padre;
        const nombre = prompt(`Nombre de la carpeta (se creara en: ${ubicacion}):`);
        if (!nombre || !nombre.trim()) return;

        const rutaCompleta = padre === '' ? nombre.trim() : `${padre}/${nombre.trim()}`;

        this.mensajeError.set('');
        this.api.crearCarpeta(proyecto, rutaCompleta).subscribe({
            next: () => {
                const set = new Set(this.carpetasExpandidas());
                set.add(padre);
                this.carpetasExpandidas.set(set);
                this.recargar();
            },
            error: (err) => {
                const detalle = err.error?.error || err.message || 'error desconocido';
                this.mensajeError.set('No se pudo crear la carpeta: ' + detalle);
            }
        });
    }

    eliminar(nodo: NodoArbol, event: Event): void {
        event.stopPropagation();
        const proyecto = this.proyectoService.proyectoActivo();
        if (!proyecto) return;

        const tipo = nodo.tipo === 'carpeta' ? 'la carpeta' : 'el archivo';
        const ok = confirm(`Seguro que deseas eliminar ${tipo} "${nodo.nombre}"?`);
        if (!ok) return;

        this.api.eliminarArchivoOCarpeta(proyecto, nodo.ruta).subscribe({
            next: () => {
                const activo = this.archivoService.archivo();
                if (activo && activo.ruta === nodo.ruta) {
                    this.archivoService.cerrar();
                }
                // Si la carpeta activa es la que se elimino, regresar a la raiz
                if (this.carpetaActiva() === nodo.ruta) {
                    this.carpetaActiva.set('');
                }
                this.recargar();
            },
            error: (err) => {
                const detalle = err.error?.error || err.message || 'error desconocido';
                this.mensajeError.set('No se pudo eliminar: ' + detalle);
            }
        });
    }

    salirDelProyecto(): void {
        const ok = confirm('Cerrar el proyecto actual y volver al selector?');
        if (!ok) return;
        this.archivoService.cerrar();
        this.proyectoService.limpiar();
    }
}