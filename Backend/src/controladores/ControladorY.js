const path = require('path');
const fs = require('fs');
const GeneradorY = require('../analizadores/y/GeneradorY');
const InvocadorFuncionY = require('../analizadores/y/InvocadorFuncionY');

class ControladorY {
    constructor() {
        this.generador = new GeneradorY();
        this.rutaBaseProyectos = path.resolve(__dirname, '../../workspaces');
        this.analizar = this.analizar.bind(this);
        this.invocarFuncion = this.invocarFuncion.bind(this);
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
            console.error('Error en ControladorY:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    invocarFuncion(req, res) {
        try {
            const proyecto = req.body.proyecto;
            const rutaArchivo = req.body.rutaArchivo;
            const nombreFuncion = req.body.nombreFuncion;
            const argumentos = req.body.argumentos;

            if (typeof proyecto !== 'string' || typeof rutaArchivo !== 'string'
                || typeof nombreFuncion !== 'string' || !Array.isArray(argumentos)) {
                return res.status(400).json({ error: 'Faltan campos: proyecto, rutaArchivo, nombreFuncion, argumentos' });
            }

            // Leer el .y desde disco
            const rutaArchivoY = path.join(this.rutaBaseProyectos, proyecto, rutaArchivo);
            if (!fs.existsSync(rutaArchivoY)) {
                return res.status(404).json({ error: 'No se encontro el archivo: ' + rutaArchivo });
            }
            const codigo = fs.readFileSync(rutaArchivoY, 'utf8');

            const invocador = new InvocadorFuncionY({
                proyecto: proyecto,
                rutaBaseProyectos: this.rutaBaseProyectos
            });
            const resultado = invocador.invocar({
                codigo: codigo,
                nombreFuncion: nombreFuncion,
                argumentos: argumentos
            });

            return res.status(200).json(resultado);
        } catch (e) {
            console.error('Error en ControladorY:', e);
            return res.status(500).json({ error: e.message });
        }
    }
}

module.exports = ControladorY;