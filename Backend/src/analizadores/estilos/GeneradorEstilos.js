const parser = require('./estilos');
const AnalizadorSemanticoEstilos = require('./semantico/AnalizadorSemanticoEstilos');

class GeneradorEstilos {
    analizar(entrada) {
        parser.yy = {};
        parser.yy._ultimoError = null;
        parser.yy._ultimoToken = null;

        // Interceptar errores sintacticos del parser
        parser.parseError = function(msg, hash) {
            parser.yy._ultimoError = {
                lexema: hash.text || '',
                linea: hash.loc ? hash.loc.first_line : 0,
                columna: hash.loc ? hash.loc.first_column + 1 : 0
            };
        };

        try {
            const resultado = parser.parse(entrada);

            const erroresLexicos = resultado.erroresLexicos || [];
            const erroresSintacticos = resultado.erroresSintacticos || [];
            const definiciones = resultado.definiciones || [];

            // Solo correr el analizador semantico si no hay errores graves
            // (igual lo intentamos siempre, validando lo que se pudo parsear)
            const semantico = new AnalizadorSemanticoEstilos();
            const resultadoSemantico = semantico.analizar(definiciones);

            const todosErrores = [
                ...erroresLexicos,
                ...erroresSintacticos,
                ...resultadoSemantico.errores
            ];

            return {
                exito: todosErrores.length === 0,
                resultado: definiciones,
                tablaSimbolos: resultadoSemantico.tabla,
                errores: todosErrores
            };

        } catch (error) {
            return {
                exito: false,
                resultado: null,
                tablaSimbolos: null,
                errores: [{
                    tipo: 'SintacticoFatal',
                    lexema: error.hash ? error.hash.text : '',
                    linea: error.hash?.loc ? error.hash.loc.first_line : (error.hash?.line ?? 0),
                    columna: error.hash?.loc ? error.hash.loc.first_column + 1 : 0,
                    mensaje: error.message
                }]
            };
        }
    }
}

module.exports = GeneradorEstilos;