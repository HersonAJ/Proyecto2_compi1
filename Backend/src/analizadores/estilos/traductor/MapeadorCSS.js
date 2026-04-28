class MapeadorCSS {
    // Mapea el nombre del lenguaje YFERA a CSS estandar
    mapearNombrePropiedad(nombre) {
        var mapa = {
            'background color': 'background-color',
            'text align':       'text-align',
            'text size':        'font-size',
            'text font':        'font-family',
            'border radius':    'border-radius',
            'border style':     'border-style',
            'border width':     'border-width',
            'border color':     'border-color',
            'border top':       'border-top',
            'border right':     'border-right',
            'border bottom':    'border-bottom',
            'border left':      'border-left',
            'border top style':    'border-top-style',
            'border right style':  'border-right-style',
            'border bottom style': 'border-bottom-style',
            'border left style':   'border-left-style',
            'border top color':    'border-top-color',
            'border right color':  'border-right-color',
            'border bottom color': 'border-bottom-color',
            'border left color':   'border-left-color',
            'border top width':    'border-top-width',
            'border right width':  'border-right-width',
            'border bottom width': 'border-bottom-width',
            'border left width':   'border-left-width',
            'padding left':     'padding-left',
            'padding top':      'padding-top',
            'padding right':    'padding-right',
            'padding bottom':   'padding-bottom',
            'margin left':      'margin-left',
            'margin top':       'margin-top',
            'margin right':     'margin-right',
            'margin bottom':    'margin-bottom',
            'min-width':        'min-width',
            'max-width':        'max-width',
            'min-height':       'min-height',
            'max-height':       'max-height'
        };
        return mapa[nombre] || nombre;
    }

    // Convierte un valor del AST a string CSS
mapearValor(valor, nombrePropiedad) {
    switch (valor.tipo) {
        case 'entero':
        case 'decimal':
            // Si es propiedad numerica O un border abreviado, agregar px
            if (this._esPropiedadConPx(nombrePropiedad) || this._esBorderAbreviado(nombrePropiedad)) {
                return valor.valor + 'px';
            }
            return String(valor.valor);

        case 'porcentaje':
            return valor.valor;

        case 'identificador':
            return this._mapearIdentificador(valor.valor);

        case 'variable':
            return valor.valor;

        default:
            return String(valor.valor || '');
    }
}

    // Mapea identificadores especiales del lenguaje a CSS
    _mapearIdentificador(id) {
        var mapa = {
            'CENTER':   'center',
            'RIGHT':    'right',
            'LEFT':     'left',
            'HELVETICA': 'Helvetica',
            'SANS':     'sans-serif',
            'MONO':     'monospace',
            'CURSIVE':  'cursive',
            'DOTTED':   'dotted',
            'LINE':     'solid',
            'DOUBLE':   'double'
        };
        return mapa[id] || id;
    }

    // Convierte una propiedad completa a la string CSS "nombre: valor;"
mapearPropiedad(propiedad) {
    var nombreCSS = this.mapearNombrePropiedad(propiedad.nombre);
    var valoresCSS = (propiedad.valores || []).map(function(v) {
        return this.mapearValor(v, propiedad.nombre);
    }.bind(this));

    // Caso especial: "text font = SANS SERIF" → "font-family: sans-serif"
    if (propiedad.nombre === 'text font' && valoresCSS.length > 1) {
        return nombreCSS + ': ' + this._concatenarFuente(valoresCSS) + ';';
    }

    return nombreCSS + ': ' + valoresCSS.join(' ') + ';';
}

    _esPropiedadConPx(nombre) {
        var conPx = [
            'height', 'width', 'min-width', 'max-width', 'min-height', 'max-height',
            'padding', 'padding-left', 'padding-top', 'padding-right', 'padding-bottom',
            'margin', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom',
            'border-radius', 'border-width', 'font-size',
            'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'
        ];
        var nombreCSS = this.mapearNombrePropiedad(nombre);
        return conPx.indexOf(nombreCSS) !== -1 || conPx.indexOf(nombre) !== -1;
    }

_esBorderAbreviado(nombre) {
    return nombre === 'border'
        || nombre === 'border top'
        || nombre === 'border right'
        || nombre === 'border bottom'
        || nombre === 'border left';
}

    _concatenarFuente(valores) {
        // SANS SERIF -> sans-serif (en lugar de "sans-serif serif")
        if (valores.length === 2 && valores[0] === 'sans-serif' && valores[1] === 'SERIF') {
            return 'sans-serif';
        }
        return valores.join(' ').toLowerCase();
    }
}

module.exports = MapeadorCSS;