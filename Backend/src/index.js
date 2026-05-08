const express = require('express');
const cors = require('cors');

const rutasComp = require('./rutas/rutasComp');
const rutasEstilos = require('./rutas/rutasEstilos');
const rutasWorkspace = require('./rutas/rutasWorkspace');
const rutasY = require('./rutas/rutasY');
const rutasSQL = require('./rutas/rutasSQL');

const app = express();
const PUERTO = 3000;

//middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' }));

//ruta para las pruebas
app.get('/api/estado', (req, res) => {
    res.json({ mensaje: 'Servidor YFERA activo', estado: 'Ok' });
});

// Rutas de los analizadores
app.use('/api/comp', rutasComp);
app.use('/api/estilos', rutasEstilos);
app.use('/api/workspace', rutasWorkspace);
app.use('/api/y', rutasY);
app.use('/api/sql', rutasSQL);

// 404 para rutas no definidas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

//iniciar el servidor
app.listen(PUERTO, () => {
    console.log(`Servidor YFERA corriendo en http://localhost:${PUERTO}`);
})