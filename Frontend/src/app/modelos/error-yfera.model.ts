export interface ErrorYFERA {
    tipo: 'Lexico' | 'Sintactico' | 'SintacticoFatal' | 'Semantico';
    lexema: string;
    linea: number;
    columna: number;
    mensaje: string;
}