class TraductorComp {
    //Traduce una lista de componentes a HTML
    traducir(componentes) {
        if (!Array.isArray(componentes)) return { html: '', componentes: {} };

        var componentesTraducidos = {};
        var htmlTotal = '';

        for (var i = 0; i < componentes.length; i++) {
            var comp = componentes[i];
            if (!comp || comp.tipo !== 'componente') continue;

            var htmlComp = this._traducirComponente(comp);
            componentesTraducidos[comp.nombre] = htmlComp;
            htmlTotal += htmlComp + '\n';
        }

        return {
            html: htmlTotal,
            componentes: componentesTraducidos
        };
    }

    //COMPONENTE
    _traducirComponente(comp) {
        var inicio = '<div class="yfera-componente" data-componente="' + comp.nombre + '">';
        var fin = '</div>';
        var contenido = this._traducirElementos(comp.elementos);
        return inicio + '\n' + contenido + '\n' + fin;
    }

    //LISTA DE ELEMENTOS
    _traducirElementos(elementos) {
        if (!Array.isArray(elementos)) return '';
        var partes = [];
        for (var i = 0; i < elementos.length; i++) {
            var html = this._traducirElemento(elementos[i]);
            if (html) partes.push(html);
        }
        return partes.join('\n');
    }

    //DESPACHADOR DE ELEMENTOS
    _traducirElemento(nodo) {
        if (!nodo) return '';

        switch (nodo.tipo) {
            case 'seccion':
                return this._traducirSeccion(nodo);
            case 'tabla':
                return this._traducirTabla(nodo, true);  // true = es la raiz
            case 'texto':
                return this._traducirTexto(nodo);
            case 'imagen':
                return this._traducirImagen(nodo);
            case 'formulario':
                return this._traducirFormulario(nodo);
            case 'input':
                return this._traducirInput(nodo);
            case 'if':
                return this._traducirIf(nodo);
            case 'switch':
                return this._traducirSwitch(nodo);
            case 'for_each':
                return this._traducirForEach(nodo);
            case 'for_complejo':
                return this._traducirForComplejo(nodo);
            default:
                return '<!-- elemento desconocido: ' + nodo.tipo + ' -->';
        }
    }

    //SECCION
    _traducirSeccion(nodo) {
        var clases = this._construirClases('yfera-seccion', nodo.estilos);
        var contenido = this._traducirElementos(nodo.elementos);
        return '<div class="' + clases + '">\n' + contenido + '\n</div>';
    }

    //TABLA
    _traducirTabla(nodo, esRaiz) {
        var clases = this._construirClases('yfera-tabla', nodo.estilos);

        if (esRaiz) {
            // La raiz es <table>, sus hijos directos son filas
            var filas = '';
            if (Array.isArray(nodo.elementos)) {
                for (var i = 0; i < nodo.elementos.length; i++) {
                    filas += this._traducirFila(nodo.elementos[i]) + '\n';
                }
            }
            return '<table class="' + clases + '"><tbody>\n' + filas + '</tbody></table>';
        } else {
            return '<!-- tabla anidada inesperada -->';
        }
    }

    _traducirFila(nodo) {
        if (!nodo || nodo.tipo !== 'tabla') {
            return '<tr><td>' + this._traducirElemento(nodo) + '</td></tr>';
        }

        var celdas = '';
        if (Array.isArray(nodo.elementos)) {
            for (var i = 0; i < nodo.elementos.length; i++) {
                celdas += this._traducirCelda(nodo.elementos[i]);
            }
        }
        return '<tr>' + celdas + '</tr>';
    }

    _traducirCelda(nodo) {
        if (!nodo || nodo.tipo !== 'tabla') {
            return '<td>' + this._traducirElemento(nodo) + '</td>';
        }
        var contenido = this._traducirElementos(nodo.elementos);
        return '<td>' + contenido + '</td>';
    }

    //TEXTO
    _traducirTexto(nodo) {
        var clases = this._construirClases('yfera-texto', nodo.estilos);
        var contenido = this._procesarContenidoTexto(nodo.contenido);
        return '<span class="' + clases + '">' + contenido + '</span>';
    }

    //IMAGEN
    _traducirImagen(nodo) {
        var clases = this._construirClases('yfera-imagen', nodo.estilos);
        var urls = nodo.urls || [];

        if (urls.length === 0) {
            return '<!-- imagen sin urls -->';
        }

        if (urls.length === 1) {
            // Imagen individual
            var src = this._urlAString(urls[0]);
            return '<img class="' + clases + '" src="' + src + '">';
        }

        // Carrusel
        var clasesCarr = this._construirClases('yfera-carrusel', nodo.estilos);
        var imgs = '';
        for (var i = 0; i < urls.length; i++) {
            var src = this._urlAString(urls[i]);
            imgs += '<img src="' + src + '">\n';
        }
        return '<div class="' + clasesCarr + '">\n' + imgs + '</div>';
    }

