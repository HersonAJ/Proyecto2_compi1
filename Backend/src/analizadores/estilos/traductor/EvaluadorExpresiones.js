class EvaluadorExpresiones {
    constructor(variables) {
        // variables es un objeto: { '$i': 3, '$j': 5 }
        this.variables = variables || {};
    }

    evaluar(nodo) {
        if (!nodo) return null;

        switch (nodo.tipo) {
            case 'entero':
                return nodo.valor;

            case 'decimal':
                return nodo.valor;

            case 'variable':
                if (this.variables.hasOwnProperty(nodo.valor)) {
                    return this.variables[nodo.valor];
                }
                throw new Error('Variable no definida: ' + nodo.valor);

            case 'binaria':
                var izq = this.evaluar(nodo.izq);
                var der = this.evaluar(nodo.der);
                return this._aplicarOperador(nodo.op, izq, der);

            default:
                throw new Error('Tipo de expresion no soportado: ' + nodo.tipo);
        }
    }

    _aplicarOperador(op, izq, der) {
        switch (op) {
            case '+': return izq + der;
            case '-': return izq - der;
            case '*': return izq * der;
            case '/': return izq / der;
            default:
                throw new Error('Operador desconocido: ' + op);
        }
    }
}

module.exports = EvaluadorExpresiones;