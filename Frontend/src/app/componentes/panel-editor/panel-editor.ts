import { Component, signal, computed, inject, effect, ElementRef, viewChild } from '@angular/core';
import { ResaltadoService, Lenguaje } from '../../servicios/resaltado.service';
import { AnalisisService } from '../../servicios/analisis.service';
import { ArchivosAbiertosService } from '../../servicios/archivos-abiertos.service';
import { ApiService } from '../../servicios/api.service';

@Component({
    selector: 'app-panel-editor',
    imports: [],
    templateUrl: './panel-editor.html',
    styleUrl: './panel-editor.css'
})
export class PanelEditor {
    private readonly resaltado = inject(ResaltadoService);
    private readonly analisis = inject(AnalisisService);
    private readonly api = inject(ApiService);
    protected readonly archivosService = inject(ArchivosAbiertosService);

    /** Lista de pestañas abiertas. */
    protected readonly archivos = this.archivosService.archivos;

    /** Archivo activo en la pestaña visible. */
    protected readonly archivoActivo = this.archivosService.archivoActivo;

    /** Lenguaje detectado del archivo activo. */
    protected readonly lenguaje = computed<Lenguaje>(() => {
        const a = this.archivoActivo();
        return a ? this.detectarLenguaje(a.ruta) : 'plano';
    });

    /** True si el archivo activo tiene cambios sin guardar. */
    protected readonly sucio = computed(() => {
        const a = this.archivoActivo();
        return a ? a.contenidoActual !== a.contenidoOriginal : false;
    });

    /** Codigo actual del archivo activo (para el textarea). */
    protected readonly codigo = computed(() => this.archivoActivo()?.contenidoActual ?? '');

    /** HTML resaltado para mostrar */
    protected readonly htmlResaltado = computed(() => {
        const tokens = this.resaltado.tokenizar(this.codigo(), this.lenguaje());
        const html = this.resaltado.aHtml(tokens);
        return html.endsWith('\n') ? html + ' ' : html;
    });

    protected readonly esArchivoBinario = computed(() => {
        const a = this.archivoActivo();
        if (!a) return false;
        return a.ruta === 'database.db' || a.ruta.endsWith('/database.db');
    });

    protected readonly mensajeError = signal<string>('');
    protected readonly mensajeGuardado = signal<string>('');

    private readonly areaRef = viewChild<ElementRef<HTMLTextAreaElement>>('area');
    private readonly preRef = viewChild<ElementRef<HTMLPreElement>>('pre');
    private readonly lineasRef = viewChild<ElementRef<HTMLDivElement>>('lineas');

    constructor() {
        effect(() => {
            this.archivoActivo();
            this.mensajeError.set('');
            this.mensajeGuardado.set('');
        });
            effect(() => {
            const trigger = this.analisis.solicitudReanalisis();
            if (trigger > 0 && this.archivoActivo()) {
                this.analizar();
            }
        });
    }

    /** Devuelve solo el nombre del archivo (sin la ruta de carpetas) para la pestaña. */
    nombreCorto(ruta: string): string {
        const partes = ruta.split('/');
        return partes[partes.length - 1];
    }

    activarPestana(ruta: string): void {
        this.archivosService.activar(ruta);
    }

    cerrarPestana(ruta: string, event: Event): void {
        event.stopPropagation();
        if (this.archivosService.estaSucio(ruta)) {
            const ok = confirm(`El archivo "${this.nombreCorto(ruta)}" tiene cambios sin guardar. Cerrar de todos modos?`);
            if (!ok) return;
        }
        this.archivosService.cerrar(ruta);
    }

    onInput(event: Event): void {
        const target = event.target as HTMLTextAreaElement;
        const archivo = this.archivoActivo();
        if (!archivo) return;
        this.archivosService.actualizarContenido(archivo.ruta, target.value);
        if (this.mensajeGuardado()) {
            this.mensajeGuardado.set('');
        }
    }

    onScroll(): void {
        const area = this.areaRef()?.nativeElement;
        const pre = this.preRef()?.nativeElement;
        const lineas = this.lineasRef()?.nativeElement;
        if (area && pre) {
            pre.scrollTop = area.scrollTop;
            pre.scrollLeft = area.scrollLeft;
        }
        if (area && lineas) {
            lineas.scrollTop = area.scrollTop;
        }
    }

    onKeydown(event: KeyboardEvent): void {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            this.guardar();
        }
    }

    guardar(): void {
        const archivo = this.archivoActivo();
        if (!archivo || !this.sucio()) return;

        const contenido = archivo.contenidoActual;
        this.mensajeError.set('');

        this.api.guardarArchivo(archivo.proyecto, archivo.ruta, contenido).subscribe({
            next: () => {
                this.archivosService.marcarGuardado(archivo.ruta);
                this.mensajeGuardado.set('Guardado');
                setTimeout(() => {
                    if (this.mensajeGuardado() === 'Guardado') {
                        this.mensajeGuardado.set('');
                    }
                }, 1500);
            },
            error: (err) => {
                const detalle = err.error?.error || err.message || 'error desconocido';
                this.mensajeError.set('No se pudo guardar: ' + detalle);
            }
        });
    }

    analizar(): void {
        const archivo = this.archivoActivo();
        if (!archivo) return;

        this.analisis.analizar(this.codigo(), this.lenguaje(), {
            proyecto: archivo.proyecto,
            rutaArchivo: archivo.ruta
        });
    }

    limpiarAnalisis(): void {
        this.analisis.limpiar();
    }

    private detectarLenguaje(ruta: string): Lenguaje {
        if (ruta.endsWith('.styles')) return 'styles';
        if (ruta.endsWith('.comp')) return 'comp';
        if (ruta.endsWith('.y')) return 'y';
        return 'plano';
    }
    
    protected readonly numerosLinea = computed(() => {
    const lineas = this.codigo().split('\n').length;
    return Array.from({ length: Math.max(lineas, 1) }, (_, i) => i + 1);
    });
}