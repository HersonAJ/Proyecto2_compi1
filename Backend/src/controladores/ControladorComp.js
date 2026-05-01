const GeneradorComp = require('../analizadores/comp/GeneradorComp');

class ControladorComp {
    constructor() {
        this.generador = new GeneradorComp();
        this.analizar = this.analizar.bind(this);
    }

    //post
    analizar(req, res) {
        try {
            const { codigo } = req.body;

            if (typeof codigo !== 'string') {
                return res.status(400).json({
                    error: 'Falta el campo "codigo" en el body, o no es un string'
                });
            }

            const resultado = this.generador.analizar(codigo);

            return res.status(200).json({
                ast: resultado.ast,
                errores: resultado.errores
            });
        } catch (e) {
            return res.status(500).json({
                error: 'Error interno al analizar el codigo',
                detalle: e.message
            });
        }
    }
}

module.exports = ControladorComp;