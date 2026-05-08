import { Injectable, inject, signal } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from './api.service';
import { ErrorYFERA } from '../modelos/error-yfera.model';
import { Lenguaje } from './resaltado.service';

export interface ContextoAnalisis {
    proyecto: string | null;
    rutaArchivo: string | null;
}

@Injectable({ providedIn: 'root' })
export class AnalisisService {
    private readonly api = inject(ApiService);

    readonly errores = signal<ErrorYFERA[]>([]);
    readonly css = signal<string>('');
    readonly html = signal<string>('');
    readonly js = signal<string>('');
    readonly analizando = signal<boolean>(false);
    readonly solicitudReanalisis = signal<number>(0);

    analizar(codigo: string, lenguaje: Lenguaje, contexto?: ContextoAnalisis): void {
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
                    this.js.set('');
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
                    this.js.set('');
                    this.analizando.set(false);
                });
            return;
        }

        if (lenguaje === 'y') {
            const proyecto = contexto?.proyecto ?? null;
            const rutaArchivo = contexto?.rutaArchivo ?? null;
            this.api.analizarY(codigo, proyecto, rutaArchivo)
                .pipe(catchError(this.manejarErrorRed))
                .subscribe((resp: any) => {
                    this.errores.set(resp.errores || []);
                    this.html.set(resp.html || '');
                    this.css.set('');
                    this.js.set('');
                    this.analizando.set(false);
                });
            return;
        }

        // Otros lenguajes: limpiar
        this.limpiar();
        this.analizando.set(false);
    }

    limpiar(): void {
        this.errores.set([]);
        this.css.set('');
        this.html.set('');
        this.js.set('');
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
            html: '',
            js: ''
        });
    };
    
    solicitarReanalisis(): void {
        this.solicitudReanalisis.set(this.solicitudReanalisis() + 1);
    }
}