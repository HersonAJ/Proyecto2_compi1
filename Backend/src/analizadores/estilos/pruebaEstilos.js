const GeneradorEstilos = require('./GeneradorEstilos');

const generador = new GeneradorEstilos();

const entrada = `
/* ========== Estilo valido (no debe reportar nada) ========== */
estilo-correcto {
    height = 100;
    width = 200;
    color = blue;
}

/* ========== ERROR 1: Caracter desconocido (lexico) ========== */
con-error-lexico {
    height = 100;
    color = & red;
    width = 200;
}

/* ========== ERROR 2: Caracteres desconocidos consecutivos (acumulacion) ========== */
con-lexico-multiple {
    color = &?! red;
    height = 50;
}

/* ========== ERROR 3: Falta valor antes del ";" ========== */
falta-valor {
    height = 100;
    color = ;
    padding = 20;
}

/* ========== ERROR 4: Falta ";" antes del "}" ========== */
falta-punto-coma {
    height = 100;
    color = red
}

/* ========== ERROR 5: Multiples errores en el mismo estilo ========== */
multiples-errores {
    height = 100;
    color = ;
    width = 200;
    padding = ;
    margin = 10;
}

/* ========== ERROR 6: Error dentro de un @for ========== */
@for $i from 1 through 3 {
    elemento-$i {
        text size = $i * 10
    }
}

/* ========== ERROR 7: @for con encabezado mal formado ========== */
@for $j 1 through 5 {
    roto-$j {
        width = 100;
    }
}

/* ========== ERROR 8: @for sin variable ========== */
@for from 1 through 4 {
    item-$x {
        color = blue;
    }
}

/* ========== ERROR 9: Estilo con error en herencia ========== */
estilo-base-valido {
    color = black;
}

mal-extends extends estilo-base-valido {
    color = ;
    padding = 10;
}

/* ========== Estilo valido al final (verifica que el parser sigue funcionando) ========== */
ultimo-estilo {
    margin = 5;
    border = 1 solid black;
}
`;

const resultado = generador.analizar(entrada);

if (resultado.exito) {
    console.log('Analisis exitoso!');
    console.log(JSON.stringify(resultado.resultado, null, 2));
} else {
    console.log('Salida con errores:');
    console.log('Errores:', resultado.errores);
    console.log('AST parcial:', JSON.stringify(resultado.resultado, null, 2));
}