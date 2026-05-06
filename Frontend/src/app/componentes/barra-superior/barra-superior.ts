import { Component, output } from '@angular/core';

@Component({
    selector: 'app-barra-superior',
    imports: [],
    templateUrl: './barra-superior.html',
    styleUrl: './barra-superior.css'
})
export class BarraSuperior {
    readonly analizarSolicitado = output<void>();
    readonly limpiarSolicitado = output<void>();

    onAnalizar(): void {
        this.analizarSolicitado.emit();
    }

    onLimpiar(): void {
        this.limpiarSolicitado.emit();
    }
}