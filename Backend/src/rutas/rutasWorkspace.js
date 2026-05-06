const express = require('express');
const ControladorWorkspace = require('../controladores/ControladorWorkspace');

const router = express.Router();
const controlador = new ControladorWorkspace();

// Proyectos
router.get('/proyectos', controlador.listarProyectos);
router.post('/proyectos', controlador.crearProyecto);
router.delete('/proyectos', controlador.eliminarProyecto);

// Archivos dentro de un proyecto
router.get('/archivos', controlador.listarArchivos);
router.get('/leer', controlador.leer);
router.post('/guardar', controlador.guardar);
router.post('/crear-carpeta', controlador.crearCarpeta);
router.post('/eliminar', controlador.eliminar);

module.exports = router;