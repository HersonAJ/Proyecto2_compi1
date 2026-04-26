const GeneradorEstilos = require('./GeneradorEstilos');

const generador = new GeneradorEstilos();

const entrada = `
/* ========== Caso valido ========== */
estilo-correcto {
    height = 100;
    color = red;
    text align = CENTER;
    text font = SANS SERIF;
    border style = DOTTED;
}

/* ========== ERROR: Estilo duplicado ========== */
duplicado {
    color = blue;
}

duplicado {
    color = green;
}

/* ========== ERROR: Heredarse de si mismo ========== */
auto-herencia extends auto-herencia {
    color = red;
}

/* ========== ERROR: Heredar de estilo inexistente ========== */
hijo-huerfano extends padre-fantasma {
    width = 100;
}

/* ========== ERROR: Herencia circular ========== */
ciclico-a extends ciclico-b {
    color = red;
}

ciclico-b extends ciclico-a {
    color = blue;
}

/* ========== ERROR: tipo de valor incorrecto ========== */
tipos-mal {
    height = solid;
    color = 100;
    text align = ARRIBA;
    text font = COMIC;
    border style = SQUIGGLY;
}

/* ========== ERROR: rango invertido en @for ========== */
@for $i from 5 through 1 {
    elemento-$i {
        text size = $i * 10;
    }
}

/* ========== Caso valido al final ========== */
ultimo-estilo {
    margin = 5;
}
`;

const resultado = generador.analizar(entrada);

console.log('==================================================');
console.log('Total definiciones validas:', resultado.resultado ? resultado.resultado.length : 0);
console.log('Total errores:', resultado.errores.length);
console.log('==================================================\n');

console.log('ERRORES POR TIPO:\n');
const porTipo = { Lexico: 0, Sintactico: 0, Semantico: 0 };
resultado.errores.forEach(e => {
    porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1;
});
console.log(porTipo);
console.log('');

console.log('DETALLE DE ERRORES:\n');
console.log(resultado.errores);

console.log('\n==================================================');
console.log('TABLA DE SIMBOLOS:\n');
if (resultado.tablaSimbolos) {
    const todos = resultado.tablaSimbolos.obtenerTodos();
    todos.forEach(s => {
        console.log(`  ${s.nombre} (scope: ${s.scope}) - tipo: ${s.info.tipo}, linea: ${s.info.linea}`);
    });
}