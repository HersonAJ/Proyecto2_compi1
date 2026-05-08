import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AnalisisService } from '../../servicios/analisis.service';

@Component({
    selector: 'app-panel-vista',
    imports: [],
    templateUrl: './panel-vista.html',
    styleUrl: './panel-vista.css',
})
export class PanelVista {
    private readonly analisis = inject(AnalisisService);
    private readonly sanitizer = inject(DomSanitizer);

    protected readonly tabActiva = signal<'preview' | 'fuente'>('preview');

    protected readonly html = this.analisis.html;
    protected readonly css = this.analisis.css;

    constructor() {
        // Escuchar mensajes del iframe (cuando un Submit pide recargar la vista)
        window.addEventListener('message', (ev: MessageEvent) => {
            if (ev.data && ev.data.tipo === 'yfera-recargar') {
                this.analisis.solicitarReanalisis();
            }
        });
    }

    protected readonly contenido = computed(() => {
        const html = this.html();
        const css = this.css();

        if (html) return html;
        if (css) {
            return `<!DOCTYPE html>
        <html><head><style>${css}</style></head>
        <body><div style="padding:1rem;color:#666;font-family:sans-serif">
        Vista previa del CSS generado. Aplicalo a un .comp o .y para verlo en accion.
        </div></body></html>`;
        }
        return '';
    });

    protected readonly contenidoSeguro = computed<SafeHtml>(() => {
        return this.sanitizer.bypassSecurityTrustHtml(this.contenido());
    });

    protected readonly tieneContenido = computed(() => this.contenido().length > 0);

    cambiarTab(tab: 'preview' | 'fuente'): void {
        this.tabActiva.set(tab);
    }
}