    _construirClases(claseBase, estilos) {
        if (!estilos || estilos.length === 0) return claseBase;
        return claseBase + ' ' + estilos.join(' ');
    }

    _urlAString(urlItem) {
        if (!urlItem) return '';
        if (urlItem.tipo === 'literal') {
            return this._escaparHtml(urlItem.valor);
        }
        if (urlItem.tipo === 'expresion') {
            return this._expresionAPlaceholder(urlItem.valor);
        }
        return '';
    }

    _procesarContenidoTexto(contenido) {
        if (typeof contenido !== 'string') return '';
        // Reemplazar $variable por {{$variable}}
        var conPlaceholders = contenido.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, '{{$$$1}}');
        conPlaceholders = conPlaceholders.replace(/`([^`]+)`/g, function(match, expr) {
            return '{{ ' + expr + ' }}';
        });
        return this._escaparHtml(conPlaceholders);
    }


    _expresionAPlaceholder(expr) {
        if (!expr) return '';
        switch (expr.tipo) {
            case 'numero':
            case 'cadena':
                return String(expr.valor);
            case 'booleano':
                return expr.valor ? 'true' : 'false';
            case 'variable':
                return '{{$' + expr.nombre + '}}';
            case 'acceso_array':
                return '{{$' + expr.nombre + '[' + this._expresionAPlaceholder(expr.indice) + ']}}';
            case 'suma':
            case 'resta':
            case 'multiplicacion':
            case 'division':
            case 'modulo':
            case 'mayor':
            case 'mayor_igual':
            case 'menor':
            case 'menor_igual':
            case 'igual_igual':
            case 'diferente':
            case 'and':
            case 'or':
                var op = this._operadorTexto(expr.tipo);
                return '{{ ' + this._expresionAPlaceholder(expr.izq) + ' ' + op + ' ' + this._expresionAPlaceholder(expr.der) + ' }}';
            case 'menos_unario':
                return '-' + this._expresionAPlaceholder(expr.operando);
            case 'negacion':
                return '!' + this._expresionAPlaceholder(expr.operando);
            default:
                return '';
        }
    }

    _operadorTexto(tipo) {
        var mapa = {
            suma: '+', resta: '-', multiplicacion: '*', division: '/', modulo: '%',
            mayor: '>', mayor_igual: '>=', menor: '<', menor_igual: '<=',
            igual_igual: '==', diferente: '!=',
            and: '&&', or: '||'
        };
        return mapa[tipo] || '';
    }

        //FORMULARIO
    _traducirFormulario(nodo) {
        var clases = this._construirClases('yfera-form', nodo.estilos);
        var contenido = this._traducirElementos(nodo.elementos);
        var submit = nodo.submit ? this._traducirSubmit(nodo.submit) : '';
        return '<form class="' + clases + '">\n' + contenido + '\n' + submit + '\n</form>';
    }

    _traducirSubmit(submit) {
        var clases = this._construirClases('yfera-submit', submit.estilos);
        var labelTexto = '';

        // Buscar label en propiedades
        if (Array.isArray(submit.propiedades)) {
            for (var i = 0; i < submit.propiedades.length; i++) {
                var p = submit.propiedades[i];
                if (p.clave === 'label' && p.valor && p.valor.tipo === 'literal') {
                    labelTexto = this._escaparHtml(p.valor.valor);
                }
            }
        }

        return '<button type="submit" class="' + clases + '">' + labelTexto + '</button>';
    }

    //INPUT
    _traducirInput(nodo) {
        var clases = this._construirClases('yfera-input', nodo.estilos);
        var props = this._extraerPropiedadesInput(nodo.propiedades);
        var htmlType = 'text';
        if (nodo.subtipo === 'number') htmlType = 'number';
        else if (nodo.subtipo === 'bool') htmlType = 'checkbox';

        var idAttr = props.id ? ' id="' + this._escaparHtml(props.id) + '"' : '';
        var labelHtml = props.label ? '<label class="yfera-label">' + this._escaparHtml(props.label) + '</label>' : '';

        var valueAttr;
        if (htmlType === 'checkbox') {
            valueAttr = props.value === 'true' ? ' checked' : '';
            return labelHtml + '<input type="checkbox" class="' + clases + '"' + idAttr + valueAttr + '>';
        } else {
            valueAttr = (props.value !== null && props.value !== undefined) ? ' value="' + this._escaparHtml(String(props.value)) + '"' : '';
            return labelHtml + '<input type="' + htmlType + '" class="' + clases + '"' + idAttr + valueAttr + '>';
        }
    }

    _extraerPropiedadesInput(propiedades) {
        var resultado = { id: null, label: null, value: null };
        if (!Array.isArray(propiedades)) return resultado;

        for (var i = 0; i < propiedades.length; i++) {
            var p = propiedades[i];
            if (!p || !p.clave) continue;

            var v = this._valorPropiedadInput(p.valor);
            if (p.clave === 'id') resultado.id = v;
            else if (p.clave === 'label') resultado.label = v;
            else if (p.clave === 'value') resultado.value = v;
        }
        return resultado;
    }

    _valorPropiedadInput(valor) {
        if (!valor) return '';
        if (valor.tipo === 'literal') return valor.valor;
        if (valor.tipo === 'numero') return String(valor.valor);
        if (valor.tipo === 'booleano') return valor.valor ? 'true' : 'false';
        if (valor.tipo === 'variable') return '{{$' + valor.valor + '}}';
        return '';
    }

    //IF / ELSE IF / ELSE
    _traducirIf(nodo) {
        var partes = [];
        var condTexto = this._expresionAPlaceholder(nodo.condicion);
        partes.push('<!-- if (' + condTexto + ') -->');
        partes.push('<div class="yfera-rama yfera-rama-if">');
        partes.push(this._traducirElementos(nodo.elementos));
        partes.push('</div>');

        if (Array.isArray(nodo.ramas_else)) {
            for (var i = 0; i < nodo.ramas_else.length; i++) {
                var rama = nodo.ramas_else[i];
                if (rama.tipo === 'else_if') {
                    var c = this._expresionAPlaceholder(rama.condicion);
                    partes.push('<!-- else if (' + c + ') -->');
                    partes.push('<div class="yfera-rama yfera-rama-else-if">');
                    partes.push(this._traducirElementos(rama.elementos));
                    partes.push('</div>');
                } else if (rama.tipo === 'else') {
                    partes.push('<!-- else -->');
                    partes.push('<div class="yfera-rama yfera-rama-else">');
                    partes.push(this._traducirElementos(rama.elementos));
                    partes.push('</div>');
                }
            }
        }

        return partes.join('\n');
    }

    //SWITCH
    _traducirSwitch(nodo) {
        var partes = [];
        var exprTexto = this._expresionAPlaceholder(nodo.expresion);
        partes.push('<!-- switch (' + exprTexto + ') -->');

        if (Array.isArray(nodo.casos)) {
            for (var i = 0; i < nodo.casos.length; i++) {
                var caso = nodo.casos[i];
                var valorTexto = caso.valor.tipo === 'cadena'
                    ? '"' + caso.valor.valor + '"'
                    : String(caso.valor.valor);
                partes.push('<!-- case ' + valorTexto + ' -->');
                partes.push('<div class="yfera-caso">');
                partes.push(this._traducirElementos(caso.elementos));
                partes.push('</div>');
            }
        }

        if (nodo.defecto) {
            partes.push('<!-- default -->');
            partes.push('<div class="yfera-caso yfera-caso-default">');
            partes.push(this._traducirElementos(nodo.defecto.elementos));
            partes.push('</div>');
        }

        return partes.join('\n');
    }

    //FOR EACH
    _traducirForEach(nodo) {
        var partes = [];
        var par = (nodo.pares && nodo.pares[0]) || { variable: '?', arreglo: '?' };
        partes.push('<!-- for each ($' + par.variable + ' : $' + par.arreglo + ') -->');
        partes.push('<div class="yfera-loop yfera-loop-each">');
        partes.push(this._traducirElementos(nodo.elementos));
        partes.push('</div>');
        return partes.join('\n');
    }

    //FOR COMPLEJO
    _traducirForComplejo(nodo) {
        var partes = [];
        var paresTexto = '';
        if (Array.isArray(nodo.pares)) {
            var entradas = [];
            for (var i = 0; i < nodo.pares.length; i++) {
                var p = nodo.pares[i];
                entradas.push('$' + p.variable + ' : $' + p.arreglo);
            }
            paresTexto = entradas.join(', ');
        }

        var idxTexto = nodo.indice ? ' track $' + nodo.indice : '';
        partes.push('<!-- for (' + paresTexto + ')' + idxTexto + ' -->');
        partes.push('<div class="yfera-loop yfera-loop-complejo">');
        partes.push(this._traducirElementos(nodo.elementos));
        partes.push('</div>');

        if (nodo.vacio) {
            partes.push('<!-- empty -->');
            partes.push('<div class="yfera-loop-empty">');
            partes.push(this._traducirElementos(nodo.vacio.elementos));
            partes.push('</div>');
        }

        return partes.join('\n');
    }

    _escaparHtml(texto) {
        if (typeof texto !== 'string') return '';
        return texto
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

module.exports = TraductorComp;