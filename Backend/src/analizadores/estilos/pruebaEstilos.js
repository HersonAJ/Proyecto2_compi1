const GeneradorEstilos = require('./GeneradorEstilos');

const generador = new GeneradorEstilos();

function probar(titulo, entrada) {
    console.log('\n=================================================');
    console.log('  ' + titulo);
    console.log('=================================================');

    const resultado = generador.analizar(entrada);

    console.log('Exito:', resultado.exito);
    console.log('Errores:', resultado.errores.length);

    if (resultado.errores.length > 0) {
        console.log('Detalle de errores:');
        console.log(JSON.stringify(resultado.errores, null, 2));
    }

    if (resultado.css) {
        console.log('\nCSS generado:');
        console.log(resultado.css);
    }
}

probar('A) Through 1..4 (inclusivo, 4 estilos)', `
@for $i from 1 through 4 {
    my-font-$i {
        text size = $i * 10;
    }
}
`);

/* to exclusivo*/
probar('B) To 1..4 (exclusivo, 3 estilos)', `
@for $i from 1 to 4 {
    my-font-$i {
        text size = $i * 10;
    }
}
`);

/* === Comparacion lado a lado === */
probar('C) Mismo rango con through vs to', `
@for $a from 1 through 3 {
    a-clase-$a {
        width = $a * 10;
    }
}

@for $b from 1 to 3 {
    b-clase-$b {
        width = $b * 10;
    }
}
`);

/* === Casos limite === */
probar('D) To donde desde == hasta (genera 0 estilos)', `
@for $i from 5 to 5 {
    nada-$i {
        width = 100;
    }
}
`);

probar('E) Through donde desde == hasta (genera 1 estilo)', `
@for $i from 5 through 5 {
    uno-$i {
        width = 100;
    }
}
`);

probar('F) To desde mayor que hasta (rango invertido, error semantico)', `
@for $i from 10 to 5 {
    error-$i {
        width = $i;
    }
}
`);

probar('G) Through desde mayor que hasta (rango invertido, error semantico)', `
@for $i from 10 through 5 {
    error-$i {
        width = $i;
    }
}
`);

/* === Mezcla con otros estilos === */
probar('H) For con to + estilos sueltos + extends', `
base {
    color = black;
}

@for $i from 1 to 4 {
    titulo-$i extends base {
        text size = $i * 12;
    }
}

footer {
    color = gray;
}
`);

/* === Concatenacion de variable al inicio del nombre === */
probar('I) To con variable al inicio del nombre', `
@for $j from 1 to 4 {
    $j-columna {
        width = $j * 25;
        padding = 10;
    }
}
`);

/* === Errores sintacticos: todavia debe funcionar la recuperacion === */
probar('J) Error sintactico en for con to (sin llave de cierre)', `
@for $i from 1 to 4 {
    my-clase-$i {
        text size = $i * 10
    }
`);