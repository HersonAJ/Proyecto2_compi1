class ErrorYFERA {
    constructor(tipo, lexema, linea, columna, mensaje) {
        this.tipo = tipo;
        this.lexema = lexema;
        this.linea = linea;
        this.columna = columna;
        this.mensaje = mensaje;
    }
}

module.exports = ErrorYFERA;