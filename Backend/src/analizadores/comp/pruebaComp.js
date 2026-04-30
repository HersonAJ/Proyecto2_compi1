const GeneradorComp = require('./GeneradorComp');
const generador = new GeneradorComp();

function probar(titulo, entrada) {
    console.log('\n========================================');
    console.log('  ' + titulo);
    console.log('========================================');
    const resultado = generador.analizar(entrada);
    console.log('AST:');
    console.log(JSON.stringify(resultado.ast, null, 2));
    console.log('Errores:');
    console.log(JSON.stringify(resultado.errores, null, 2));
}

/* --- 1. Componente vacio sin parametros --- */
probar('1) Componente vacio', `
header() {
}
`);

/* --- 2. Componente con parametros mixtos (con y sin $) --- */
probar('2) Parametros mixtos', `
card(int id, string nombre, function onClick, int $currentPP) {
}
`);

/* --- 3. Secciones anidadas vacias --- */
probar('3) Secciones anidadas', `
panel() {
    [
        [
        ]
        [
        ]
    ]
}
`);

/* --- 4. Secciones con estilos anidadas --- */
probar('4) Secciones con estilos', `
profile() {
    <azul, sombra>[
        <chico>[
        ]
    ]
}
`);

/* --- 5. Multiples componentes en un mismo archivo --- */
probar('5) Varios componentes', `
header() {
    [
    ]
}

footer() {
    <pie>[
    ]
}
`);

/* --- 6. Error lexico (caracter no reconocido) --- */
probar('6) Error lexico', `
header() {
    [
        &
    ]
}
`);