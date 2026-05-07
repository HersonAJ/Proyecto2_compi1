import { Injectable, signal, computed } from '@angular/core';

export interface ArchivoAbierto {
    proyecto: string;
    ruta: string;
    contenidoOriginal: string;  // como esta en disco
    contenidoActual: string;    // como esta en el editor (puede tener cambios)
}

@Injectable({ providedIn: 'root' })
export class ArchivosAbiertosService {
    private readonly _archivos = signal<ArchivoAbierto[]>([]);
    private readonly _rutaActiva = signal<string | null>(null);

    readonly archivos = this._archivos.asReadonly();
    readonly rutaActiva = this._rutaActiva.asReadonly();

    /** Archivo de la pestaña actualmente visible. */
    readonly archivoActivo = computed(() => {
        const ruta = this._rutaActiva();
        if (!ruta) return null;
        return this._archivos().find(a => a.ruta === ruta) || null;
    });

    estaAbierto(ruta: string): boolean {
        return this._archivos().some(a => a.ruta === ruta);
    }

    /** Abre un archivo nuevo en pestaña, o lo activa si ya estaba abierto. */
    abrir(proyecto: string, ruta: string, contenido: string): void {
        if (this.estaAbierto(ruta)) {
            this._rutaActiva.set(ruta);
            return;
        }
        const nuevo: ArchivoAbierto = {
            proyecto,
            ruta,
            contenidoOriginal: contenido,
            contenidoActual: contenido
        };
        this._archivos.set([...this._archivos(), nuevo]);
        this._rutaActiva.set(ruta);
    }

    activar(ruta: string): void {
        if (this.estaAbierto(ruta)) {
            this._rutaActiva.set(ruta);
        }
    }

    cerrar(ruta: string): void {
        const restantes = this._archivos().filter(a => a.ruta !== ruta);
        this._archivos.set(restantes);
        if (this._rutaActiva() === ruta) {
            this._rutaActiva.set(restantes.length > 0 ? restantes[restantes.length - 1].ruta : null);
        }
    }

    /** Actualiza el contenido en edicion */
    actualizarContenido(ruta: string, contenido: string): void {
        this._archivos.set(this._archivos().map(a =>
            a.ruta === ruta ? { ...a, contenidoActual: contenido } : a
        ));
    }

    /** Marca como guardado: el contenido actual pasa a ser el "original". */
    marcarGuardado(ruta: string): void {
        this._archivos.set(this._archivos().map(a =>
            a.ruta === ruta ? { ...a, contenidoOriginal: a.contenidoActual } : a
        ));
    }

    estaSucio(ruta: string): boolean {
        const a = this._archivos().find(x => x.ruta === ruta);
        return a ? a.contenidoActual !== a.contenidoOriginal : false;
    }

    cerrarTodos(): void {
        this._archivos.set([]);
        this._rutaActiva.set(null);
    }
}