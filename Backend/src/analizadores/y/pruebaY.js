const GeneradorY = require('./GeneradorY');

/**
 * Define un caso de prueba.
 * - codigo: el .y a analizar
 * - esperaExito: true si esperamos exito: true en el resultado
 * - mensajesEsperados: subcadenas que deben aparecer en algun mensaje de error
 *   (solo se chequea si esperaExito es false)
 */
const casos = [
{
    nombre: 'Imports y variables basicas',
    esperaExito: true,
    codigo: `
import "./misEstilos.styles";
import "./misComponentes.comp";

int edad = 25;
float precio = 99.99;
string nombre = "Herson";
boolean activo = True;
char inicial = 'H';

main {}
`
},
{
    nombre: 'Arreglos',
    esperaExito: true,
    codigo: `
int[] numeros = [10];
string[] pokemons = {"Bulbasaur", "Togepy", "Eevee"};
float[] equipo = execute \`my_table.power\`;

main {}
`
},
{
    nombre: 'Comentarios',
    esperaExito: true,
    codigo: `
/* Comentario multilinea */
# Comentario de linea
int x = 1;

main {}
`
},
    {
        nombre: 'Error de tipo',
        esperaExito: false,
        mensajesEsperados: ['No se puede asignar un valor de tipo "string"'],
        codigo: `int edad = "veinticinco";`
    },
    {
        nombre: 'Import duplicado',
        esperaExito: false,
        mensajesEsperados: ['ya fue declarado anteriormente'],
        codigo: `
import "./uno.styles";
import "./uno.styles";
`
    },
    {
        nombre: 'Import sin extension valida',
        esperaExito: false,
        mensajesEsperados: ['debe terminar en .styles o .comp'],
        codigo: `import "./algo.txt";`
    },
{
    nombre: 'Funcion vacia',
    esperaExito: true,
    codigo: `
function vacia() {}
main {}
`
},
{
    nombre: 'Funcion con parametros y cuerpo',
    esperaExito: true,
    codigo: `
function actualizar(int pp, int atack, int id, string destino) {
    execute \`my_pokemon_team[power_points=$pp, atack=$atack] IN $id\`;
    load destino;
}

function reiniciar() {
    load "./main.y";
}

main {}
`
},
{
    nombre: 'Funcion con parametros arreglo',
    esperaExito: true,
    codigo: `
function procesar(int[] datos, string nombre) {
    execute \`tabla.col\`;
}

main {}
`
},
    {
        nombre: 'Funcion duplicada',
        esperaExito: false,
        mensajesEsperados: ['Ya existe una declaracion con el nombre "uno"'],
        codigo: `
function uno() { load "./main.y"; }
function uno() { load "./main.y"; }
`
    },
    {
        nombre: 'Parametros duplicados',
        esperaExito: false,
        mensajesEsperados: ['parametro "x" esta duplicado'],
        codigo: `
function malo(int x, string x) {
    execute \`tabla.col\`;
}
`
    },
    {
        nombre: 'load con archivo no .y',
        esperaExito: false,
        mensajesEsperados: ['debe ser un archivo con extension .y'],
        codigo: `
function malo() {
    load "./main.txt";
}
`
    },
    {
        nombre: 'Funcion con sentencia invalida (rechazado por gramatica)',
        esperaExito: false,
        mensajesEsperados: ['Se esperaba'],
        codigo: `
function malo() {
    int x = 5;
}
`
    },
    {
        nombre: 'Funcion anidada (rechazado por gramatica)',
        esperaExito: false,
        mensajesEsperados: ['Se esperaba'],
        codigo: `
function externa() {
    function interna() {
        load "./main.y";
    }
}
`
    },
    {
        nombre: 'Funcion choca con variable',
        esperaExito: false,
        mensajesEsperados: ['Ya existe una declaracion con el nombre "activar"'],
        codigo: `
int activar = 5;
function activar() { load "./main.y"; }
`
    },
    {
    nombre: 'Programa minimo con main vacio',
    esperaExito: true,
    codigo: `main {}`
},
{
    nombre: 'Main con invocaciones e asignaciones',
    esperaExito: true,
    codigo: `
int contador = 0;
string[] nombres = {"Ash", "Misty", "Brock"};

main {
    @header();
    @lista(nombres);
    @item(nombres[0], contador);
    contador = contador + 1;
    nombres[1] = "Brock";
}
`
},
{
    nombre: 'Sin main',
    esperaExito: false,
    mensajesEsperados: ['debe tener un bloque "main"'],
    codigo: `int x = 5;`
},
{
    nombre: 'Dos mains',
    esperaExito: false,
    mensajesEsperados: ['Solo se permite un bloque "main"'],
    codigo: `
main {}
main {}
`
},
{
    nombre: 'Asignacion a variable no declarada',
    esperaExito: false,
    mensajesEsperados: ['no esta declarada'],
    codigo: `
main {
    fantasma = 5;
}
`
},
{
    nombre: 'Asignacion con indice a no-arreglo',
    esperaExito: false,
    mensajesEsperados: ['no es un arreglo'],
    codigo: `
int x = 5;
main {
    x[0] = 10;
}
`
},
{
    nombre: 'Argumento referencia variable inexistente',
    esperaExito: false,
    mensajesEsperados: ['no esta declarada'],
    codigo: `
main {
    @comp(variableQueNoExiste);
}
`
},
{
    nombre: 'Asignacion a funcion (no es variable)',
    esperaExito: false,
    mensajesEsperados: ['no es una variable'],
    codigo: `
function f() { load "./main.y"; }

main {
    f = 5;
}
`
}
];

const generador = new GeneradorY();
let pasados = 0;
let fallados = 0;

console.log('\n========== EJECUTANDO PRUEBAS ==========\n');

for (let i = 0; i < casos.length; i++) {
    const c = casos[i];
    const r = generador.analizar(c.codigo);

    let estado = 'OK';
    let detalle = '';

    if (c.esperaExito) {
        if (!r.exito) {
            estado = 'FALLO';
            detalle = 'Se esperaba exito pero hubo errores: ' +
                r.errores.map(function (e) { return '[' + e.tipo + '] ' + e.mensaje; }).join('; ');
        }
    } else {
        if (r.exito) {
            estado = 'FALLO';
            detalle = 'Se esperaba error pero el analisis fue exitoso';
        } else if (c.mensajesEsperados && c.mensajesEsperados.length > 0) {
            // Verificar que cada mensaje esperado aparezca en algun error
            for (let j = 0; j < c.mensajesEsperados.length; j++) {
                const esperado = c.mensajesEsperados[j];
                const encontrado = r.errores.some(function (e) {
                    return e.mensaje.indexOf(esperado) !== -1;
                });
                if (!encontrado) {
                    estado = 'FALLO';
                    detalle = 'No se encontro el mensaje esperado: "' + esperado +
                        '". Mensajes obtenidos: ' +
                        r.errores.map(function (e) { return '"' + e.mensaje + '"'; }).join(', ');
                    break;
                }
            }
        }
    }

    if (estado === 'OK') {
        pasados++;
        console.log('  [OK]    ' + c.nombre);
    } else {
        fallados++;
        console.log('  [FALLO] ' + c.nombre);
        console.log('          ' + detalle);
    }
}

console.log('\n========== RESUMEN ==========');
console.log('Total:    ' + casos.length);
console.log('Pasados:  ' + pasados);
console.log('Fallados: ' + fallados);
console.log('');

process.exit(fallados > 0 ? 1 : 0);