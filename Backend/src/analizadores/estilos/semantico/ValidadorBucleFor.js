const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorBucleFor {
    constructor(tabla, errores, validadorHerencia, validadorPropiedades) {
        this.tabla = tabla;
        this.errores = errores;
        this.validadorHerencia = validadorHerencia;
        this.validadorPropiedades = validadorPropiedades;
    }

    validar(bucle) {
        if (!bucle) return;

        // Validar rango invertido
        if (bucle.desde > bucle.hasta) {
            var operador = bucle.inclusivo === false ? 'to' : 'through';
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    bucle.desde + ' ' + operador + ' ' + bucle.hasta,
                    bucle.linea,
                    bucle.columna,
                    'El rango del @for esta invertido. desde (' + bucle.desde + ') es mayor que hasta (' + bucle.hasta + ').'
                )
            );
        }

        var scopeFor = this.tabla.crearScopeHijo('for_' + bucle.variable);
        scopeFor.insertar(bucle.variable, {
            tipo: 'variable_for',
            nombre: bucle.variable,
            desde: bucle.desde,
            hasta: bucle.hasta,
            linea: bucle.linea
        });

        if (Array.isArray(bucle.cuerpo)) {

            var validadorHerenciaScope = new (this.validadorHerencia.constructor)(scopeFor, this.errores);
            var validadorPropiedadesScope = new (this.validadorPropiedades.constructor)(scopeFor, this.errores);

            for (var i = 0; i < bucle.cuerpo.length; i++) {
                var estilo = bucle.cuerpo[i];
                if (estilo && estilo.tipo === 'estilo') {
                    validadorHerenciaScope.validar(estilo);
                    validadorPropiedadesScope.validar(estilo);
                }
            }
        }
    }
}

module.exports = ValidadorBucleFor;