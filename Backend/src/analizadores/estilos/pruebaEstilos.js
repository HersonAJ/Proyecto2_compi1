const GeneradorEstilos = require('./GeneradorEstilos');

const generador = new GeneradorEstilos();

const entrada = `
/* Caso 1: Estilo con todas las propiedades del documento */
mi-clase {
    height = 200;
    width = 100;
    min-width = 50;
    max-width = 500;
    min-height = 30;
    max-height = 300;
    background color = lightgray;
    color = red;
    text align = CENTER;
    text size = 10;
    text font = HELVETICA;
    padding = 10;
    padding left = 10;
    padding top = 10;
    padding right = 10;
    padding bottom = 10;
    margin = 10;
    margin left = 10;
    margin top = 10;
    margin right = 10;
    margin bottom = 10;
    border radius = 10;
    border style = DOTTED;
    border width = 10;
    border color = red;
    border = 2 solid red;
    border top style = solid;
    border right = 2 solid red;
}

/* Caso 2: Sobreescritura */
mi-estilo {
    border color = red;
    border right = 2 solid blue;
}

/* Caso 3: Herencia con extends */
super-estilo {
    background color = lightgray;
}

mi-estilo-hijo extends super-estilo {
    color = blue;
}

/* Caso 4: @for con variable al final */
@for $i from 1 through 4 {
    my-font-$i {
        text size = $i * 10;
    }
}

/* Caso 5: @for con variable al inicio */
@for $j from 1 through 3 {
    $j-columna {
        width = $j * 25;
    }
}

/* Caso 6: Porcentajes y decimales */
responsive {
    width = 80%;
    height = 50%;
    border = 2.5 solid red;
}

/* Caso 7: text font con SANS SERIF (dos palabras) */
texto-especial {
    text font = SANS SERIF;
}

/* Caso 8: Expresiones mas complejas dentro del @for */
@for $k from 1 through 5 {
    header-$k {
        text size = $k * 10 + 5;
        padding = ($k + 1) * 2;
        margin = $k - 1;
    }
}

/* Caso 9: Estilo vacio */
vacio {
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