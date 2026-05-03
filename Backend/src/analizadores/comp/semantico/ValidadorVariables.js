const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorVariables {
    constructor(tabla, errores) {
        this.tabla = tabla;
        this.errores = errores;
        this.validadorBucleFor = null;
        this.validadorCondicion = null;
        this.validadorFormulario = null;
    }

    setValidadorBucleFor(validadorBucleFor) {
        this.validadorBucleFor = validadorBucleFor;
    }

    setValidadorCondicion(validadorCondicion) {
        this.validadorCondicion = validadorCondicion;
    }

    setValidadorFormulario(validadorFormulario) {
    this.validadorFormulario = validadorFormulario;
}

    //Punto de entrada principal. Recorre una lista de elementos del cuerpo
    validarElementos(elementos, scope) {
        if (!Array.isArray(elementos)) return;
        for (var i = 0; i < elementos.length; i++) {
            this._validarElemento(elementos[i], scope);
        }
    }

    _validarElemento(nodo, scope) {
        if (!nodo) return;

        switch (nodo.tipo) {
            case 'seccion':
            case 'tabla':
                this.validarElementos(nodo.elementos, scope);
                break;

            case 'texto':
                break;

            case 'imagen':
                this._validarImagen(nodo, scope);
                break;

    case 'formulario':
        if (this.validadorFormulario) {
            this.validadorFormulario.validar(nodo);
        }
        this.validarElementos(nodo.elementos, scope);
        if (nodo.submit) {
            this._validarSubmit(nodo.submit, scope);
        }
        break;

                case 'input':
                    this._validarInput(nodo, scope);
                    break;

                case 'if':
                    this._validarIf(nodo, scope);
                    break;

                case 'switch':
                    this._validarSwitch(nodo, scope);
                    break;

                case 'for_each':
                case 'for_complejo':
                    if (this.validadorBucleFor) {
                        this.validadorBucleFor.validar(nodo, scope);
                    }
                    break;
            }
        }

    _validarImagen(nodo, scope) {
        if (!Array.isArray(nodo.urls)) return;
        for (var i = 0; i < nodo.urls.length; i++) {
            var url = nodo.urls[i];
            if (url.tipo === 'expresion') {
                this.validarExpresion(url.valor, scope);
            }
        }
    }

    _validarInput(nodo, scope) {
        if (!Array.isArray(nodo.propiedades)) return;
        for (var i = 0; i < nodo.propiedades.length; i++) {
            var p = nodo.propiedades[i];
            if (p && p.valor && p.valor.tipo === 'variable') {
                this._chequearVariable(p.valor.valor, p.linea || nodo.linea, p.columna || nodo.columna, scope);
            }
        }
    }

    _validarSubmit(submit, scope) {
        if (!Array.isArray(submit.propiedades)) return;
        for (var i = 0; i < submit.propiedades.length; i++) {
            var p = submit.propiedades[i];
            if (p.clave === 'function' && p.valor && p.valor.tipo === 'llamada_funcion') {
                this._validarLlamadaFuncion(p.valor, scope);
            }
        }
    }

    _validarLlamadaFuncion(llamada, scope) {
        // Validar que la funcion (variable) este declarada
        this._chequearVariable(llamada.nombre, llamada.linea, llamada.columna, scope);

        // Validar argumentos
        if (Array.isArray(llamada.argumentos)) {
            for (var i = 0; i < llamada.argumentos.length; i++) {
                var arg = llamada.argumentos[i];
                if (arg.tipo === 'variable') {
                    this._chequearVariable(arg.valor, llamada.linea, llamada.columna, scope);
                }

            }
        }
    }

    _validarIf(nodo, scope) {
        this.validarExpresion(nodo.condicion, scope);

        // Validar tipo de condicion
        if (this.validadorCondicion) {
            this.validadorCondicion.validarIf(nodo, scope);
        }

        this.validarElementos(nodo.elementos, scope);

        if (Array.isArray(nodo.ramas_else)) {
            for (var i = 0; i < nodo.ramas_else.length; i++) {
                var rama = nodo.ramas_else[i];
                if (rama.tipo === 'else_if') {
                    this.validarExpresion(rama.condicion, scope);
                    this.validarElementos(rama.elementos, scope);
                } else if (rama.tipo === 'else') {
                    this.validarElementos(rama.elementos, scope);
                }
            }
        }
    }

    _validarSwitch(nodo, scope) {
        this.validarExpresion(nodo.expresion, scope);

        // Validar tipo de expresion del switch y de los casos
        if (this.validadorCondicion) {
            this.validadorCondicion.validarSwitch(nodo, scope);
        }

        if (Array.isArray(nodo.casos)) {
            for (var i = 0; i < nodo.casos.length; i++) {
                this.validarElementos(nodo.casos[i].elementos, scope);
            }
        }
        if (nodo.defecto) {
            this.validarElementos(nodo.defecto.elementos, scope);
        }
    }

    //Recorre una expresion validando cada variable que aparezca
    validarExpresion(expr, scope) {
        if (!expr) return;

        switch (expr.tipo) {
            case 'numero':
            case 'cadena':
            case 'booleano':
                break;

            case 'variable':
                this._chequearVariable(expr.nombre, expr.linea, expr.columna, scope);
                break;

            case 'acceso_array':
                this._chequearVariable(expr.nombre, expr.linea, expr.columna, scope);
                this.validarExpresion(expr.indice, scope);
                break;

            // Operaciones binarias
            case 'suma':
            case 'resta':
            case 'multiplicacion':
            case 'division':
            case 'modulo':
            case 'mayor':
            case 'mayor_igual':
            case 'menor':
            case 'menor_igual':
            case 'igual_igual':
            case 'diferente':
            case 'and':
            case 'or':
                this.validarExpresion(expr.izq, scope);
                this.validarExpresion(expr.der, scope);
                break;

            // Operaciones unarias
            case 'menos_unario':
            case 'negacion':
                this.validarExpresion(expr.operando, scope);
                break;
        }
    }

    _chequearVariable(nombre, linea, columna, scope) {
        if (!scope.existe(nombre)) {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    nombre,
                    linea,
                    columna,
                    'La variable "$' + nombre + '" no esta declarada en este scope.'
                )
            );
        }
    }
}

module.exports = ValidadorVariables;