import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { ErrorYFERA } from '../modelos/error-yfera.model';
import { ResultadoSQL } from '../modelos/respuesta-analisis.model';

export interface EntradaHistorial {
    codigo: string;
    timestamp: Date;
    resultados: ResultadoSQL[];
    errores: ErrorYFERA[];
}

@Injectable({ providedIn: 'root' })
export class SqlService {
    private readonly api = inject(ApiService);

    private readonly _historial = signal<EntradaHistorial[]>([]);
    readonly historial = this._historial.asReadonly();
    readonly ejecutando = signal<boolean>(false);

    ejecutar(codigo: string, proyecto: string): void {
        if (!codigo.trim() || !proyecto) return;

        this.ejecutando.set(true);

        this.api.ejecutarSQL(codigo, proyecto).subscribe({
            next: (resp) => {
                this._historial.set([
                    ...this._historial(),
                    {
                        codigo: codigo,
                        timestamp: new Date(),
                        resultados: resp.resultados || [],
                        errores: resp.errores || []
                    }
                ]);
                this.ejecutando.set(false);
            },
            error: (err) => {
                const detalle = err.error?.error || err.message || 'error desconocido';
                this._historial.set([
                    ...this._historial(),
                    {
                        codigo: codigo,
                        timestamp: new Date(),
                        resultados: [],
                        errores: [{
                            tipo: 'SintacticoFatal',
                            lexema: '',
                            linea: 0,
                            columna: 0,
                            mensaje: 'Error de red: ' + detalle
                        }]
                    }
                ]);
                this.ejecutando.set(false);
            }
        });
    }

    limpiarHistorial(): void {
        this._historial.set([]);
    }
}