const GeneradorComp = require('./GeneradorComp');
const generador = new GeneradorComp();

function probar(titulo, entrada) {
    console.log('\n========================================');
    console.log('  ' + titulo);
    console.log('========================================');
    const resultado = generador.analizar(entrada);
    console.log('Exito:', resultado.exito);
    console.log('Errores:');
    console.log(JSON.stringify(resultado.errores, null, 2));
}

/* === sanity de fases anteriores === */
probar('A) Sanity: form valido sin SUBMIT', `
demo() {
    FORM {
        INPUT_TEXT(id: "name", label: "Nombre", value: "")
        INPUT_NUMBER(id: "edad", label: "Edad", value: 18)
    }
}
`);

probar('B) Form valido con SUBMIT y referencias correctas', `
demo(function $callback) {
    FORM {
        INPUT_TEXT(id: "name", label: "Nombre", value: "")
        INPUT_BOOL(id: "valid", label: "Valido?", value: true)
    } SUBMIT {
        label: "Enviar",
        function: $callback(@name, @valid)
    }
}
`);

/* === errores de IDs duplicados === */
probar('C) IDs duplicados en mismo FORM', `
demo() {
    FORM {
        INPUT_TEXT(id: "name", label: "uno", value: "")
        INPUT_NUMBER(id: "name", label: "dos", value: 0)
    }
}
`);

probar('D) Tres inputs, dos con mismo id', `
demo() {
    FORM {
        INPUT_TEXT(id: "x", label: "x", value: "")
        INPUT_NUMBER(id: "y", label: "y", value: 0)
        INPUT_BOOL(id: "x", label: "x2", value: true)
    }
}
`);

probar('E) IDs duplicados en branches de un if dentro del FORM', `
demo(boolean $b) {
    FORM {
        INPUT_TEXT(id: "name", label: "fuera del if", value: "")
        if ( $b ) {
            INPUT_NUMBER(id: "name", label: "rama if", value: 0)
        } else {
            INPUT_BOOL(id: "name", label: "rama else", value: true)
        }
    }
}
`);

/* === referencias @id invalidas === */
probar('F) Submit con referencia @id que no existe', `
demo(function $callback) {
    FORM {
        INPUT_TEXT(id: "name", label: "n", value: "")
    } SUBMIT {
        label: "Enviar",
        function: $callback(@inexistente)
    }
}
`);

probar('G) Submit con multiples referencias, una invalida', `
demo(function $callback) {
    FORM {
        INPUT_TEXT(id: "name", label: "n", value: "")
        INPUT_BOOL(id: "valid", label: "v", value: true)
    } SUBMIT {
        label: "Enviar",
        function: $callback(@name, @noexiste, @valid)
    }
}
`);

probar('H) Submit con referencia a input que esta en bloque anidado', `
demo(function $callback, boolean $b) {
    FORM {
        if ( $b ) {
            INPUT_TEXT(id: "dentro", label: "dentro", value: "")
        }
    } SUBMIT {
        label: "Enviar",
        function: $callback(@dentro)
    }
}
`);

/* === forms anidados (un form dentro de otro componente, no anidados directos) === */
probar('I) Dos forms diferentes, IDs no colisionan', `
form1() {
    FORM {
        INPUT_TEXT(id: "name", label: "f1", value: "")
    }
}

form2() {
    FORM {
        INPUT_TEXT(id: "name", label: "f2", value: "")
    }
}
`);

/* === mezcla de errores === */
probar('J) Form con id duplicado Y referencia invalida', `
demo(function $callback) {
    FORM {
        INPUT_TEXT(id: "x", label: "uno", value: "")
        INPUT_NUMBER(id: "x", label: "dos", value: 0)
    } SUBMIT {
        label: "Enviar",
        function: $callback(@inexistente)
    }
}
`);