const GeneradorComp = require('./GeneradorComp');
const generador = new GeneradorComp();

function probar(titulo, entrada) {
    console.log('\n========================================');
    console.log('  ' + titulo);
    console.log('========================================');
    const resultado = generador.analizar(entrada);
    console.log('Exito:', resultado.exito);
    if (resultado.errores.length > 0) {
        console.log('Errores:');
        console.log(JSON.stringify(resultado.errores, null, 2));
        return;
    }
    console.log('HTML:');
    console.log(resultado.html);
}

/* === Sanity de T1 === */
probar('A) Sanity: texto + imagen', `
panel() {
    [
        T("hola")
        IMG("logo.png")
    ]
}
`);

/* === Formularios === */
probar('B) Form simple sin SUBMIT', `
login() {
    FORM {
        INPUT_TEXT(id: "user", label: "Usuario", value: "")
    }
}
`);

probar('C) Form con tres tipos de input', `
registro() {
    FORM<estilo-form> {
        INPUT_TEXT(id: "name", label: "Nombre", value: "")
        INPUT_NUMBER(id: "edad", label: "Edad", value: 18)
        INPUT_BOOL(id: "acepto", label: "Acepto", value: true)
    }
}
`);

probar('D) Form con SUBMIT', `
contacto() {
    FORM {
        INPUT_TEXT(id: "email", label: "Correo", value: "")
    } SUBMIT {
        label: "Enviar"
    }
}
`);

/* === If/else === */
probar('E) If solo', `
demo(int $x) {
    if ( $x > 10 ) {
        T("grande")
    }
}
`);

probar('F) If con else if y else', `
demo(int $x) {
    if ( $x > 100 ) {
        T("muy grande")
    } else if ( $x > 10 ) {
        T("mediano")
    } else {
        T("chico")
    }
}
`);

/* === Switch === */
probar('G) Switch con casos y default', `
demo(int $opt) {
    Switch( $opt ) {
        case 1 {
            T("uno")
        },
        case 2 {
            T("dos")
        },
        default {
            T("otro")
        }
    }
}
`);

/* === For === */
probar('H) For each', `
demo(string $arr) {
    for each ( $item : $arr ) {
        T("Item: $item")
    }
}
`);

probar('I) For complejo con empty', `
demo(string $arr1, string $arr2) {
    for ( $a : $arr1, $b : $arr2 ) track $idx {
        T("Item $a y $b en idx $idx")
    } empty {
        T("vacio")
    }
}
`);

/* === Mezcla profunda === */
probar('J) Form dentro de seccion con if dentro', `
pagina(boolean $logueado, function $cb) {
    <fondo>[
        T("Bienvenido")
        if ( $logueado ) {
            FORM {
                INPUT_TEXT(id: "msg", label: "Mensaje", value: "")
            } SUBMIT {
                label: "Enviar",
                function: $cb(@msg)
            }
        } else {
            T("Por favor inicia sesion")
        }
    ]
}
`);