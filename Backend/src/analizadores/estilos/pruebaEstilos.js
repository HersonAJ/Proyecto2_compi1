const GeneradorEstilos = require('./GeneradorEstilos');

const generador = new GeneradorEstilos();

const entrada = `
mi-clase {
    height = 200;
    width = 100;
    background color = lightgray;
    color = red;
    text align = CENTER;
    text size = 10;
    text font = HELVETICA;
    padding = 10;
    padding left = 20;
    margin = 5;
    border radius = 10;
    border style = DOTTED;
    border = 2 solid red;
    border top style = solid;
}

super-estilo {
    background color = lightgray;
}

mi-estilo extends super-estilo {
    color = blue;
}

@for $i from 1 through 4 {
    my-font-$i {
        text size = $i * 10;
    }
}
`;

const resultado = generador.analizar(entrada);

if (resultado.exito) {
    console.log('Analisis exitoso!');
    console.log(JSON.stringify(resultado.resultado, null, 2));
} else {
    console.log('Errores encontrados:');
    console.log(resultado.errores);
}