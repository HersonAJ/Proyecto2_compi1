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

/* --- sanity de fases anteriores --- */
probar('1) Componente con texto e imagen', `
panel() {
    [
        T<grande>("Hola")
        IMG("logo.png")
    ]
}
`);

/* --- Fase 3 --- */
probar('2) Formulario simple sin SUBMIT', `
login() {
    FORM {
        INPUT_TEXT(
            id: "user",
            label: "Usuario",
            value: ""
        )
    }
}
`);

probar('3) Formulario con tres tipos de input', `
registro() {
    FORM<azul> {
        INPUT_TEXT(id: "name", label: "Nombre", value: "")
        INPUT_NUMBER(id: "edad", label: "Edad", value: 18)
        INPUT_BOOL(id: "acepto", label: "Acepto?", value: true)
    }
}
`);

probar('4) Formulario con SUBMIT y referencias', `
updatePkmComponent(function functionUpdatePokemon, string currentName, int $currentPP) {
    FORM<estilo-form> {
        INPUT_TEXT(id: "name", label: "Nombre nuevo", value: "$currentName")
        INPUT_NUMBER(id: "pp", label: "PP", value: $currentPP)
        INPUT_BOOL(id: "valid", label: "Valido?", value: true)
    } SUBMIT<estilo-btn> {
        label: "Enviar",
        function: $functionUpdatePokemon(@valid, @name)
    }
}
`);

probar('5) Formulario con texto e imagen dentro', `
contacto() {
    FORM {
        T("Llena los datos:")
        IMG("logo.png")
        INPUT_TEXT(id: "email", label: "Correo", value: "")
    } SUBMIT {
        label: "Enviar"
    }
}
`);

probar('6) Formulario dentro de seccion', `
pagina() {
    <fondo>[
        T("Bienvenido")
        FORM<formulario> {
            INPUT_TEXT(id: "q", label: "Buscar", value: "")
        }
    ]
}
`);