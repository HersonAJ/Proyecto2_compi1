const express = require('express');
const cors = require('cors')

const app = express();
const PUERTO = 3000;

//middlewares
app.use(cors());
app.use(express.json());

//ruta para las pruebas
app.get('/api/estado', (req, res) =>{
    res.json({ mensaje: 'Servidor YFERA activo', estado: 'Ok'});
});

//iniciar el servidor
app.listen(PUERTO, () => {
    console.log(`Servidor YFERA corriendo en http://localhost:${PUERTO}`);
})