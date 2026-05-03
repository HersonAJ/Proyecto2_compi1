const compModulo = require('./comp');
const ErrorYFERA = require('../errores/ErrorYFERA');
const AnalizadorSemanticoComp = require('./semantico/AnalizadorSemanticoComp');

class GeneradorComp {
    analizar(entrada) {
        compModulo.reiniciarErrores();

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
        };
        compModulo.parser.parseError = protoParser.parseError;

        let ast = [];
        try {
            ast = compModulo.parse(entrada) || [];
        } catch (e) {
            // Errores ya registrados
        }

        const erroresInternos = compModulo.obtenerErrores();
        const erroresLexicos = erroresInternos.lexicos || [];
        const erroresSintacticos = erroresInternos.sintacticos || [];

        // Analisis semantico (solo si hay AST)
        var resultadoSemantico = { tabla: null, errores: [] };
        if (Array.isArray(ast) && ast.length > 0) {
            const semantico = new AnalizadorSemanticoComp();
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

        return {
            exito: todosErrores.length === 0,
            ast: ast,
            tablaSimbolos: resultadoSemantico.tabla,
            errores: todosErrores
        };
    }
}

module.exports = GeneradorComp;