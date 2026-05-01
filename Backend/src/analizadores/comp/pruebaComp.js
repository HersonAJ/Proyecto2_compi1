const GeneradorComp = require('./GeneradorComp');
const generador = new GeneradorComp();

function probar(titulo, entrada) {
    console.log('\n========================================');
    console.log('  ' + titulo);
    console.log('========================================');
    const resultado = generador.analizar(entrada);
    console.log('AST length:', Array.isArray(resultado.ast) ? resultado.ast.length : 'N/A');
    console.log('Errores:');
    console.log(JSON.stringify(resultado.errores, null, 2));
}

/* --- sanity --- */
probar('1) Sin errores: componente valido', `
saludo() {
    T("hola")
}
`);

/* --- Errores lexicos (ya funcionaban antes) --- */
probar('2) Solo error lexico', `
saludo() {
    [
        &
    ]
}
`);

/* --- Errores sintacticos --- */
probar('3) Componente sin parentesis de apertura', `
saludo {
    T("hola")
}
`);

probar('4) Falta paren cierre del componente', `
saludo( {
    T("hola")
}
`);

probar('5) Texto sin parentesis', `
saludo() {
    T "hola"
}
`);

probar('6) If sin condicion', `
saludo() {
    if () {
        T("hola")
    }
}
`);

probar('7) Switch case sin valor', `
saludo() {
    Switch ($x) {
        case {
            T("hola")
        }
    }
}
`);

/* --- Mezcla de error lexico y sintactico --- */
probar('8) Lexico + sintactico (esperamos ambos)', `
saludo() {
    [
        & T "hola"
    ]
}
`);