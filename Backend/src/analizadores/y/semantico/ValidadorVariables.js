const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorVariables {
    validar(variables, tabla) {
        const errores = [];

        for (let i = 0; i < variables.length; i++) {
            const v = variables[i];

            // Verificar redeclaracion
            const yaExiste = tabla.buscar ? tabla.buscar(v.nombre) : null;

            if (tabla.existeLocal(v.nombre)) {
                errores.push(new ErrorYFERA(
                    'Semantico',
                    v.nombre,
                    v.linea,
                    v.columna,
                    'La variable "' + v.nombre + '" ya fue declarada anteriormente'
                ));
                continue;
            }

            // Validar inicializador
            if (v.esArreglo) {
                const erroresArreglo = this._validarInicializadorArreglo(v);
                errores.push.apply(errores, erroresArreglo);
            } else {
                const erroresEscalar = this._validarInicializadorEscalar(v);
                errores.push.apply(errores, erroresEscalar);
            }

            // Registrar en tabla
            tabla.insertar(v.nombre, {
                categoria: 'variable',
                tipoDato: v.tipoDato,
                esArreglo: v.esArreglo,
                linea: v.linea,
                columna: v.columna
            });
        }

        return errores;
    }

    _validarInicializadorEscalar(v) {
        const errores = [];
        const tipoExpr = this._inferirTipoSimple(v.inicializador);

        if (tipoExpr === null) return errores;

        if (!this._tiposCompatibles(v.tipoDato, tipoExpr)) {
            errores.push(new ErrorYFERA(
                'Semantico',
                v.nombre,
                v.linea,
                v.columna,
                'No se puede asignar un valor de tipo "' + tipoExpr + '" a la variable "' + v.nombre + '" de tipo "' + v.tipoDato + '"'
            ));
        }

        return errores;
    }

    _validarInicializadorArreglo(v) {
        const errores = [];
        const init = v.inicializador;

        if (init.tipo === 'arreglo_tamano') {
            if (init.tamano < 0) {
                errores.push(new ErrorYFERA(
                    'Semantico',
                    v.nombre,
                    v.linea,
                    v.columna,
                    'El tamano del arreglo "' + v.nombre + '" no puede ser negativo'
                ));
            }
        } else if (init.tipo === 'arreglo_valores') {
            for (let i = 0; i < init.valores.length; i++) {
                const tipoVal = this._inferirTipoSimple(init.valores[i]);
                if (tipoVal !== null && !this._tiposCompatibles(v.tipoDato, tipoVal)) {
                    errores.push(new ErrorYFERA(
                        'Semantico',
                        v.nombre,
                        v.linea,
                        v.columna,
                        'El valor en la posicion ' + i + ' del arreglo "' + v.nombre + '" es de tipo "' + tipoVal + '" pero el arreglo es de tipo "' + v.tipoDato + '"'
                    ));
                }
            }
        }

        return errores;
    }

    _inferirTipoSimple(expr) {
        if (!expr || !expr.tipo) return null;
        switch (expr.tipo) {
            case 'numero_entero': return 'int';
            case 'numero_decimal': return 'float';
            case 'cadena': return 'string';
            case 'caracter': return 'char';
            case 'booleano': return 'boolean';
            default: return null;
        }
    }

    _tiposCompatibles(esperado, recibido) {
        if (esperado === recibido) return true;
        if (esperado === 'float' && recibido === 'int') return true;
        return false;
    }
}

module.exports = ValidadorVariables;