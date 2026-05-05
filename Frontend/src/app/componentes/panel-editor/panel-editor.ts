import { Component, signal, computed, inject, ElementRef, viewChild } from '@angular/core';
import { ResaltadoService, Lenguaje } from '../../servicios/resaltado.service';

@Component({
    selector: 'app-panel-editor',
    imports: [],
    templateUrl: './panel-editor.html',
    styleUrl: './panel-editor.css'
})
export class PanelEditor {
    private readonly resaltado = inject(ResaltadoService);

    // Estado del editor
    protected readonly codigo = signal<string>(this.codigoEjemploStyles());
    protected readonly lenguaje = signal<Lenguaje>('styles');

    // HTML resaltado calculado en base al codigo y al lenguaje
    protected readonly htmlResaltado = computed(() => {
        const tokens = this.resaltado.tokenizar(this.codigo(), this.lenguaje());
        const html = this.resaltado.aHtml(tokens);
        return html.endsWith('\n') ? html + ' ' : html;
    });

    // Referencias para sincronizar scroll entre textarea
    private readonly areaRef = viewChild<ElementRef<HTMLTextAreaElement>>('area');
    private readonly preRef = viewChild<ElementRef<HTMLPreElement>>('pre');

    onInput(event: Event): void {
        const target = event.target as HTMLTextAreaElement;
        this.codigo.set(target.value);
    }

    onScroll(): void {
        const area = this.areaRef()?.nativeElement;
        const pre = this.preRef()?.nativeElement;
        if (area && pre) {
            pre.scrollTop = area.scrollTop;
            pre.scrollLeft = area.scrollLeft;
        }
    }

    cambiarLenguaje(lang: Lenguaje): void {
        this.lenguaje.set(lang);
    }

    private codigoEjemploStyles(): string {
        return `mi-clase {
    height = 100;
    width = 200;
    background color = lightgray;
    color = blue;
    text size = 14;
    padding = 10;
}

@for $i from 1 through 4 {
    titulo-$i {
        text size = $i * 10;
    }
}`;
    }
}