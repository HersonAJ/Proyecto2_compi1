const TablaSimbolos = require('../../tablas/TablaSimbolos');
const ErrorYFERA = require('../../errores/ErrorYFERA');
const ValidadorComponente = require('./ValidadorComponente');
const ValidadorVariables = require('./ValidadorVariables');
const ValidadorBucleFor = require('./ValidadorBucleFor');
var ValidadorCondicion = require('./ValidadorCondicion');
var ValidadorFormulario = require('./ValidadorFormulario');

class AnalizadorSemanticoComp {
    analizar(componentes) {
        var tabla = new TablaSimbolos('global');
        var errores = [];

        if (!Array.isArray(componentes)) {
            return { tabla: tabla, errores: errores };
        }

        //1: registrar todos los componentes
        this._registrarComponentes(componentes, tabla, errores);

        // PASE 2: instanciar validadores
        var validadorComponente = new ValidadorComponente(tabla, errores);
        var validadorVariables = new ValidadorVariables(tabla, errores);
        var validadorBucleFor = new ValidadorBucleFor(tabla, errores, validadorVariables);
        var validadorCondicion = new ValidadorCondicion(tabla, errores);
        var validadorFormulario = new ValidadorFormulario(tabla, errores);


        validadorVariables.setValidadorBucleFor(validadorBucleFor);
        validadorVariables.setValidadorCondicion(validadorCondicion);
        validadorVariables.setValidadorFormulario(validadorFormulario);

        //2: validar cada componente con sus parametros y cuerpo
        for (var i = 0; i < componentes.length; i++) {
            var comp = componentes[i];
            if (!comp || comp.tipo !== 'componente') continue;

            validadorComponente.validar(comp);

            if (comp._scope) {
                validadorVariables.validarElementos(comp.elementos, comp._scope);
            }
        }

        return {
            tabla: tabla,
            errores: errores
        };
    }

    _registrarComponentes(componentes, tabla, errores) {
        for (var i = 0; i < componentes.length; i++) {
            var comp = componentes[i];
            if (!comp || comp.tipo !== 'componente') continue;

            var info = {
                tipo: 'componente',
                nombre: comp.nombre,
                parametros: comp.parametros || [],
                linea: comp.linea,
                columna: comp.columna
            };

            var insertado = tabla.insertar(comp.nombre, info);

            if (!insertado) {
                var existente = tabla.buscar(comp.nombre);
                errores.push(
                    new ErrorYFERA(
                        'Semantico',
                        comp.nombre,
                        comp.linea,
                        comp.columna,
                        'El componente "' + comp.nombre + '" ya fue definido anteriormente en linea ' + existente.linea + ', columna ' + existente.columna + '.'
                    )
                );
            }
        }
    }
}

module.exports = AnalizadorSemanticoComp;