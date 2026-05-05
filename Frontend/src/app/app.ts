import { Component } from '@angular/core';
import { BarraSuperior } from './componentes/barra-superior/barra-superior';
import { PanelArbol } from './componentes/panel-arbol/panel-arbol';
import { PanelEditor } from './componentes/panel-editor/panel-editor';
import { PanelVista } from './componentes/panel-vista/panel-vista';
import { PanelConsola } from './componentes/panel-consola/panel-consola';

@Component({
    selector: 'app-root',
    imports: [
        BarraSuperior,
        PanelArbol,
        PanelEditor,
        PanelVista,
        PanelConsola
    ],
    templateUrl: './app.html',
    styleUrl: './app.css'
})
export class App {}