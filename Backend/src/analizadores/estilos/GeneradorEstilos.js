const parser = require('./estilos');
const AnalizadorSemanticoEstilos = require('./semantico/AnalizadorSemanticoEstilos');
const TraductorEstilos = require('./traductor/TraductorEstilos');

class GeneradorEstilos {
    analizar(entrada) {
        parser.yy = {};
        parser.yy._ultimoError = null;
        parser.yy._ultimoToken = null;

        if (typeof parser.reiniciarPosUltimoToken === 'function') {
            parser.reiniciarPosUltimoToken();
        }

        parser.parseError = function(msg, hash) {
            parser.yy._ultimoError = {
                lexema: hash && hash.text ? hash.text : '',
                linea: hash && hash.loc ? hash.loc.first_line : (hash && hash.line != null ? hash.line + 1 : 0),
                columna: hash && hash.loc ? hash.loc.first_column + 1 : 0
            };
        };

        try {
            const resultado = parser.parse(entrada);

            const erroresLexicos = resultado.erroresLexicos || [];
            const erroresSintacticos = resultado.erroresSintacticos || [];
            const definiciones = resultado.definiciones || [];

            // Analisis semantico
            const semantico = new AnalizadorSemanticoEstilos();
            const resultadoSemantico = semantico.analizar(definiciones);

            const todosErrores = [
                ...erroresLexicos,
                ...erroresSintacticos,
                ...resultadoSemantico.errores
            ];

            // Traduccion a CSS solo si no hay errores semanticos
            var css = '';
            if (resultadoSemantico.errores.length === 0) {
                const traductor = new TraductorEstilos();
                css = traductor.traducir(definiciones);
            }

            return {
                exito: todosErrores.length === 0,
                resultado: definiciones,
                tablaSimbolos: resultadoSemantico.tabla,
                css: css,
                errores: todosErrores
            };

        } catch (error) {
            var lexema = '';
            var linea = 0;
            var columna = 0;

            if (error.hash) {
                lexema = error.hash.text || '';
                if (error.hash.loc) {
                    linea = error.hash.loc.first_line;
                    columna = error.hash.loc.first_column + 1;
                } else if (error.hash.line != null) {
                    linea = error.hash.line + 1;
                }
            }

            if ((!linea || linea === 0) && parser.yy._ultimoError) {
                var ue = parser.yy._ultimoError;
                lexema = lexema || ue.lexema || '';
                linea = ue.linea;
                columna = ue.columna;
            }

            if ((!linea || linea === 0) && typeof parser.obtenerPosUltimoToken === 'function') {
                var pos = parser.obtenerPosUltimoToken();
                lexema = lexema || pos.lexema || '';
                linea = pos.linea;
                columna = pos.columna;
            }

            return {
                exito: false,
                resultado: null,
                tablaSimbolos: null,
                css: '',
                errores: [{
                    tipo: 'SintacticoFatal',
                    lexema: lexema,
                    linea: linea,
                    columna: columna,
                    mensaje: 'Error sintactico no recuperable: ' + error.message.split('\n')[0]
                }]
            };
        }
    }
}

module.exports = GeneradorEstilos;