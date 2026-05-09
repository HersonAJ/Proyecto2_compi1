import { Component, inject, viewChild, computed } from '@angular/core';
import { BarraSuperior } from './componentes/barra-superior/barra-superior';
import { PanelArbol } from './componentes/panel-arbol/panel-arbol';
import { PanelEditor } from './componentes/panel-editor/panel-editor';
import { PanelVista } from './componentes/panel-vista/panel-vista';
import { PanelConsola } from './componentes/panel-consola/panel-consola';
import { SelectorProyecto } from './componentes/selector-proyecto/selector-proyecto';
import { ProyectoService } from './servicios/proyecto.service';

@Component({
    selector: 'app-root',
    imports: [
        BarraSuperior,
        PanelArbol,
        PanelEditor,
        PanelVista,
        PanelConsola,
        SelectorProyecto
    ],
    templateUrl: './app.html',
    styleUrl: './app.css'
})
export class App {
    private readonly proyectoService = inject(ProyectoService);
    private readonly editorRef = viewChild<PanelEditor>('editor');

    protected readonly proyectoActivo = this.proyectoService.proyectoActivo;
    protected readonly hayProyecto = computed(() => this.proyectoActivo() !== null);

    onAnalizar(): void {
        this.editorRef()?.analizar();
    }

    onLimpiar(): void {
        this.editorRef()?.limpiarAnalisis();
    }

    onIndentar(): void {
        this.editorRef()?.indentar();
    }

    onColorSeleccionado(color: string): void {
        this.editorRef()?.insertarEnCursor(color);
    }
}