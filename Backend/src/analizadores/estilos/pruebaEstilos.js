const GeneradorEstilos = require('./GeneradorEstilos');

const generador = new GeneradorEstilos();

// Caso 1: error en valor de propiedad
const entrada1 = `
mi-clase {
    height = 100;
    color = ;
    width = 200;
}
`;

// Caso 2: falta ; antes del }
const entrada2 = `
primer-estilo { height = 100; }
mi-clase {
    height = 100;
    color = 100
}
ultimo-estilo { padding = 5; }
`;

// Caso 3: dos errores en el mismo estilo
const entrada3 = `
uno { width = 50; }
dos {
    color = ;
    height = 100;
    padding = ;
}
tres { margin = 10; }
`;

// Caso 4: error dentro de un @for
const entrada4 = `
@for $i from 1 through 3 {
    elemento-$i {
        text size = $i * 10
    }
}
final { padding = 5; }
`;

// Caso 5: @for con encabezado mal y otro @for valido despues
const entrada5 = `
@for $i from 1 through 3 {
    bueno-$i { color = red; }
}
@for $j 1 through 5 {
    roto-$j { width = 100; }
}
@for $k from 1 through 2 {
    otro-$k { height = 50; }
}
`;

// Cambia este para probar cada caso
const entrada = entrada2;

const resultado = generador.analizar(entrada);

if (resultado.exito) {
    console.log('Analisis exitoso!');
    console.log(JSON.stringify(resultado.resultado, null, 2));
} else {
    console.log('Salida con errores:');
    console.log('Errores:', resultado.errores);
    console.log('AST parcial:', JSON.stringify(resultado.resultado, null, 2));
}