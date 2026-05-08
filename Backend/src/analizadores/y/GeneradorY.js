const yModulo = require('./y');
const ErrorYFERA = require('../errores/ErrorYFERA');
const AnalizadorSemanticoY = require('./semantico/AnalizadorSemanticoY');
const TraductorY = require('./traductor/TraductorY');

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
        var resultadoSemantico = { tabla: null, errores: [], contexto: null };
        var contexto = null;
        if (Array.isArray(ast) && ast.length > 0) {
            const semantico = new AnalizadorSemanticoY({
                proyecto: opciones.proyecto,
                rutaArchivo: opciones.rutaArchivo,
                rutaBaseProyectos: opciones.rutaBaseProyectos
            });
            resultadoSemantico = semantico.analizar(ast);
            contexto = semantico.contexto;
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

        // Traduccion: solo si no hay errores semanticos
        var html = '';
        if (resultadoSemantico.errores.length === 0 && contexto && Array.isArray(ast) && ast.length > 0) {
            const traductor = new TraductorY(contexto, {
                proyecto: opciones.proyecto,
                rutaBaseProyectos: opciones.rutaBaseProyectos,
                rutaArchivo: opciones.rutaArchivo
            });
            const resultadoTraduccion = traductor.traducir(ast);
            html = resultadoTraduccion.html;

            // Propagar errores del traductor (incluyendo execute fallidos)
            if (resultadoTraduccion.errores && resultadoTraduccion.errores.length > 0) {
                for (let i = 0; i < resultadoTraduccion.errores.length; i++) {
                    todosErrores.push(resultadoTraduccion.errores[i]);
                }
            }
        }

        return {
            exito: todosErrores.length === 0,
            ast: ast,
            tablaSimbolos: resultadoSemantico.tabla,
            html: html,
            errores: todosErrores
        };
    }
}

module.exports = GeneradorY;