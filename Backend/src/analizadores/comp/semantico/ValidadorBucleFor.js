const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorBucleFor {
    constructor(tabla, errores, validadorVariables) {
        this.tabla = tabla;
        this.errores = errores;
        this.validadorVariables = validadorVariables;
    }

    validar(bucle, scopePadre) {
        if (!bucle) return;

        var scopeFor = scopePadre.crearScopeHijo('for_' + bucle.linea);

        if (Array.isArray(bucle.pares)) {
            for (var i = 0; i < bucle.pares.length; i++) {
                var par = bucle.pares[i];
                if (!par) continue;

                // 1. Verificar que el arreglo este declarado 
                if (!scopePadre.existe(par.arreglo)) {
                    this.errores.push(
                        new ErrorYFERA(
                            'Semantico',
                            par.arreglo,
                            par.linea,
                            par.columna,
                            'La variable "$' + par.arreglo + '" no esta declarada en este scope.'
                        )
                    );
                }

                // 2. Variable iteradora duplicada en el for
                if (scopeFor.existeLocal(par.variable)) {
                    var existente = scopeFor.buscarLocal(par.variable);
                    this.errores.push(
                        new ErrorYFERA(
                            'Semantico',
                            par.variable,
                            par.linea,
                            par.columna,
                            'La variable "$' + par.variable + '" ya fue declarada en este for en linea ' + existente.linea + '.'
                        )
                    );
                    continue;
                }

                // Registrar la variable iteradora
                scopeFor.insertar(par.variable, {
                    tipo: 'variable_for',
                    nombre: par.variable,
                    linea: par.linea,
                    columna: par.columna
                });
            }
        }

        // Registrar variable de tracking si es for_complejo
        if (bucle.tipo === 'for_complejo' && bucle.indice) {
            if (scopeFor.existeLocal(bucle.indice)) {
                this.errores.push(
                    new ErrorYFERA(
                        'Semantico',
                        bucle.indice,
                        bucle.linea,
                        bucle.columna,
                        'La variable de track "$' + bucle.indice + '" colisiona con una variable iteradora del mismo for.'
                    )
                );
            } else {
                scopeFor.insertar(bucle.indice, {
                    tipo: 'variable_track',
                    nombre: bucle.indice,
                    linea: bucle.linea,
                    columna: bucle.columna
                });
            }
        }

        // Validar el cuerpo del for con el scope nuevo
        this.validadorVariables.validarElementos(bucle.elementos, scopeFor);

        // se ejecuta cuando el arreglo esta vacio y no tiene acceso a las variables del for
        if (bucle.vacio && Array.isArray(bucle.vacio.elementos)) {
            this.validadorVariables.validarElementos(bucle.vacio.elementos, scopePadre);
        }
    }
}

module.exports = ValidadorBucleFor;