const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorBloques {
    constructor() {
        this.errores = [];
        this.profundidadCiclo = 0;
        this.profundidadSwitch = 0;
    }

    validarCuerpo(cuerpo, tabla, validadorMain) {
        for (let i = 0; i < cuerpo.length; i++) {
            this._validarSentencia(cuerpo[i], tabla, validadorMain);
        }
        return this.errores;
    }

    _validarSentencia(s, tabla, validadorMain) {
        if (!s) return;

        switch (s.tipo) {
            case 'invocacion_componente':
                validadorMain._validarInvocacion(s, tabla, this.errores);
                break;
            case 'asignacion':
                validadorMain._validarAsignacion(s, tabla, this.errores);
                break;
            case 'if':
                this._validarIf(s, tabla, validadorMain);
                break;
            case 'switch':
                this._validarSwitch(s, tabla, validadorMain);
                break;
            case 'while':
                this._validarWhile(s, tabla, validadorMain);
                break;
            case 'do_while':
                this._validarDoWhile(s, tabla, validadorMain);
                break;
            case 'for':
                this._validarFor(s, tabla, validadorMain);
                break;
            case 'break':
                this._validarBreak(s);
                break;
            case 'continue':
                this._validarContinue(s);
                break;
            case 'incremento':
            case 'decremento':
                break;
        }
    }

    _validarIf(nodo, tabla, validadorMain) {
        validadorMain._validarExpresion(nodo.condicion, tabla, this.errores);

        const tipoCond = this._inferirTipo(nodo.condicion, tabla);
        if (tipoCond !== null && tipoCond !== 'boolean') {
            this.errores.push(new ErrorYFERA(
                'Semantico',
                'if',
                nodo.linea,
                nodo.columna,
                'La condicion del "if" debe ser de tipo boolean, se recibio: ' + tipoCond
            ));
        }

        for (let i = 0; i < nodo.cuerpo.length; i++) {
            this._validarSentencia(nodo.cuerpo[i], tabla, validadorMain);
        }

        let yaHuboElseFinal = false;
        for (let i = 0; i < nodo.ramas_else.length; i++) {
            const r = nodo.ramas_else[i];

            if (yaHuboElseFinal) {
                this.errores.push(new ErrorYFERA(
                    'Semantico',
                    r.tipo,
                    r.linea,
                    r.columna,
                    'No se puede tener "' + r.tipo + '" despues de un "else" final'
                ));
                continue;
            }

            if (r.tipo === 'else_if') {
                validadorMain._validarExpresion(r.condicion, tabla, this.errores);
                const t = this._inferirTipo(r.condicion, tabla);
                if (t !== null && t !== 'boolean') {
                    this.errores.push(new ErrorYFERA(
                        'Semantico',
                        'else if',
                        r.linea,
                        r.columna,
                        'La condicion del "else if" debe ser de tipo boolean, se recibio: ' + t
                    ));
                }
                for (let j = 0; j < r.cuerpo.length; j++) {
                    this._validarSentencia(r.cuerpo[j], tabla, validadorMain);
                }
            } else if (r.tipo === 'else') {
                yaHuboElseFinal = true;
                for (let j = 0; j < r.cuerpo.length; j++) {
                    this._validarSentencia(r.cuerpo[j], tabla, validadorMain);
                }
            }
        }
    }

    _validarSwitch(nodo, tabla, validadorMain) {
        validadorMain._validarExpresion(nodo.expresion, tabla, this.errores);

        const tipoExpr = this._inferirTipo(nodo.expresion, tabla);
        if (tipoExpr !== null && tipoExpr !== 'int' && tipoExpr !== 'float' && tipoExpr !== 'string') {
            this.errores.push(new ErrorYFERA(
                'Semantico',
                'switch',
                nodo.linea,
                nodo.columna,
                'La expresion del "switch" debe ser numerica o string, se recibio: ' + tipoExpr
            ));
        }

        const valoresVistos = new Set();

        this.profundidadSwitch++;

        for (let i = 0; i < nodo.casos.length; i++) {
            const c = nodo.casos[i];
            const tipoCaso = this._tipoValorCaso(c.valor);

            if (tipoExpr !== null && tipoCaso !== null && !this._tiposCompatiblesSwitch(tipoExpr, tipoCaso)) {
                this.errores.push(new ErrorYFERA(
                    'Semantico',
                    'case',
                    c.linea,
                    c.columna,
                    'El valor del case es de tipo "' + tipoCaso + '" pero el switch es de tipo "' + tipoExpr + '"'
                ));
            }

            const claveValor = tipoCaso + ':' + c.valor.valor;
            if (valoresVistos.has(claveValor)) {
                this.errores.push(new ErrorYFERA(
                    'Semantico',
                    'case',
                    c.linea,
                    c.columna,
                    'El valor "' + c.valor.valor + '" ya aparece en otro case del mismo switch'
                ));
            } else {
                valoresVistos.add(claveValor);
            }

            for (let j = 0; j < c.cuerpo.length; j++) {
                this._validarSentencia(c.cuerpo[j], tabla, validadorMain);
            }
        }

        if (nodo.defecto) {
            for (let j = 0; j < nodo.defecto.cuerpo.length; j++) {
                this._validarSentencia(nodo.defecto.cuerpo[j], tabla, validadorMain);
            }
        }

        this.profundidadSwitch--;
    }

    _validarWhile(nodo, tabla, validadorMain) {
        validadorMain._validarExpresion(nodo.condicion, tabla, this.errores);

        const tipoCond = this._inferirTipo(nodo.condicion, tabla);
        if (tipoCond !== null && tipoCond !== 'boolean') {
            this.errores.push(new ErrorYFERA(
                'Semantico',
                'while',
                nodo.linea,
                nodo.columna,
                'La condicion del "while" debe ser de tipo boolean, se recibio: ' + tipoCond
            ));
        }

        this.profundidadCiclo++;
        for (let i = 0; i < nodo.cuerpo.length; i++) {
            this._validarSentencia(nodo.cuerpo[i], tabla, validadorMain);
        }
        this.profundidadCiclo--;
    }

    _validarDoWhile(nodo, tabla, validadorMain) {
        this.profundidadCiclo++;
        for (let i = 0; i < nodo.cuerpo.length; i++) {
            this._validarSentencia(nodo.cuerpo[i], tabla, validadorMain);
        }
        this.profundidadCiclo--;

        validadorMain._validarExpresion(nodo.condicion, tabla, this.errores);
        const tipoCond = this._inferirTipo(nodo.condicion, tabla);
        if (tipoCond !== null && tipoCond !== 'boolean') {
            this.errores.push(new ErrorYFERA(
                'Semantico',
                'do-while',
                nodo.linea,
                nodo.columna,
                'La condicion del "do-while" debe ser de tipo boolean, se recibio: ' + tipoCond
            ));
        }
    }

    _validarFor(nodo, tabla, validadorMain) {
        // Validar inicializacion (asignacion)
        validadorMain._validarAsignacion(nodo.inicializacion, tabla, this.errores);

        // Validar condicion (debe ser booleana)
        validadorMain._validarExpresion(nodo.condicion, tabla, this.errores);
        const tipoCond = this._inferirTipo(nodo.condicion, tabla);
        if (tipoCond !== null && tipoCond !== 'boolean') {
            this.errores.push(new ErrorYFERA(
                'Semantico',
                'for',
                nodo.linea,
                nodo.columna,
                'La condicion del "for" debe ser de tipo boolean, se recibio: ' + tipoCond
            ));
        }

        // Validar actualizacion
        const upd = nodo.actualizacion;
        if (upd.tipo === 'asignacion') {
            validadorMain._validarAsignacion(upd, tabla, this.errores);
        } else if (upd.tipo === 'incremento' || upd.tipo === 'decremento') {
            const sim = tabla.buscar(upd.nombre);
            if (!sim) {
                this.errores.push(new ErrorYFERA(
                    'Semantico',
                    upd.nombre,
                    upd.linea,
                    upd.columna,
                    'La variable "' + upd.nombre + '" no esta declarada'
                ));
            } else if (sim.categoria !== 'variable') {
                this.errores.push(new ErrorYFERA(
                    'Semantico',
                    upd.nombre,
                    upd.linea,
                    upd.columna,
                    '"' + upd.nombre + '" no es una variable'
                ));
            } else if (sim.tipoDato !== 'int' && sim.tipoDato !== 'float') {
                this.errores.push(new ErrorYFERA(
                    'Semantico',
                    upd.nombre,
                    upd.linea,
                    upd.columna,
                    'El operador "' + (upd.tipo === 'incremento' ? '++' : '--') +
                    '" solo aplica a variables numericas, "' + upd.nombre + '" es ' + sim.tipoDato
                ));
            }
        }

        this.profundidadCiclo++;
        for (let i = 0; i < nodo.cuerpo.length; i++) {
            this._validarSentencia(nodo.cuerpo[i], tabla, validadorMain);
        }
        this.profundidadCiclo--;
    }

    _validarBreak(nodo) {
        if (this.profundidadCiclo === 0 && this.profundidadSwitch === 0) {
            this.errores.push(new ErrorYFERA(
                'Semantico',
                'break',
                nodo.linea,
                nodo.columna,
                '"break" solo puede aparecer dentro de un ciclo o switch'
            ));
        }
    }

    _validarContinue(nodo) {
        if (this.profundidadCiclo === 0) {
            this.errores.push(new ErrorYFERA(
                'Semantico',
                'continue',
                nodo.linea,
                nodo.columna,
                '"continue" solo puede aparecer dentro de un ciclo'
            ));
        }
    }

    _inferirTipo(expr, tabla) {
        if (!expr || !expr.tipo) return null;

        switch (expr.tipo) {
            case 'numero_entero': return 'int';
            case 'numero_decimal': return 'float';
            case 'cadena': return 'string';
            case 'caracter': return 'char';
            case 'booleano': return 'boolean';
            case 'identificador': {
                const sim = tabla.buscar(expr.nombre);
                return sim && sim.categoria === 'variable' ? sim.tipoDato : null;
            }
            case 'acceso_array': {
                const sim = tabla.buscar(expr.nombre);
                return sim && sim.categoria === 'variable' && sim.esArreglo ? sim.tipoDato : null;
            }
            case 'and':
            case 'or':
            case 'negacion':
            case 'mayor':
            case 'mayor_igual':
            case 'menor':
            case 'menor_igual':
            case 'igual_igual':
            case 'diferente':
                return 'boolean';
            case 'suma':
            case 'resta':
            case 'multiplicacion':
            case 'division':
            case 'modulo': {
                const ti = this._inferirTipo(expr.izq, tabla);
                const td = this._inferirTipo(expr.der, tabla);
                if (ti === 'float' || td === 'float') return 'float';
                if (ti === 'int' && td === 'int') return 'int';
                if (ti === 'string' || td === 'string') return 'string';
                return null;
            }
            case 'menos_unario': {
                return this._inferirTipo(expr.operando, tabla);
            }
            default:
                return null;
        }
    }

    _tipoValorCaso(valor) {
        switch (valor.tipo) {
            case 'numero_entero': return 'int';
            case 'numero_decimal': return 'float';
            case 'cadena': return 'string';
            default: return null;
        }
    }

    _tiposCompatiblesSwitch(tipoSwitch, tipoCaso) {
        if (tipoSwitch === tipoCaso) return true;
        if ((tipoSwitch === 'int' || tipoSwitch === 'float') &&
            (tipoCaso === 'int' || tipoCaso === 'float')) return true;
        return false;
    }
}

module.exports = ValidadorBloques;