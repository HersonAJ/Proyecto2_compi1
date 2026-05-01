const GeneradorComp = require('./GeneradorComp');
const generador = new GeneradorComp();

function probar(titulo, entrada) {
    console.log('\n========================================');
    console.log('  ' + titulo);
    console.log('========================================');
    const resultado = generador.analizar(entrada);
    console.log('Componentes parseados:', Array.isArray(resultado.ast) ? resultado.ast.length : 'N/A');
    if (Array.isArray(resultado.ast)) {
        resultado.ast.forEach(function (c, i) {
            console.log('  [' + i + '] ' + c.nombre + ' (elementos: ' + c.elementos.length + ')');
        });
    }
    console.log('Errores totales:', resultado.errores.length);
    console.log(JSON.stringify(resultado.errores, null, 2));
}

/* === SUITE 1: archivo completo, valido === */
probar('A) Archivo valido completo', `
header() {
    <azul>[
        T<grande>("Bienvenido")
        IMG("logo.png")
    ]
}

card(int $id, string $nombre) {
    [
        T("Pokemon $nombre")
        if ( $id > 100 ) {
            T("legendario")
        } else {
            T("normal")
        }
        for each ( $stat : $stats ) {
            T("stat $stat")
        }
    ]
}

formulario() {
    FORM<estilo> {
        INPUT_TEXT(id: "n", label: "Nombre", value: "")
        INPUT_NUMBER(id: "e", label: "Edad", value: 18)
    } SUBMIT {
        label: "Enviar",
        function: $callback(@n, @e)
    }
}
`);

/* === SUITE 2: archivo con multiples errores mezclados === */
probar('B) Archivo realista con varios errores', `
componenteValido() {
    T("este componente esta bien")
    IMG("ok.png")
}

componenteConErroresInternos() {
    T "sin parens aqui"
    IMG("buena.png")
    T<estilo>(missing close
    if () {
        T("sin condicion")
    }
    T("este si esta bien")
}

otroValido() {
    [
        T("seccion ok")
    ]
}

componenteRotoCompleto( {
    T("nunca se va a parsear")
}

ultimoValido() {
    T("yo si soy valido")
}
`);

/* === SUITE 3: errores lexicos mezclados con sintacticos === */
probar('C) Errores lexicos y sintacticos juntos', `
mixto() {
    [
        & 
        T("hola")
        @ 
        IMG("imagen.png")
        T sin_parens
        $variable_suelta
    ]
}

despues() {
    T("este componente sigue siendo valido")
}
`);

/* === SUITE 4: stress de recuperacion en bloques anidados === */
probar('D) Errores dentro de if y for', `
demo() {
    if ( $x > 10 ) {
        T "sin parens dentro del if"
        T("este texto esta bien")
        IMG no_parens
    } else {
        T("rama else valida")
    }
    
    for each ( $a : $arr ) {
        T "tambien malo"
        T("pero este bien")
    }
}
`);