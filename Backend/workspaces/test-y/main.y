import "./estilo.styles";
import "./componentes.comp";

string[] nombres = execute `pokemons.nombre`;

function renombrar(string nuevoNombre) {
    execute `pokemons[nombre=$nuevoNombre] IN 1`;
    load "./main.y";
}

main {
    @lista(nombres[0]);
    @formCard(renombrar, nombres[0]);
}