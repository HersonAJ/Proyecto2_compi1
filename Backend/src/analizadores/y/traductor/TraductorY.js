class TraductorY {
    constructor(contexto, opciones) {
        this.contexto = contexto;
        this.opciones = opciones || {};
        this.errores = [];
        this.variables = new Map();
    }

    traducir(ast) {
        if (!Array.isArray(ast) || ast.length === 0) {
            return { html: '', errores: [] };
        }
        const decls = ast.filter(d => d && d.tipo === 'variable').map(d => ({
            nombre: d.nombre,
            esArreglo: d.esArreglo,
            tipoInit: d.inicializador?.tipo
        }));

        this._recolectarVariables(ast);
        for (const [k, v] of this.variables) {
        }
        const css = this._construirCSS(ast);
        const body = this._construirBody(ast);
        const html = this._envolverHTML(css, body);
        return { html: html, errores: this.errores };
    }

    _recolectarVariables(ast) {
        for (let i = 0; i < ast.length; i++) {
            const decl = ast[i];
            if (!decl || decl.tipo !== 'variable') continue;

            if (decl.esArreglo) {
                const init = decl.inicializador;
                if (init.tipo === 'arreglo_valores') {
                    const valores = init.valores.map((v) => this._evaluarExpresion(v, this.variables));
                    this.variables.set(decl.nombre, {
                        tipo: decl.tipoDato,
                        esArreglo: true,
                        valor: valores,
                        evaluable: valores.every((v) => v !== null)
                    });
                } else if (init.tipo === 'arreglo_execute') {
                    const valores = this._ejecutarSQLGlobal(init.sql, init.linea, init.columna);
                    this.variables.set(decl.nombre, {
                        tipo: decl.tipoDato,
                        esArreglo: true,
                        valor: valores,
                        evaluable: valores !== null
                    });
                } else if (init.tipo === 'arreglo_tamano') {
                    const valorPorDefecto = this._valorPorDefecto(decl.tipoDato);
                    const valores = new Array(init.tamano).fill(valorPorDefecto);
                    this.variables.set(decl.nombre, {
                        tipo: decl.tipoDato,
                        esArreglo: true,
                        valor: valores,
                        evaluable: true
                    });
                }
            } else {
                const valor = this._evaluarExpresion(decl.inicializador, this.variables);
                this.variables.set(decl.nombre, {
                    tipo: decl.tipoDato,
                    esArreglo: false,
                    valor: valor,
                    evaluable: valor !== null
                });
            }
        }
    }

    _valorPorDefecto(tipo) {
        switch (tipo) {
            case 'int':
            case 'float':   return 0;
            case 'string':  return '';
            case 'char':    return '';
            case 'boolean': return false;
            default:        return null;
        }
    }

    _ejecutarSQLGlobal(sql, linea, columna) {
        if (!this.opciones.proyecto || !this.opciones.rutaBaseProyectos) {
            this.errores.push({
                tipo: 'Semantico',
                lexema: 'execute',
                linea: linea,
                columna: columna,
                mensaje: 'No se puede ejecutar SQL sin contexto de proyecto'
            });
            return null;
        }

        let codigoSQL = sql.trim();
        if (!codigoSQL.endsWith(';')) codigoSQL += ';';

        const GeneradorSQL = require('../../sql/GeneradorSQL');
        const generador = new GeneradorSQL();
        const resultado = generador.analizar(codigoSQL, {
            ejecutar: true,
            proyecto: this.opciones.proyecto,
            rutaBaseProyectos: this.opciones.rutaBaseProyectos
        });

        if (!resultado.exito) {
            for (let i = 0; i < resultado.errores.length; i++) {
                const e = resultado.errores[i];
                this.errores.push({
                    tipo: 'Semantico',
                    lexema: 'execute',
                    linea: linea,
                    columna: columna,
                    mensaje: 'Error en execute: ' + e.mensaje
                });
            }
            return null;
        }

        if (resultado.resultados.length === 0) {
            return [];
        }

        const r = resultado.resultados[0];
        if (r.tipo !== 'select') {
            this.errores.push({
                tipo: 'Semantico',
                lexema: 'execute',
                linea: linea,
                columna: columna,
                mensaje: 'Solo se permite SELECT (tabla.columna) para inicializar arreglos con execute'
            });
            return null;
        }

        return r.valores || [];
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
            case 'acceso_array': {
                const v = variables.get(expr.nombre);
                if (!v || !v.evaluable || !Array.isArray(v.valor)) return null;
                const indice = this._evaluarExpresion(expr.indice, variables);
                if (indice === null || typeof indice !== 'number') return null;
                if (indice < 0 || indice >= v.valor.length) return null;
                return v.valor[indice];
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
            '    ' + this._generarRuntimeScript(),
            '</body>',
            '</html>'
        ];
        return partes.join('\n');
    }

    _generarRuntimeScript() {
        const proyecto = this.opciones.proyecto || '';
        const rutaArchivo = this.opciones.rutaArchivo || '';

        return `<script>
    (function () {
        const PROYECTO = ${JSON.stringify(proyecto)};
        const RUTA_ARCHIVO = ${JSON.stringify(rutaArchivo)};
        const ENDPOINT = 'http://localhost:3000/api/y/invocar-funcion';

        function recolectarValor(form, idLogico) {
            const input = form.querySelector('[data-yfera-id="' + idLogico + '"]');
            if (!input) return null;
            if (input.type === 'checkbox') return input.checked;
            return input.value;
        }

        function enganchar(form) {
            const meta = form.querySelector('script[data-yfera-form-meta]');
            if (!meta) return;
            let info;
            try {
                info = JSON.parse(meta.textContent);
            } catch (e) {
                console.error('YFERA: metadata invalida en form', e);
                return;
            }

            form.addEventListener('submit', async function (ev) {
                ev.preventDefault();
                const argumentos = info.argumentos.map(function (a) {
                    if (a.tipo === 'input') return recolectarValor(form, a.id);
                    if (a.tipo === 'literal') return a.valor;
                    return null;
                });

                try {
                    const resp = await fetch(ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            proyecto: PROYECTO,
                            rutaArchivo: RUTA_ARCHIVO,
                            nombreFuncion: info.funcion,
                            argumentos: argumentos
                        })
                    });
                    const data = await resp.json();

                    if (!data.exito && data.errores && data.errores.length > 0) {
                        const msg = data.errores.map(function (e) { return e.mensaje; }).join('\\n');
                        alert('Error: ' + msg);
                        return;
                    }

                    if (data.recargar) {
                        // Si estamos dentro de un iframe, avisar al padre para que reanalice
                        if (window.parent && window.parent !== window) {
                            window.parent.postMessage({ tipo: 'yfera-recargar' }, '*');
                        } else {
                            window.location.reload();
                        }
                    } else if (data.mensajes && data.mensajes.length > 0) {
                        alert('OK:\\n' + data.mensajes.join('\\n'));
                    }
                } catch (e) {
                    alert('Error de red: ' + e.message);
                }
            });
        }

        document.querySelectorAll('form[data-yfera-form]').forEach(enganchar);
    })();
    </script>`;
    }
}

module.exports = TraductorY;