import { ErrorYFERA } from './error-yfera.model';

export interface RespuestaAnalisisEstilos {
    exito: boolean;
    ast: any[];
    tablaSimbolos: any;
    css: string;
    errores: ErrorYFERA[];
}

export interface RespuestaAnalisisComp {
    exito: boolean;
    ast: any[];
    tablaSimbolos: any;
    html: string;
    componentes: { [nombre: string]: string };
    errores: ErrorYFERA[];
}

export interface RespuestaAnalisisY {
    exito: boolean;
    ast: any[];
    tablaSimbolos: any;
    js: string;
    errores: ErrorYFERA[];
}