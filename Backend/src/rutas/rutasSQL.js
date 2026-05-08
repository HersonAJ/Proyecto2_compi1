const express = require('express');
const ControladorSQL = require('../controladores/ControladorSQL');

const router = express.Router();
const controlador = new ControladorSQL();

// POST
router.post('/ejecutar', controlador.ejecutar);
router.post('/analizar', controlador.analizar);

module.exports = router;