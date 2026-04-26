const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorHerencia {
    constructor(tabla, errores) {
        this.tabla = tabla;
        this.errores = errores;
    }

    validar(estilo) {
        if (!estilo || !estilo.extiende) return;

        var padre = estilo.extiende;

        // Caso 1: heredarse de si mismo
        if (padre === estilo.nombre) {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    padre,
                    estilo.linea,
                    estilo.columna,
                    'El estilo "' + estilo.nombre + '" no puede heredarse de si mismo.'
                )
            );
            return;
        }

        // Caso 2: el padre no existe
        var padreInfo = this.tabla.buscar(padre);
        if (!padreInfo) {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    padre,
                    estilo.linea,
                    estilo.columna,
                    'El estilo "' + estilo.nombre + '" extiende de "' + padre + '" pero ese estilo no esta definido.'
                )
            );
            return;
        }

        // Caso 3: herencia circular
        // Solo reportar desde uno de los lados del ciclo (el alfabeticamente menor)
        if (this._tieneHerenciaCircular(estilo.nombre, padre)) {
            if (estilo.nombre < padre) {
                this.errores.push(
                    new ErrorYFERA(
                        'Semantico',
                        padre,
                        estilo.linea,
                        estilo.columna,
                        'Herencia circular detectada entre "' + estilo.nombre + '" y "' + padre + '".'
                    )
                );
            }
        }
    }

    _tieneHerenciaCircular(nombreOrigen, nombrePadre) {
        var visitados = new Set();
        var actual = nombrePadre;

        while (actual) {
            if (visitados.has(actual)) return true;
            if (actual === nombreOrigen) return true;
            visitados.add(actual);

            var info = this.tabla.buscar(actual);
            if (!info) break;
            actual = info.extiende;
        }

        return false;
    }
}

module.exports = ValidadorHerencia;