const yModulo = require('./y');
const ErrorYFERA = require('../errores/ErrorYFERA');
const AnalizadorSemanticoY = require('./semantico/AnalizadorSemanticoY');

class GeneradorY {
    analizar(entrada, opciones) {
        opciones = opciones || {};
        yModulo.reiniciarErrores();

        const protoParser = Object.getPrototypeOf(yModulo.parser);
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

            yModulo.registrarErrorSintactico(
                new ErrorYFERA('Sintactico', lexema, linea, columna, descripcion)
            );
        };
        yModulo.parser.parseError = protoParser.parseError;

        let ast = [];
        try {
            ast = yModulo.parse(entrada) || [];
        } catch (e) {
            // Errores ya registrados
        }

        const erroresInternos = yModulo.obtenerErrores();
        const erroresLexicos = erroresInternos.lexicos || [];
        const erroresSintacticos = erroresInternos.sintacticos || [];

        // Analisis semantico
        var resultadoSemantico = { tabla: null, errores: [] };
        if (Array.isArray(ast) && ast.length > 0) {
            const semantico = new AnalizadorSemanticoY({
                proyecto: opciones.proyecto,
                rutaArchivo: opciones.rutaArchivo,
                rutaBaseProyectos: opciones.rutaBaseProyectos
            });
            resultadoSemantico = semantico.analizar(ast);
        }

        const todosErrores = [
            ...erroresLexicos,
            ...erroresSintacticos,
            ...resultadoSemantico.errores
        ].map(function (e) {
            return {
                tipo: e.tipo,
                lexema: e.lexema,
                linea: e.linea,
                columna: e.columna,
                mensaje: e.mensaje
            };
        });

        var js = '';

        return {
            exito: todosErrores.length === 0,
            ast: ast,
            tablaSimbolos: resultadoSemantico.tabla,
            js: js,
            errores: todosErrores
        };
    }
}

module.exports = GeneradorY;