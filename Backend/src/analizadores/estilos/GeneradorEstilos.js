const parser = require('./estilos');

class GeneradorEstilos {
    analizar(entrada) {
        try {
            const resultado = parser.parse(entrada);
            return { exito: true, resultado, errores: [] };
        } catch (error) {
            return {
                exito: false,
                resultado: null,
                errores: [{
                    mensaje: error.message,
                    linea: error.hash ? error.hash.line : 0
                }]
            };
        }
    }
}

module.exports = GeneradorEstilos;