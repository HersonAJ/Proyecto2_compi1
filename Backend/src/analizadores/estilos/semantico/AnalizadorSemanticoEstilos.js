const TablaSimbolos = require('../../tablas/TablaSimbolos');
const ErrorYFERA = require('../../errores/ErrorYFERA');
const ValidadorHerencia = require('./ValidadorHerencia');
const ValidadorPropiedades = require('./ValidadorPropiedades');
const ValidadorBucleFor = require('./ValidadorBucleFor');

class AnalizadorSemanticoEstilos {
    analizar(definiciones) {
        var tabla = new TablaSimbolos('global');
        var errores = [];

        if (!Array.isArray(definiciones)) {
            return { tabla: tabla, errores: errores };
        }

        // PASE 1: registrar todos los estilos en la tabla
        this._registrarDefiniciones(definiciones, tabla, errores);

        // PASE 2: validar usando los validadores
        var validadorHerencia = new ValidadorHerencia(tabla, errores);
        var validadorPropiedades = new ValidadorPropiedades(tabla, errores);
        var validadorBucleFor = new ValidadorBucleFor(tabla, errores, validadorHerencia, validadorPropiedades);

        for (var i = 0; i < definiciones.length; i++) {
            var def = definiciones[i];
            if (!def) continue;

            if (def.tipo === 'estilo') {
                validadorHerencia.validar(def);
                validadorPropiedades.validar(def);
            } else if (def.tipo === 'for') {
                validadorBucleFor.validar(def);
            }
        }

        return {
            tabla: tabla,
            errores: errores
        };
    }

    _registrarDefiniciones(definiciones, tabla, errores) {
        for (var i = 0; i < definiciones.length; i++) {
            var def = definiciones[i];
            if (!def) continue;

            if (def.tipo === 'estilo') {
                this._registrarEstilo(def, tabla, errores);
            } else if (def.tipo === 'for') {
                if (Array.isArray(def.cuerpo)) {
                    for (var j = 0; j < def.cuerpo.length; j++) {
                        this._registrarEstilo(def.cuerpo[j], tabla, errores);
                    }
                }
            }
        }
    }

    _registrarEstilo(estilo, tabla, errores) {
        if (!estilo || !estilo.nombre) return;

        var info = {
            tipo: 'estilo',
            nombre: estilo.nombre,
            extiende: estilo.extiende || null,
            propiedades: estilo.propiedades || [],
            linea: estilo.linea,
            columna: estilo.columna
        };

        var insertado = tabla.insertar(estilo.nombre, info);

        if (!insertado) {
            var existente = tabla.buscar(estilo.nombre);
            errores.push(
                new ErrorYFERA(
                    'Semantico',
                    estilo.nombre,
                    estilo.linea,
                    estilo.columna,
                    'El estilo "' + estilo.nombre + '" ya fue definido anteriormente en linea ' + existente.linea + ', columna ' + existente.columna + '.'
                )
            );
        }
    }
}

module.exports = AnalizadorSemanticoEstilos;