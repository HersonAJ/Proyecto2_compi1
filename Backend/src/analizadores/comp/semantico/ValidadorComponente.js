const ErrorYFERA = require('../../errores/ErrorYFERA');

const TIPOS_VALIDOS = ['int', 'float', 'string', 'boolean', 'char', 'function'];

class ValidadorComponente {
    constructor(tabla, errores) {
        this.tabla = tabla;
        this.errores = errores;
    }

    validar(componente) {
        if (!componente) return;

        var scopeComponente = this.tabla.crearScopeHijo('componente_' + componente.nombre);

        // Validar parametros
        if (Array.isArray(componente.parametros)) {
            this._validarParametros(componente.parametros, scopeComponente);
        }
        componente._scope = scopeComponente;
    }

    _validarParametros(parametros, scope) {
        for (var i = 0; i < parametros.length; i++) {
            var p = parametros[i];
            if (!p) continue;

            // 1. Tipo valido
            if (TIPOS_VALIDOS.indexOf(p.tipoDato) === -1) {
                this.errores.push(
                    new ErrorYFERA(
                        'Semantico',
                        p.tipoDato,
                        p.linea,
                        p.columna,
                        'Tipo de parametro "' + p.tipoDato + '" no es valido. Tipos permitidos: ' + TIPOS_VALIDOS.join(', ') + '.'
                    )
                );
                continue;
            }

            // 2. Parametro duplicado en el mismo componente
            if (scope.existeLocal(p.nombre)) {
                var existente = scope.buscarLocal(p.nombre);
                this.errores.push(
                    new ErrorYFERA(
                        'Semantico',
                        p.nombre,
                        p.linea,
                        p.columna,
                        'El parametro "' + p.nombre + '" ya fue declarado en la linea ' + existente.linea + ', columna ' + existente.columna + '.'
                    )
                );
                continue;
            }

            // Registrar parametro en el scope
            scope.insertar(p.nombre, {
                tipo: 'parametro',
                tipoDato: p.tipoDato,
                nombre: p.nombre,
                linea: p.linea,
                columna: p.columna
            });
        }
    }
}

module.exports = ValidadorComponente;