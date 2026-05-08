const path = require('path');
const GeneradorSQL = require('../analizadores/sql/GeneradorSQL');

class ControladorSQL {
    constructor() {
        this.generador = new GeneradorSQL();
        this.rutaBaseProyectos = path.resolve(__dirname, '../../workspaces');
        this.ejecutar = this.ejecutar.bind(this);
        this.analizar = this.analizar.bind(this);
    }

    /**
     * POST /api/sql/ejecutar
     * Body: { codigo: string, proyecto: string }
     * Ejecuta el SQL contra la BD del proyecto.
     */
    ejecutar(req, res) {
        try {
            const codigo = req.body.codigo;
            const proyecto = req.body.proyecto;

            if (typeof codigo !== 'string') {
                return res.status(400).json({ error: 'Falta el campo "codigo"' });
            }
            if (typeof proyecto !== 'string' || proyecto.trim() === '') {
                return res.status(400).json({ error: 'Falta el campo "proyecto"' });
            }

            const resultado = this.generador.analizar(codigo, {
                ejecutar: true,
                proyecto: proyecto,
                rutaBaseProyectos: this.rutaBaseProyectos
            });

            return res.status(200).json(resultado);
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    /**
     * POST /api/sql/analizar
     * Body: { codigo: string }
     * Solo analiza la sintaxis, no ejecuta.
     */
    analizar(req, res) {
        try {
            const codigo = req.body.codigo;
            if (typeof codigo !== 'string') {
                return res.status(400).json({ error: 'Falta el campo "codigo"' });
            }
            const resultado = this.generador.analizar(codigo, { ejecutar: false });
            return res.status(200).json(resultado);
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }
}

module.exports = ControladorSQL;