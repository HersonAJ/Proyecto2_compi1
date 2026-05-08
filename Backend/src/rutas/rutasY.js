const express = require('express');
const ControladorY = require('../controladores/ControladorY');

const router = express.Router();
const controlador = new ControladorY();

// POST
router.post('/analizar', controlador.analizar);
router.post('/invocar-funcion', controlador.invocarFuncion);

module.exports = router;