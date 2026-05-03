const ErrorYFERA = require('../../errores/ErrorYFERA');
const InferenciaTipos = require('./InferenciaTipos');

class ValidadorCondicion {
    constructor(tabla, errores) {
        this.tabla = tabla;
        this.errores = errores;
    }

    validarIf(nodoIf, scope) {
        this._validarCondicionBooleana(nodoIf.condicion, scope, 'if');

        if (Array.isArray(nodoIf.ramas_else)) {
            for (var i = 0; i < nodoIf.ramas_else.length; i++) {
                var rama = nodoIf.ramas_else[i];
                if (rama.tipo === 'else_if') {
                    this._validarCondicionBooleana(rama.condicion, scope, 'else if');
                }
            }
        }
    }

    validarSwitch(nodoSwitch, scope) {
        // Tipo de la expresion del switch debe ser int o string
        var tipoExpr = InferenciaTipos.inferir(nodoSwitch.expresion, scope);

        if (tipoExpr === 'desconocido') {
            this._validarCasos(nodoSwitch.casos, null);
            return;
        }

        if (tipoExpr !== 'int' && tipoExpr !== 'string') {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    '',
                    nodoSwitch.linea,
                    nodoSwitch.columna,
                    'La expresion del Switch debe ser de tipo int o string. Se obtuvo: ' + tipoExpr + '.'
                )
            );
        }

        this._validarCasos(nodoSwitch.casos, tipoExpr);
    }

    _validarCondicionBooleana(condicion, scope, nombreBloque) {
        var tipo = InferenciaTipos.inferir(condicion, scope);

        if (tipo === 'desconocido') return;

        if (tipo !== 'boolean') {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    '',
                    condicion.linea || 0,
                    condicion.columna || 0,
                    'La condicion del ' + nombreBloque + ' debe ser de tipo boolean. Se obtuvo: ' + tipo + '.'
                )
            );
        }
    }

    _validarCasos(casos, tipoEsperado) {
        if (!Array.isArray(casos)) return;

        for (var i = 0; i < casos.length; i++) {
            var caso = casos[i];
            if (!caso || !caso.valor) continue;
            if (tipoEsperado === null) continue;

            var tipoCaso = caso.valor.tipo;  // 'cadena' o 'numero'
            var tipoCasoNormalizado;
            if (tipoCaso === 'cadena') tipoCasoNormalizado = 'string';
            else if (tipoCaso === 'numero') {
                tipoCasoNormalizado = Number.isInteger(caso.valor.valor) ? 'int' : 'float';
            }

            if (tipoCasoNormalizado !== tipoEsperado) {
                this.errores.push(
                    new ErrorYFERA(
                        'Semantico',
                        String(caso.valor.valor),
                        caso.linea,
                        caso.columna,
                        'El valor del case es de tipo ' + tipoCasoNormalizado + ' pero el Switch espera ' + tipoEsperado + '.'
                    )
                );
            }
        }
    }
}

module.exports = ValidadorCondicion;