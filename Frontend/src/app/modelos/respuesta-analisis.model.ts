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
    html: string;
    errores: ErrorYFERA[];
}

export interface ResultadoSQL {
    tipo: 'create_table' | 'select' | 'insert' | 'update' | 'delete';
    tabla: string;
    mensaje: string;
    columna?: string;
    valores?: any[];
    idInsertado?: number;
    filasAfectadas?: number;
}

export interface RespuestaEjecucionSQL {
    exito: boolean;
    ast: any[];
    resultados: ResultadoSQL[];
    errores: ErrorYFERA[];
}