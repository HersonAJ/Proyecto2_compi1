import { Injectable, inject, signal } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from './api.service';
import { ErrorYFERA } from '../modelos/error-yfera.model';
import { Lenguaje } from './resaltado.service';

@Injectable({ providedIn: 'root' })
export class AnalisisService {
    private readonly api = inject(ApiService);

    readonly errores = signal<ErrorYFERA[]>([]);
    readonly css = signal<string>('');
    readonly html = signal<string>('');
    readonly analizando = signal<boolean>(false);

    /**
     * Analiza el codigo bajo demanda. Llama al endpoint correspondiente
     * segun el lenguaje y actualiza las signals.
     */
    analizar(codigo: string, lenguaje: Lenguaje): void {
        if (!codigo.trim()) {
            this.limpiar();
            return;
        }

        this.analizando.set(true);

        if (lenguaje === 'styles') {
            this.api.analizarEstilos(codigo)
                .pipe(catchError(this.manejarErrorRed))
                .subscribe((resp: any) => {
                    this.errores.set(resp.errores || []);
                    this.css.set(resp.css || '');
                    this.html.set('');
                    this.analizando.set(false);
                });
            return;
        }

        if (lenguaje === 'comp') {
            this.api.analizarComp(codigo)
                .pipe(catchError(this.manejarErrorRed))
                .subscribe((resp: any) => {
                    this.errores.set(resp.errores || []);
                    this.html.set(resp.html || '');
                    this.css.set('');
                    this.analizando.set(false);
                });
            return;
        }

        // Otros lenguajes: por ahora limpiar
        this.limpiar();
        this.analizando.set(false);
    }

    limpiar(): void {
        this.errores.set([]);
        this.css.set('');
        this.html.set('');
    }

    private manejarErrorRed = (err: any) => {
        return of({
            errores: [{
                tipo: 'SintacticoFatal' as const,
                lexema: '',
                linea: 0,
                columna: 0,
                mensaje: 'Error de red: ' + (err.message || 'no se pudo conectar al backend')
            }],
            css: '',
            html: ''
        });
    };
}