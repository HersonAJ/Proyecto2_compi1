const TablaSimbolos = require('../../tablas/TablaSimbolos');
const ValidadorImports = require('./ValidadorImports');
const ValidadorVariables = require('./ValidadorVariables');

class AnalizadorSemanticoY {
    constructor(opciones) {
        this.opciones = opciones || {};
        // opciones.proyecto: nombre del proyecto (para resolver imports en disco)
        // opciones.rutaArchivo: ruta del archivo .y dentro del proyecto
        this.tabla = new TablaSimbolos();
        this.errores = [];
    }

    analizar(ast) {
        if (!Array.isArray(ast)) {
            return { tabla: this.tabla, errores: this.errores };
        }

        // Separar por tipo de declaracion
        const imports = ast.filter(function (d) { return d && d.tipo === 'import'; });
        const variables = ast.filter(function (d) { return d && d.tipo === 'variable'; });

        // Validar imports
        const validadorImports = new ValidadorImports(this.opciones);
        const erroresImports = validadorImports.validar(imports, this.tabla);
        this.errores = this.errores.concat(erroresImports);

        // Validar variables globales
        const validadorVariables = new ValidadorVariables();
        const erroresVariables = validadorVariables.validar(variables, this.tabla);
        this.errores = this.errores.concat(erroresVariables);

        return { tabla: this.tabla, errores: this.errores };
    }
}

module.exports = AnalizadorSemanticoY;