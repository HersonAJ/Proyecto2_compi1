const path = require('path');
const GeneradorY = require('../analizadores/y/GeneradorY');

class ControladorY {
    constructor() {
        this.generador = new GeneradorY();
        this.rutaBaseProyectos = path.resolve(__dirname, '../../workspaces');
        this.analizar = this.analizar.bind(this);
    }

    analizar(req, res) {
        try {
            const codigo = req.body.codigo;
            const proyecto = req.body.proyecto;
            const rutaArchivo = req.body.rutaArchivo;

            if (typeof codigo !== 'string') {
                return res.status(400).json({ error: 'Falta el campo "codigo"' });
            }

            const resultado = this.generador.analizar(codigo, {
                proyecto: proyecto,
                rutaArchivo: rutaArchivo,
                rutaBaseProyectos: this.rutaBaseProyectos
            });

            return res.status(200).json(resultado);
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }
}

module.exports = ControladorY;