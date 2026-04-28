const GeneradorEstilos = require('./GeneradorEstilos');

const generador = new GeneradorEstilos();

const entrada = `
@for $j from 1 through 4 {
    $j-columna {
        width = $j * 25;
        padding = 10;
    }
}

@for $i from 1 through 3 {
    titulo-$i {
        text size = $i * 10;
    }
}

estilo-base {
    color = black;
}
`;

const resultado = generador.analizar(entrada);

console.log('=================================================');
console.log('Errores:', resultado.errores.length);
console.log('=================================================\n');

if (resultado.errores.length > 0) {
    console.log('ERRORES:');
    console.log(resultado.errores);
}

console.log('\n=================================================');
console.log('CSS GENERADO:');
console.log('=================================================\n');
console.log(resultado.css);