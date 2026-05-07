const ErrorYFERA = require('../../errores/ErrorYFERA');
const ValidadorBloques = require('./ValidadorBloques');

class ValidadorMain {
    validar(mains, tabla) {
        const errores = [];

        if (mains.length === 0) {
            errores.push(new ErrorYFERA(
                'Semantico',
                'main',
                0,
                0,
                'El programa debe tener un bloque "main"'
            ));
            return errores;
        }

        if (mains.length > 1) {
            for (let i = 1; i < mains.length; i++) {
                errores.push(new ErrorYFERA(
                    'Semantico',
                    'main',
                    mains[i].linea,
                    mains[i].columna,
                    'Solo se permite un bloque "main" por archivo'
                ));
            }
        }

        const main = mains[0];
        const validadorBloques = new ValidadorBloques();
        const erroresCuerpo = validadorBloques.validarCuerpo(main.cuerpo, tabla, this);
        errores.push.apply(errores, erroresCuerpo);

        return errores;
    }

    _validarInvocacion(inv, tabla, errores) {
        for (let i = 0; i < inv.argumentos.length; i++) {
            this._validarExpresion(inv.argumentos[i], tabla, errores);
        }
    }

    _validarAsignacion(asig, tabla, errores) {
        // Validar que la variable este declarada
        const simbolo = tabla.buscar(asig.nombre);
        if (!simbolo) {
            errores.push(new ErrorYFERA(
                'Semantico',
                asig.nombre,
                asig.linea,
                asig.columna,
                'La variable "' + asig.nombre + '" no esta declarada'
            ));
            return;
        }

        if (simbolo.categoria !== 'variable') {
            errores.push(new ErrorYFERA(
                'Semantico',
                asig.nombre,
                asig.linea,
                asig.columna,
                '"' + asig.nombre + '" no es una variable, es ' + simbolo.categoria
            ));
            return;
        }

        // Si tiene indice, la variable debe ser arreglo
        if (asig.indice !== null) {
            if (!simbolo.esArreglo) {
                errores.push(new ErrorYFERA(
                    'Semantico',
                    asig.nombre,
                    asig.linea,
                    asig.columna,
                    'No se puede usar indice "[]" en "' + asig.nombre + '" porque no es un arreglo'
                ));
            }
            this._validarExpresion(asig.indice, tabla, errores);
        }

        this._validarExpresion(asig.expresion, tabla, errores);
    }

    _validarExpresion(expr, tabla, errores) {
        if (!expr || typeof expr !== 'object') return;

        switch (expr.tipo) {
            case 'identificador': {
                const sim = tabla.buscar(expr.nombre);
                if (!sim) {
                    errores.push(new ErrorYFERA(
                        'Semantico',
                        expr.nombre,
                        expr.linea,
                        expr.columna,
                        'La variable o funcion "' + expr.nombre + '" no esta declarada'
                    ));
                }
                break;
            }
            case 'acceso_array': {
                const sim = tabla.buscar(expr.nombre);
                if (!sim) {
                    errores.push(new ErrorYFERA(
                        'Semantico',
                        expr.nombre,
                        expr.linea,
                        expr.columna,
                        'El arreglo "' + expr.nombre + '" no esta declarado'
                    ));
                } else if (sim.categoria === 'variable' && !sim.esArreglo) {
                    errores.push(new ErrorYFERA(
                        'Semantico',
                        expr.nombre,
                        expr.linea,
                        expr.columna,
                        '"' + expr.nombre + '" no es un arreglo, no se puede acceder con []'
                    ));
                }
                this._validarExpresion(expr.indice, tabla, errores);
                break;
            }
            case 'or':
            case 'and':
            case 'mayor':
            case 'mayor_igual':
            case 'menor':
            case 'menor_igual':
            case 'igual_igual':
            case 'diferente':
            case 'suma':
            case 'resta':
            case 'multiplicacion':
            case 'division':
            case 'modulo':
                this._validarExpresion(expr.izq, tabla, errores);
                this._validarExpresion(expr.der, tabla, errores);
                break;
            case 'negacion':
            case 'menos_unario':
                this._validarExpresion(expr.operando, tabla, errores);
                break;
        }
    }
}

module.exports = ValidadorMain;