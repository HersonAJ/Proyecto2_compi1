const parser = require('./estilos');

class GeneradorEstilos {
    analizar(entrada) {
        parser.yy = {};
        parser.yy._ultimoError = null;

        // Interceptar errores sintacticos del parser
        parser.parseError = function (msg, hash) {
            parser.yy._ultimoError = {
                lexema: hash.text || '',
                linea: hash.loc ? hash.loc.first_line : (hash.line != null ? hash.line + 1 : 0),
                columna: hash.loc ? hash.loc.first_column + 1 : 0,
                esperados: hash.expected || []
            };

        };

        try {
            const resultado = parser.parse(entrada);

            const errores = [
                ...(resultado.erroresLexicos || []),
                ...(resultado.erroresSintacticos || [])
            ];

            return {
                exito: errores.length === 0,
                resultado: resultado.definiciones,
                errores: errores
            };

        } catch (error) {
            return {
                exito: false,
                resultado: null,
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