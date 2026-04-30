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

/* --- sanity --- */
probar('1) Sanity: expresion aislada sigue funcionando', `1 + 2 * 3`);

/* --- IF --- */
probar('2) If solo', `
demo() {
    if ( $a == "hola" ) {
        T("hola")
    }
}
`);

probar('3) If con else final', `
demo() {
    if ( $x > 10 ) {
        T("grande")
    } else {
        T("chico")
    }
}
`);

probar('4) If con else cond y else final', `
demo() {
    if ( $x == "a" ) {
        T("uno")
    } else ( $x == "b" && $valido ) {
        T("dos")
    } else {
        T("otro")
    }
}
`);

/* --- SWITCH --- */
probar('5) Switch con casos y default', `
demo() {
    Switch( $opcion ) {
        case "a" {
            T("opcion a")
        },
        case "b" {
            T("opcion b")
        },
        default {
            T("ninguna")
        }
    }
}
`);

probar('6) Switch sin default, valores numericos', `
demo() {
    Switch( $codigo ) {
        case 1 {
            T("uno")
        },
        case 2 {
            T("dos")
        }
    }
}
`);

/* --- FOR --- */
probar('7) For each sencillo', `
demo() {
    for each ( $pkm : $equipo ) {
        T("Tengo a $pkm")
    }
}
`);

probar('8) For complejo con track y empty', `
demo() {
    for ( $pkm : $equipo, $stat : $stats ) track $idx {
        T("Pokemon $pkm con stat $stat")
    } empty {
        T("equipo vacio")
    }
}
`);

probar('9) For complejo sin empty', `
demo() {
    for ( $a : $arr ) track $i {
        T("$a")
    }
}
`);

/* --- ANIDACION --- */
probar('10) If dentro de For', `
demo() {
    for each ( $p : $lista ) {
        if ( $p == "raro" ) {
            T("encontrado")
        } else {
            T("normal")
        }
    }
}
`);

probar('11) Switch dentro de seccion con if dentro de un caso', `
demo() {
    [
        Switch( $tipo ) {
            case "fuego" {
                if ( $nivel > 50 ) {
                    T("fuego fuerte")
                }
            },
            default {
                T("desconocido")
            }
        }
    ]
}
`);