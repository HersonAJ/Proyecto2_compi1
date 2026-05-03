const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorFormulario {
    constructor(tabla, errores) {
        this.tabla = tabla;
        this.errores = errores;
    }

    validar(formulario) {
        if (!formulario) return;

        // Recolectar IDs de inputs y validar duplicados
        var idsInputs = this._recolectarYValidarIds(formulario.elementos);

        // Validar referencias @id en el SUBMIT
        if (formulario.submit) {
            this._validarReferenciasSubmit(formulario.submit, idsInputs);
        }
    }

    
    //Recorre los elementos del formulario, extrae los inputs 
    _recolectarYValidarIds(elementos) {
        var idsVistos = new Map();

        var inputs = this._extraerInputs(elementos);

        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            var idValor = this._obtenerIdInput(input);

            if (idValor === null) continue;

            if (idsVistos.has(idValor)) {
                var primero = idsVistos.get(idValor);
                this.errores.push(
                    new ErrorYFERA(
                        'Semantico',
                        idValor,
                        input.linea,
                        input.columna,
                        'El input con id "' + idValor + '" ya fue declarado en linea ' + primero.linea + ', columna ' + primero.columna + '.'
                    )
                );
            } else {
                idsVistos.set(idValor, { linea: input.linea, columna: input.columna });
            }
        }

        return idsVistos;
    }

    /**
     * Recorre recursivamente la lista de elementos y extrae todos los inputs.
     * Esto permite que un input declarado dentro de un if cuente igual.
     */
    _extraerInputs(elementos) {
        var resultado = [];
        if (!Array.isArray(elementos)) return resultado;

        for (var i = 0; i < elementos.length; i++) {
            var nodo = elementos[i];
            if (!nodo) continue;

            if (nodo.tipo === 'input') {
                resultado.push(nodo);
            } else if (nodo.tipo === 'seccion' || nodo.tipo === 'tabla') {
                resultado = resultado.concat(this._extraerInputs(nodo.elementos));
            } else if (nodo.tipo === 'if') {
                resultado = resultado.concat(this._extraerInputs(nodo.elementos));
                if (Array.isArray(nodo.ramas_else)) {
                    for (var j = 0; j < nodo.ramas_else.length; j++) {
                        resultado = resultado.concat(this._extraerInputs(nodo.ramas_else[j].elementos));
                    }
                }
            } else if (nodo.tipo === 'switch') {
                if (Array.isArray(nodo.casos)) {
                    for (var k = 0; k < nodo.casos.length; k++) {
                        resultado = resultado.concat(this._extraerInputs(nodo.casos[k].elementos));
                    }
                }
                if (nodo.defecto) {
                    resultado = resultado.concat(this._extraerInputs(nodo.defecto.elementos));
                }
            } else if (nodo.tipo === 'for_each' || nodo.tipo === 'for_complejo') {
                resultado = resultado.concat(this._extraerInputs(nodo.elementos));
                if (nodo.vacio) {
                    resultado = resultado.concat(this._extraerInputs(nodo.vacio.elementos));
                }
            }
        }
        return resultado;
    }

    //Devuelve el valor literal del id si existe, o null si no se puede determinar.
    _obtenerIdInput(input) {
        if (!input || !Array.isArray(input.propiedades)) return null;

        for (var i = 0; i < input.propiedades.length; i++) {
            var p = input.propiedades[i];
            if (p.clave === 'id' && p.valor) {
                if (p.valor.tipo === 'literal') {
                    return p.valor.valor;
                }
            }
        }
        return null;
    }

    /**
     * Valida que cada @id usado en los argumentos de la funcion del SUBMIT
     * exista como id de algun input del FORM.
     */
    _validarReferenciasSubmit(submit, idsInputs) {
        if (!Array.isArray(submit.propiedades)) return;

        for (var i = 0; i < submit.propiedades.length; i++) {
            var p = submit.propiedades[i];
            if (p.clave !== 'function') continue;
            if (!p.valor || p.valor.tipo !== 'llamada_funcion') continue;

            var argumentos = p.valor.argumentos || [];
            for (var j = 0; j < argumentos.length; j++) {
                var arg = argumentos[j];
                if (arg.tipo !== 'referencia') continue;

                if (!idsInputs.has(arg.valor)) {
                    this.errores.push(
                        new ErrorYFERA(
                            'Semantico',
                            arg.valor,
                            p.valor.linea,
                            p.valor.columna,
                            'La referencia "@' + arg.valor + '" no corresponde al id de ningun input de este formulario.'
                        )
                    );
                }
            }
        }
    }
}

module.exports = ValidadorFormulario;