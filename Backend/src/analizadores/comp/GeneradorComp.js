const compModulo = require('./comp');
const ErrorYFERA = require('../errores/ErrorYFERA');

class GeneradorComp {
    analizar(entrada) {
        compModulo.reiniciarErrores();

        // Asignar parseError tanto en la instancia como en el prototype
        const protoParser = Object.getPrototypeOf(compModulo.parser);
        protoParser.parseError = function (msg, hash) {
            const linea = hash.loc ? hash.loc.first_line : (hash.line != null ? hash.line + 1 : 0);
            const columna = hash.loc ? hash.loc.first_column + 1 : 0;
            const lexema = hash.text || '';

            let descripcion;
            if (hash.expected && hash.expected.length > 0) {
                const esperados = hash.expected
                    .map(function (t) { return t.replace(/'/g, ''); })
                    .slice(0, 5)
                    .join(', ');
                descripcion = 'Se esperaba: ' + esperados + '. Se encontro: "' + lexema + '"';
            } else {
                descripcion = 'Error de sintaxis cerca de "' + lexema + '"';
            }

            compModulo.registrarErrorSintactico(
                new ErrorYFERA('Sintactico', lexema, linea, columna, descripcion)
            );

            throw new Error(msg);
        };
        compModulo.parser.parseError = protoParser.parseError;

        let ast = [];
        try {
            ast = compModulo.parse(entrada) || [];
        } catch (e) {
            // Errores ya registrados via parseError
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