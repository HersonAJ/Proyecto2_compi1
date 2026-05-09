/* Imports */
import "./estilos.styles";
import "./componentes.comp";

/* Datos personales */
string miNombre = "Herson Aguilar";
string miProfesion = "Ingeniero en Ciencias y Sistemas";

/* Datos de contacto */
string miEmail = "herson@cunoc.edu";
string miTelefono = "5555-1234";
string miCiudad = "Quetzaltenango, Guatemala";

/* Datos de experiencia */
string puesto1 = "Estudiante de Compiladores";
string empresa1 = "CUNOC USAC";
int anos1 = 1;

/* Habilidades */
string hab1 = "JavaScript";
string hab2 = "TypeScript";
string hab3 = "Angular";

main {
    @encabezado(miNombre, miProfesion);
    @contacto(miEmail, miTelefono, miCiudad);
    @experiencia(puesto1, empresa1, anos1);
    @etiquetaHabilidad(hab1);
    @etiquetaHabilidad(hab2);
    @etiquetaHabilidad(hab3);
}