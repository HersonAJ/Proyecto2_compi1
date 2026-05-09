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
    readonly indentarSolicitado = output<void>();
    readonly colorSeleccionado = output<string>();

    onAnalizar(): void {
        this.analizarSolicitado.emit();
    }

    onLimpiar(): void {
        this.limpiarSolicitado.emit();
    }

    onIndentar(): void {
        this.indentarSolicitado.emit();
    }

    onColorChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.colorSeleccionado.emit(input.value);
    }
}