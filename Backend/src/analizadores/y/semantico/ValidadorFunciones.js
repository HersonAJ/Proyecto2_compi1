const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorFunciones {
    validar(funciones, tabla) {
        const errores = [];

        for (let i = 0; i < funciones.length; i++) {
            const f = funciones[i];

            // Verificar redeclaracion
            if (tabla.existeLocal(f.nombre)) {
                errores.push(new ErrorYFERA(
                    'Semantico',
                    f.nombre,
                    f.linea,
                    f.columna,
                    'Ya existe una declaracion con el nombre "' + f.nombre + '"'
                ));
                continue;
            }

            // Validar parametros (no duplicados entre si)
            const erroresParams = this._validarParametros(f);
            errores.push.apply(errores, erroresParams);

            // Validar cuerpo (load con literal debe terminar en .y)
            const erroresCuerpo = this._validarCuerpo(f);
            errores.push.apply(errores, erroresCuerpo);

            // Registrar en la tabla global
            tabla.insertar(f.nombre, {
                categoria: 'funcion',
                parametros: f.parametros.map(function (p) {
                    return {
                        nombre: p.nombre,
                        tipoDato: p.tipoDato,
                        esArreglo: p.esArreglo
                    };
                }),
                linea: f.linea,
                columna: f.columna
            });
        }

        return errores;
    }

    _validarParametros(funcion) {
        const errores = [];
        const vistos = new Set();

        for (let i = 0; i < funcion.parametros.length; i++) {
            const p = funcion.parametros[i];
            if (vistos.has(p.nombre)) {
                errores.push(new ErrorYFERA(
                    'Semantico',
                    p.nombre,
                    p.linea,
                    p.columna,
                    'El parametro "' + p.nombre + '" esta duplicado en la funcion "' + funcion.nombre + '"'
                ));
            } else {
                vistos.add(p.nombre);
            }
        }

        return errores;
    }

    _validarCuerpo(funcion) {
        const errores = [];

        for (let i = 0; i < funcion.cuerpo.length; i++) {
            const sentencia = funcion.cuerpo[i];

            // load con literal debe terminar en .y
            if (sentencia.tipo === 'load' && sentencia.clase === 'literal') {
                if (!sentencia.valor.endsWith('.y')) {
                    errores.push(new ErrorYFERA(
                        'Semantico',
                        'load',
                        sentencia.linea,
                        sentencia.columna,
                        'El argumento de "load" debe ser un archivo con extension .y, se recibio: "' + sentencia.valor + '"'
                    ));
                }
            }
        }

        return errores;
    }
}

module.exports = ValidadorFunciones;