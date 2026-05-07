const TablaSimbolos = require('../../tablas/TablaSimbolos');
const ValidadorImports = require('./ValidadorImports');
const ValidadorVariables = require('./ValidadorVariables');
const ValidadorFunciones = require('./ValidadorFunciones');
const ValidadorMain = require('./ValidadorMain');

class AnalizadorSemanticoY {
    constructor(opciones) {
        this.opciones = opciones || {};
        this.tabla = new TablaSimbolos();
        this.errores = [];
    }

    analizar(ast) {
        if (!Array.isArray(ast)) {
            return { tabla: this.tabla, errores: this.errores };
        }

        const imports = ast.filter(function (d) { return d && d.tipo === 'import'; });
        const variables = ast.filter(function (d) { return d && d.tipo === 'variable'; });
        const funciones = ast.filter(function (d) { return d && d.tipo === 'funcion'; });
        const mains = ast.filter(function (d) { return d && d.tipo === 'main'; });

        // Imports
        const validadorImports = new ValidadorImports(this.opciones);
        this.errores = this.errores.concat(validadorImports.validar(imports, this.tabla));

        // Variables globales
        const validadorVariables = new ValidadorVariables();
        this.errores = this.errores.concat(validadorVariables.validar(variables, this.tabla));

        // Funciones
        const validadorFunciones = new ValidadorFunciones();
        this.errores = this.errores.concat(validadorFunciones.validar(funciones, this.tabla));

        // Main (siempre se valida, incluso si esta vacio el array)
        const validadorMain = new ValidadorMain();
        this.errores = this.errores.concat(validadorMain.validar(mains, this.tabla));

        return { tabla: this.tabla, errores: this.errores };
    }
}

module.exports = AnalizadorSemanticoY;