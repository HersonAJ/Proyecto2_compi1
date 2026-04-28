const EvaluadorExpresiones = require('./EvaluadorExpresiones');

class ExpansorBucleFor {
    expandir(bucle) {
        // Genera una lista plana de estilos a partir de un nodo @for
        var estilosExpandidos = [];

        if (!bucle || !Array.isArray(bucle.cuerpo)) {
            return estilosExpandidos;
        }

        for (var i = bucle.desde; i <= bucle.hasta; i++) {
            var contextoVariables = {};
            contextoVariables[bucle.variable] = i;

            for (var j = 0; j < bucle.cuerpo.length; j++) {
                var estiloPlantilla = bucle.cuerpo[j];
                if (!estiloPlantilla) continue;

                var estiloExpandido = this._expandirEstilo(estiloPlantilla, bucle.variable, i, contextoVariables);
                estilosExpandidos.push(estiloExpandido);
            }
        }

        return estilosExpandidos;
    }

    _expandirEstilo(plantilla, varNombre, varValor, contexto) {
        // Reemplazar el nombre del estilo: my-font-$i -> my-font-3
        var nombreExpandido = plantilla.nombre.split(varNombre).join(String(varValor));

        // Expandir cada propiedad
        var propiedadesExpandidas = (plantilla.propiedades || []).map(function(prop) {
            return this._expandirPropiedad(prop, contexto);
        }.bind(this));

        return {
            tipo: 'estilo',
            nombre: nombreExpandido,
            extiende: plantilla.extiende || null,
            propiedades: propiedadesExpandidas,
            linea: plantilla.linea,
            columna: plantilla.columna
        };
    }

    _expandirPropiedad(propiedad, contexto) {
        var evaluador = new EvaluadorExpresiones(contexto);
        var valoresEvaluados = (propiedad.valores || []).map(function(valor) {
            return this._evaluarValor(valor, evaluador);
        }.bind(this));

        return {
            nombre: propiedad.nombre,
            valores: valoresEvaluados,
            linea: propiedad.linea,
            columna: propiedad.columna
        };
    }

    _evaluarValor(valor, evaluador) {
        // Si es una expresion (binaria, variable o entero/decimal con tipo 'binaria')
        if (valor.tipo === 'binaria' || valor.tipo === 'variable') {
            try {
                var resultado = evaluador.evaluar(valor);
                return {
                    tipo: Number.isInteger(resultado) ? 'entero' : 'decimal',
                    valor: resultado,
                    linea: valor.linea,
                    columna: valor.columna
                };
            } catch (e) {
                return valor; // Si falla, dejarlo tal cual
            }
        }
        // Si es entero/decimal pero podria ser una expresion suelta
        if (valor.tipo === 'entero' || valor.tipo === 'decimal') {
            return valor;
        }
        return valor;
    }
}

module.exports = ExpansorBucleFor;