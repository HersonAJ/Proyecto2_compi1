class TraductorY {
    constructor(contexto) {
        this.contexto = contexto;
        this.errores = [];
        // Tabla de variables con su valor literal evaluado (
        this.variables = new Map();
    }

    traducir(ast) {
        if (!Array.isArray(ast) || ast.length === 0) {
            return { html: '', errores: [] };
        }

        // 1. Recolectar variables globales con valores evaluables
        this._recolectarVariables(ast);

        // 2. Construir CSS desde .styles importados
        const css = this._construirCSS(ast);

        // 3. Construir body desde main
        const body = this._construirBody(ast);

        // 4. Envolver en HTML
        const html = this._envolverHTML(css, body);

        return { html: html, errores: this.errores };
    }

    _recolectarVariables(ast) {
        for (let i = 0; i < ast.length; i++) {
            const decl = ast[i];
            if (!decl || decl.tipo !== 'variable' || decl.esArreglo) continue;

            const valor = this._evaluarExpresion(decl.inicializador, this.variables);
            this.variables.set(decl.nombre, {
                tipo: decl.tipoDato,
                valor: valor,
                evaluable: valor !== null
            });
        }
    }

    _construirCSS(ast) {
        let css = '';
        for (let i = 0; i < ast.length; i++) {
            const decl = ast[i];
            if (decl && decl.tipo === 'import' && decl.ruta.endsWith('.styles')) {
                const cssArchivo = this.contexto.obtenerCssDeImport(decl.ruta);
                if (cssArchivo) {
                    css += '/* ' + decl.ruta + ' */\n' + cssArchivo + '\n\n';
                }
            }
        }
        return css;
    }

    _construirBody(ast) {
        const main = ast.find(function (d) { return d && d.tipo === 'main'; });
        if (!main) return '';
        return this._traducirCuerpo(main.cuerpo, this.variables);
    }

    _traducirCuerpo(cuerpo, variables) {
        let html = '';
        for (let i = 0; i < cuerpo.length; i++) {
            const s = cuerpo[i];
            if (!s) continue;

            switch (s.tipo) {
                case 'invocacion_componente':
                    html += this._traducirInvocacion(s, variables);
                    break;
                case 'asignacion':
                    this._actualizarVariable(s, variables);
                    break;
                case 'if':
                    html += this._traducirIf(s, variables);
                    break;
                case 'while':
                case 'do_while':
                case 'for':
                    html += this._traducirCiclo(s, variables);
                    break;
                case 'switch':
                    html += this._traducirSwitch(s, variables);
                    break;
            }
        }
        return html;
    }

    _traducirInvocacion(inv, variables) {
        const info = this.contexto.buscarComponente(inv.nombre);
        if (!info) {
            return '<!-- componente no encontrado: ' + inv.nombre + ' -->\n';
        }

        let template = this.contexto.obtenerTemplateComponente(inv.nombre);
        if (!template) {
            return '<!-- componente "' + inv.nombre + '" no tiene template generado -->\n';
        }

        // Substituir cada parametro con su argumento correspondiente
        const params = info.parametros;
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            const arg = inv.argumentos[i];
            const valor = this._evaluarExpresion(arg, variables);
            const placeholder = '{{$' + param.nombre + '}}';
            const reemplazo = valor !== null ? this._escaparHtml(String(valor)) : placeholder;
            template = template.split(placeholder).join(reemplazo);
        }

        return template + '\n';
    }

    _actualizarVariable(asig, variables) {
        if (asig.indice !== null) return; // Asignaciones a arreglos no se traducen
        const valor = this._evaluarExpresion(asig.expresion, variables);
        const v = variables.get(asig.nombre);
        if (v) {
            variables.set(asig.nombre, {
                tipo: v.tipo,
                valor: valor,
                evaluable: valor !== null
            });
        }
    }

    _traducirIf(nodo, variables) {
        const cond = this._evaluarExpresion(nodo.condicion, variables);

        if (cond === true) {
            return this._traducirCuerpo(nodo.cuerpo, variables);
        }
        if (cond === false) {
            // Buscar rama else_if o else que aplique
            for (let i = 0; i < nodo.ramas_else.length; i++) {
                const r = nodo.ramas_else[i];
                if (r.tipo === 'else_if') {
                    const c = this._evaluarExpresion(r.condicion, variables);
                    if (c === true) {
                        return this._traducirCuerpo(r.cuerpo, variables);
                    }
                } else if (r.tipo === 'else') {
                    return this._traducirCuerpo(r.cuerpo, variables);
                }
            }
            return '';
        }

        let resultado = '<!-- if con condicion no evaluable estaticamente, mostrando todas las ramas -->\n';
        resultado += this._traducirCuerpo(nodo.cuerpo, variables);
        for (let i = 0; i < nodo.ramas_else.length; i++) {
            const r = nodo.ramas_else[i];
            resultado += this._traducirCuerpo(r.cuerpo, variables);
        }
        return resultado;
    }

    _traducirCiclo(nodo, variables) {
        let resultado = '<!-- ciclo ' + nodo.tipo + ' (renderizado estaticamente, una iteracion) -->\n';
        resultado += this._traducirCuerpo(nodo.cuerpo, variables);
        return resultado;
    }

    _traducirSwitch(nodo, variables) {
        const valor = this._evaluarExpresion(nodo.expresion, variables);

        if (valor !== null) {
            // Buscar el caso que coincide
            for (let i = 0; i < nodo.casos.length; i++) {
                const caso = nodo.casos[i];
                if (caso.valor.valor === valor) {
                    return this._traducirCuerpo(caso.cuerpo, variables);
                }
            }
            if (nodo.defecto) {
                return this._traducirCuerpo(nodo.defecto.cuerpo, variables);
            }
            return '';
        }

        let resultado = '<!-- switch con expresion no evaluable estaticamente, mostrando todos los casos -->\n';
        for (let i = 0; i < nodo.casos.length; i++) {
            resultado += this._traducirCuerpo(nodo.casos[i].cuerpo, variables);
        }
        if (nodo.defecto) {
            resultado += this._traducirCuerpo(nodo.defecto.cuerpo, variables);
        }
        return resultado;
    }

    _evaluarExpresion(expr, variables) {
        if (!expr) return null;

        switch (expr.tipo) {
            case 'numero_entero':
            case 'numero_decimal':
            case 'cadena':
            case 'caracter':
            case 'booleano':
                return expr.valor;

            case 'identificador': {
                const v = variables.get(expr.nombre);
                return v && v.evaluable ? v.valor : null;
            }

            case 'suma': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                if (i === null || d === null) return null;
                if (typeof i === 'string' || typeof d === 'string') return String(i) + String(d);
                return i + d;
            }
            case 'resta': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                return (i !== null && d !== null) ? i - d : null;
            }
            case 'multiplicacion': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                return (i !== null && d !== null) ? i * d : null;
            }
            case 'division': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                if (i === null || d === null || d === 0) return null;
                return i / d;
            }
            case 'modulo': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                if (i === null || d === null || d === 0) return null;
                return i % d;
            }
            case 'menos_unario': {
                const o = this._evaluarExpresion(expr.operando, variables);
                return o !== null ? -o : null;
            }

            case 'and': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                return (i !== null && d !== null) ? Boolean(i && d) : null;
            }
            case 'or': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                return (i !== null && d !== null) ? Boolean(i || d) : null;
            }
            case 'negacion': {
                const o = this._evaluarExpresion(expr.operando, variables);
                return o !== null ? !o : null;
            }
            case 'mayor': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                return (i !== null && d !== null) ? i > d : null;
            }
            case 'mayor_igual': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                return (i !== null && d !== null) ? i >= d : null;
            }
            case 'menor': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                return (i !== null && d !== null) ? i < d : null;
            }
            case 'menor_igual': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                return (i !== null && d !== null) ? i <= d : null;
            }
            case 'igual_igual': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                return (i !== null && d !== null) ? i === d : null;
            }
            case 'diferente': {
                const i = this._evaluarExpresion(expr.izq, variables);
                const d = this._evaluarExpresion(expr.der, variables);
                return (i !== null && d !== null) ? i !== d : null;
            }
            default:
                return null;
        }
    }

    _escaparHtml(texto) {
        return String(texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    _envolverHTML(css, body) {
        const partes = [
            '<!DOCTYPE html>',
            '<html lang="es">',
            '<head>',
            '    <meta charset="UTF-8">',
            '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '    <title></title>',
            '    <style>',
            css.split('\n').map(function (l) { return '        ' + l; }).join('\n'),
            '    </style>',
            '</head>',
            '<body>',
            body.split('\n').map(function (l) { return '    ' + l; }).join('\n'),
            '</body>',
            '</html>'
        ];
        return partes.join('\n');
    }
}

module.exports = TraductorY;