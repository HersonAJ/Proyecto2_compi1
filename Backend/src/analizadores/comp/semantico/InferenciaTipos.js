class InferenciaTipos {
    /**
     Devuelve el tipo de una expresion.
     ipos posibles: int, float, string, boolean, char, function, desconocido.
     */
    static inferir(expr, scope) {
        if (!expr) return 'desconocido';

        switch (expr.tipo) {
            case 'numero':
                // Si tiene parte decimal, es float; si no, int
                return Number.isInteger(expr.valor) ? 'int' : 'float';

            case 'cadena':
                return 'string';

            case 'booleano':
                return 'boolean';

            case 'variable':
                return InferenciaTipos._tipoDeVariable(expr.nombre, scope);

            case 'acceso_array':
                // El elemento del array tiene el mismo tipo declarado de la variable
                return InferenciaTipos._tipoDeVariable(expr.nombre, scope);

            // Comparaciones
            case 'mayor':
            case 'mayor_igual':
            case 'menor':
            case 'menor_igual':
            case 'igual_igual':
            case 'diferente':
                return 'boolean';

            // Logicos
            case 'and':
            case 'or':
            case 'negacion':
                return 'boolean';

            // Aritmeticos binarios
            case 'suma':
            case 'resta':
            case 'multiplicacion':
            case 'division':
            case 'modulo':
                var tipoIzq = InferenciaTipos.inferir(expr.izq, scope);
                var tipoDer = InferenciaTipos.inferir(expr.der, scope);
                return InferenciaTipos._combinarNumericos(tipoIzq, tipoDer);

            // Unarios
            case 'menos_unario':
                return InferenciaTipos.inferir(expr.operando, scope);

            default:
                return 'desconocido';
        }
    }

    static _tipoDeVariable(nombre, scope) {
        var info = scope.buscar(nombre);
        if (!info) return 'desconocido';
        if (info.tipoDato) return info.tipoDato;
        return 'desconocido';
    }

    static _combinarNumericos(t1, t2) {
        if (t1 === 'desconocido' || t2 === 'desconocido') return 'desconocido';
        // Si alguno es float, el resultado es float
        if (t1 === 'float' || t2 === 'float') return 'float';
        // Si ambos son int, resultado es int
        if (t1 === 'int' && t2 === 'int') return 'int';
        return 'desconocido';
    }
}

module.exports = InferenciaTipos;