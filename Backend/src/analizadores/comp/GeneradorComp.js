const compModulo = require('./comp');

class GeneradorComp {
    analizar(entrada) {
        compModulo.reiniciarErrores();

        let ast = [];

        try {
            ast = compModulo.parse(entrada) || [];
        } catch (e) {
        
        }

        const erroresInternos = compModulo.obtenerErrores();

        const errores = [
            ...erroresInternos.lexicos,
            ...erroresInternos.sintacticos
        ].map(function (e) {
            return {
                tipo: e.tipo,
                lexema: e.lexema,
                linea: e.linea,
                columna: e.columna,
                mensaje: e.mensaje
            };
        });

        return { ast: ast, errores: errores };
    }
}

module.exports = GeneradorComp;