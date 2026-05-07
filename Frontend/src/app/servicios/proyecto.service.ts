import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProyectoService {
    /**
     * Nombre del proyecto activo. null si todavía no se eligió uno.
     * Se inicializa leyendo de localStorage.
     */
    private readonly _proyectoActivo = signal<string | null>(
        localStorage.getItem('proyectoActivo')
    );

    readonly proyectoActivo = this._proyectoActivo.asReadonly();

    seleccionar(nombre: string): void {
        this._proyectoActivo.set(nombre);
        localStorage.setItem('proyectoActivo', nombre);
    }

    limpiar(): void {
        this._proyectoActivo.set(null);
        localStorage.removeItem('proyectoActivo');
    }
}