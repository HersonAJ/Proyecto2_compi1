/* Imports */
import "./estilos.styles";
import "./componentes.comp";

/* Datos del catalogo */
string nombreCatalogo = "Mi Biblioteca Personal";
int totalLibros = 4;

/* Datos extraidos de la base de datos */
string[] titulos = execute `libros.titulo`;
string[] autores = execute `libros.autor`;
int[] paginas = execute `libros.paginas`;
int[] calificaciones = execute `libros.calificacion`;

main {
    /* Encabezado del catalogo */
    @encabezadoCatalogo(nombreCatalogo, totalLibros);

    /* Primer libro */
    @fichaLibro(titulos[0], autores[0], paginas[0], calificaciones[0]);
    @etiquetaRating(calificaciones[0]);

    /* Segundo libro */
    @fichaLibro(titulos[1], autores[1], paginas[1], calificaciones[1]);
    @etiquetaRating(calificaciones[1]);

    /* Tercer libro */
    @fichaLibro(titulos[2], autores[2], paginas[2], calificaciones[2]);
    @etiquetaRating(calificaciones[2]);

    /* Cuarto libro */
    @fichaLibro(titulos[3], autores[3], paginas[3], calificaciones[3]);
    @etiquetaRating(calificaciones[3]);
}