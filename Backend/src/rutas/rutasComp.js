const express = require('express');
const ControladorComp = require('../controladores/ControladorComp');

const router = express.Router();
const controlador = new ControladorComp();

//POST
router.post('/analizar', controlador.analizar);

module.exports = router;