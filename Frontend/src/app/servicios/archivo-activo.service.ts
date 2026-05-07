import { Injectable, signal } from '@angular/core';

export interface ArchivoActivo {
    proyecto: string;
    ruta: string;        // ruta relativa dentro del proyecto
    contenido: string;   // contenido del archivo cargado
}

@Injectable({ providedIn: 'root' })
export class ArchivoActivoService {
    /**
     * Archivo actualmente abierto en el editor. null si no hay ninguno.
     */
    private readonly _archivo = signal<ArchivoActivo | null>(null);

    readonly archivo = this._archivo.asReadonly();

    abrir(proyecto: string, ruta: string, contenido: string): void {
        this._archivo.set({ proyecto, ruta, contenido });
    }

    actualizarContenido(contenido: string): void {
        const actual = this._archivo();
        if (actual) {
            this._archivo.set({ ...actual, contenido });
        }
    }

    cerrar(): void {
        this._archivo.set(null);
    }
}