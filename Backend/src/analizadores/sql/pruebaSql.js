const path = require('path');
const fs = require('fs');
const GeneradorSQL = require('./GeneradorSQL');

// Crear proyecto temporal de pruebas
const dirTmp = path.resolve(__dirname, '../../../workspaces/__test_sql__');
if (fs.existsSync(dirTmp)) {
    fs.rmSync(dirTmp, { recursive: true, force: true });
}
fs.mkdirSync(dirTmp, { recursive: true });

const opciones = {
    ejecutar: true,
    proyecto: '__test_sql__',
    rutaBaseProyectos: path.resolve(__dirname, '../../../workspaces')
};

const generador = new GeneradorSQL();

function correr(nombre, codigo, esperaExito) {
    const r = generador.analizar(codigo, opciones);
    const ok = esperaExito ? r.exito : !r.exito;
    if (ok) {
        console.log('  [OK]    ' + nombre);
        if (r.resultados.length > 0) {
            for (let i = 0; i < r.resultados.length; i++) {
                console.log('          -> ' + r.resultados[i].mensaje);
                if (r.resultados[i].valores) {
                    console.log('          -> valores: ' + JSON.stringify(r.resultados[i].valores));
                }
            }
        }
    } else {
        console.log('  [FALLO] ' + nombre);
        if (r.errores.length > 0) {
            for (let i = 0; i < r.errores.length; i++) {
                const e = r.errores[i];
                console.log('          [' + e.tipo + '] L' + e.linea + ':C' + e.columna + ' - ' + e.mensaje);
            }
        }
    }
}

console.log('\n========== PRUEBAS SQL CON EJECUCION ==========\n');

correr('CREATE TABLE pokemons',
    `TABLE pokemons COLUMNS nombre=string, nivel=int, hp=float;`, true);

correr('INSERT 3 registros', `
pokemons[nombre="Pikachu", nivel=25, hp=50.5];
pokemons[nombre="Charizard", nivel=75, hp=120.0];
pokemons[nombre="Bulbasaur", nivel=10, hp=30.5];
`, true);

correr('SELECT nombre',
    `pokemons.nombre;`, true);

correr('SELECT nivel',
    `pokemons.nivel;`, true);

correr('UPDATE id=1',
    `pokemons[nivel=30, hp=55.0] IN 1;`, true);

correr('SELECT despues de update',
    `pokemons.nivel;`, true);

correr('DELETE id=2',
    `pokemons DELETE 2;`, true);

correr('SELECT despues de delete',
    `pokemons.nombre;`, true);

correr('CREATE TABLE con columna duplicada',
    `TABLE mala COLUMNS nombre=string, nombre=int;`, false);

correr('CREATE TABLE con columna llamada id',
    `TABLE mala2 COLUMNS id=int, otro=string;`, false);

correr('SELECT de tabla inexistente',
    `noExiste.algo;`, false);

correr('SELECT de columna inexistente',
    `pokemons.colorFavorito;`, false);

correr('INSERT en tabla inexistente',
    `noExiste[algo="hola"];`, false);

correr('UPDATE id que no existe',
    `pokemons[nivel=99] IN 9999;`, true);  // No es error, solo "no afecto filas"

correr('Multiples sentencias en orden', `
TABLE temp COLUMNS valor=int;
temp[valor=1];
temp[valor=2];
temp[valor=3];
temp.valor;
`, true);

// Limpiar
console.log('\nLimpiando proyecto temporal...');
fs.rmSync(dirTmp, { recursive: true, force: true });
console.log('');