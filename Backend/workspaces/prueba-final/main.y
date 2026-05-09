/* Imports */
import "./estilos.styles";
import "./componentes.comp";

/* Variables simples */
int contadorActual = 0;
float promedio = 75.5;
string saludo = "Hola entrenador";
boolean torneoActivo = True;
char inicial = 'A';
int i = 0;

/* Arreglos */
int[] niveles = {25, 75, 60};
string[] nombres = execute `pokemons.nombre`;

/* Funcion que actualiza un pokemon */
function actualizar(string nuevoNombre, int nuevoNivel) {
    execute `pokemons[nombre=$nuevoNombre, nivel=$nuevoNivel] IN 1`;
    load "./main.y";
}

main {
    /* Componente con argumentos literales */
    @encabezado(saludo, 3);

    /* If con condicion booleana */
    if (torneoActivo) {
        @fichaPokemon(nombres[0], niveles[0], False);
        @fichaPokemon(nombres[0], niveles[1], True);
    } else {
        @fichaPokemon("Sin datos", 0, False);
    }

    /* Switch sobre variable */
    switch (contadorActual) {
        case 0:
            @encabezado("Sin actividad", 0);
            break;
        case 1:
            @encabezado("Una accion", 1);
            break;
        default:
            break;
    }

      /* While */
    while (i < 1) {
        @listaPokemones(nombres[0], nombres[1], nombres[2]);
        i = i + 1;
    }

    /* For */
    for (i = 0; i < 1; i = i + 1) {
        @formularioEdicion(actualizar, nombres[0], 30);
    }

    /* Do-while */
    do {
        @encabezado("Final", 99);
    } while (False)
}