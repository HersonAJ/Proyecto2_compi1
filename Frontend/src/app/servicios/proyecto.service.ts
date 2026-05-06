import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProyectoService {
    /**
     * Nombre del proyecto activo. null si todavia no se eligio uno.
     */
    readonly proyectoActivo = signal<string | null>(null);

    seleccionar(nombre: string): void {
        this.proyectoActivo.set(nombre);
    }

    limpiar(): void {
        this.proyectoActivo.set(null);
    }
}