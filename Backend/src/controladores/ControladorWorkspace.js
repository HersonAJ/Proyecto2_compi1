const path = require('path');
const ServicioWorkspace = require('../servicios/ServicioWorkspace');

class ControladorWorkspace {
    constructor() {
        var rutaBase = path.resolve(__dirname, '../../workspaces');
        this.servicio = new ServicioWorkspace(rutaBase);

        this.listarProyectos = this.listarProyectos.bind(this);
        this.crearProyecto = this.crearProyecto.bind(this);
        this.eliminarProyecto = this.eliminarProyecto.bind(this);
        this.listarArchivos = this.listarArchivos.bind(this);
        this.leer = this.leer.bind(this);
        this.guardar = this.guardar.bind(this);
        this.crearCarpeta = this.crearCarpeta.bind(this);
        this.eliminar = this.eliminar.bind(this);
        this.descargarProyecto = this.descargarProyecto.bind(this);
    }

    listarProyectos(req, res) {
        try {
            var proyectos = this.servicio.listarProyectos();
            return res.status(200).json({ proyectos: proyectos });
        } catch (e) {
            console.error('Error en ControladorWork:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    crearProyecto(req, res) {
        try {
            var nombre = req.body.nombre;
            this.servicio.crearProyecto(nombre);
            return res.status(200).json({ ok: true, nombre: nombre });
        } catch (e) {
            console.error('Error en ControladorWork:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    eliminarProyecto(req, res) {
        try {
            var nombre = req.body.nombre;
            this.servicio.eliminarProyecto(nombre);
            return res.status(200).json({ ok: true });
        } catch (e) {
            console.error('Error en ControladorWork:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    listarArchivos(req, res) {
        try {
            var proyecto = req.query.proyecto;
            if (typeof proyecto !== 'string') {
                return res.status(400).json({ error: 'Falta el parametro "proyecto"' });
            }
            var arbol = this.servicio.listarArchivos(proyecto);
            return res.status(200).json({ arbol: arbol });
        } catch (e) {
            console.error('Error en ControladorWork:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    leer(req, res) {
        try {
            var proyecto = req.query.proyecto;
            var ruta = req.query.ruta;
            if (typeof proyecto !== 'string' || typeof ruta !== 'string') {
                return res.status(400).json({ error: 'Faltan parametros "proyecto" y/o "ruta"' });
            }
            var contenido = this.servicio.leerArchivo(proyecto, ruta);
            return res.status(200).json({ proyecto: proyecto, ruta: ruta, contenido: contenido });
        } catch (e) {
            console.error('Error en ControladorWork:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    guardar(req, res) {
        try {
            var proyecto = req.body.proyecto;
            var ruta = req.body.ruta;
            var contenido = req.body.contenido;
            if (typeof proyecto !== 'string' || typeof ruta !== 'string' || typeof contenido !== 'string') {
                return res.status(400).json({ error: 'Faltan campos "proyecto", "ruta" y/o "contenido"' });
            }
            this.servicio.guardarArchivo(proyecto, ruta, contenido);
            return res.status(200).json({ ok: true });
        } catch (e) {
            console.error('Error en ControladorWork:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    crearCarpeta(req, res) {
        try {
            var proyecto = req.body.proyecto;
            var ruta = req.body.ruta;
            if (typeof proyecto !== 'string' || typeof ruta !== 'string') {
                return res.status(400).json({ error: 'Faltan campos "proyecto" y/o "ruta"' });
            }
            this.servicio.crearCarpeta(proyecto, ruta);
            return res.status(200).json({ ok: true });
        } catch (e) {
            console.error('Error en ControladorWork:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    eliminar(req, res) {
        try {
            var proyecto = req.body.proyecto;
            var ruta = req.body.ruta;
            if (typeof proyecto !== 'string' || typeof ruta !== 'string') {
                return res.status(400).json({ error: 'Faltan campos "proyecto" y/o "ruta"' });
            }
            this.servicio.eliminar(proyecto, ruta);
            return res.status(200).json({ ok: true });
        } catch (e) {
            console.error('Error en ControladorWork:', e);
            return res.status(500).json({ error: e.message });
        }
    }
    descargarProyecto(req, res) {
        try {
            var proyecto = req.query.proyecto;

            if (typeof proyecto !== 'string') {
                return res.status(400).json({
                    error: 'Falta parametro "proyecto"'
                });
            }

            this.servicio.crearZipProyecto(proyecto, res);

        } catch (e) {
            console.error('Error en ControladorWork:', e);

            return res.status(500).json({
                error: e.message
            });
        }
    }
}

module.exports = ControladorWorkspace;