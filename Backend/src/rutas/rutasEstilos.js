const express = require('express');
const ControladorEstilos = require('../controladores/ControladorEstilos');

const router = express.Router();
const controlador = new ControladorEstilos();

//POST 
router.post('/analizar', controlador.analizar);

module.exports = router;