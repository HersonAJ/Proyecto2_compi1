const GeneradorY = require('./GeneradorY');

const codigosPrueba = [
    {
        nombre: 'Imports y variables basicas',
        codigo: `
import "./misEstilos.styles";
import "./misComponentes.comp";

int edad = 25;
float precio = 99.99;
string nombre = "Herson";
boolean activo = True;
char inicial = 'H';
`
    },
    {
        nombre: 'Arreglos',
        codigo: `
int[] numeros = [10];
string[] pokemons = {"Bulbasaur", "Togepy", "Eevee"};
float[] equipo = execute \`my_table.power\`;
`
    },
    {
        nombre: 'Comentarios',
        codigo: `
/* Comentario multilinea */
# Comentario de linea
int x = 1;
`
    },
    {
        nombre: 'Error de tipo',
        codigo: `
int edad = "veinticinco";
`
    },
    {
        nombre: 'Import duplicado',
        codigo: `
import "./uno.styles";
import "./uno.styles";
`
    },
    {
        nombre: 'Import sin extension valida',
        codigo: `
import "./algo.txt";
`
    }
];

const generador = new GeneradorY();

for (let i = 0; i < codigosPrueba.length; i++) {
    const p = codigosPrueba[i];
    console.log('\n========== ' + p.nombre + ' ==========');
    const r = generador.analizar(p.codigo);
    console.log('Exito:', r.exito);
    console.log('AST:', JSON.stringify(r.ast, null, 2));
    if (r.errores.length > 0) {
        console.log('Errores:');
        for (let j = 0; j < r.errores.length; j++) {
            const e = r.errores[j];
            console.log('  [' + e.tipo + '] L' + e.linea + ':C' + e.columna + ' - ' + e.mensaje);
        }
    }
}