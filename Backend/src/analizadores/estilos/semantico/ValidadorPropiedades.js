const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorPropiedades {
    constructor(tabla, errores) {
        this.tabla = tabla;
        this.errores = errores;
        this._reglas = this._construirReglas();
    }

    validar(estilo) {
        if (!estilo || !Array.isArray(estilo.propiedades)) return;

        for (var i = 0; i < estilo.propiedades.length; i++) {
            this._validarPropiedad(estilo.propiedades[i]);
        }
    }

    _validarPropiedad(propiedad) {
        if (!propiedad || !propiedad.nombre) return;

        var validacion = this._reglas[propiedad.nombre];
        if (!validacion) {
            // Propiedad no reconocida 
            return;
        }

        validacion.call(this, propiedad, propiedad.valores || []);
    }

    _construirReglas() {
        return {
            'height':           this._esperarNumeroOPorcentaje,
            'width':            this._esperarNumeroOPorcentaje,
            'min-width':        this._esperarNumeroOPorcentaje,
            'max-width':        this._esperarNumeroOPorcentaje,
            'min-height':       this._esperarNumeroOPorcentaje,
            'max-height':       this._esperarNumeroOPorcentaje,
            'padding':          this._esperarNumero,
            'padding left':     this._esperarNumero,
            'padding top':      this._esperarNumero,
            'padding right':    this._esperarNumero,
            'padding bottom':   this._esperarNumero,
            'margin':           this._esperarNumero,
            'margin left':      this._esperarNumero,
            'margin top':       this._esperarNumero,
            'margin right':     this._esperarNumero,
            'margin bottom':    this._esperarNumero,
            'text size':        this._esperarNumero,
            'border radius':    this._esperarNumero,
            'border width':     this._esperarNumero,
            'color':            this._esperarColor,
            'background color': this._esperarColor,
            'border color':     this._esperarColor,
            'text align':       this._esperarAlineacion,
            'text font':        this._esperarFuente,
            'border style':     this._esperarEstiloBorde
        };
    }

    _esperarNumero(propiedad, valores) {
        if (valores.length === 0) return;
        var v = valores[0];

        if (v.tipo === 'variable' || v.tipo === 'binaria') return;

        var tiposValidos = ['entero', 'decimal'];
        if (tiposValidos.indexOf(v.tipo) === -1) {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    String(v.valor || ''),
                    v.linea || propiedad.linea,
                    v.columna || propiedad.columna,
                    'La propiedad "' + propiedad.nombre + '" espera un valor numerico, se encontro: ' + v.tipo + '.'
                )
            );
        }
    }

    _esperarNumeroOPorcentaje(propiedad, valores) {
        if (valores.length === 0) return;
        var v = valores[0];

        if (v.tipo === 'variable' || v.tipo === 'binaria') return;

        var tiposValidos = ['entero', 'decimal', 'porcentaje'];
        if (tiposValidos.indexOf(v.tipo) === -1) {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    String(v.valor || ''),
                    v.linea || propiedad.linea,
                    v.columna || propiedad.columna,
                    'La propiedad "' + propiedad.nombre + '" espera un numero o porcentaje, se encontro: ' + v.tipo + '.'
                )
            );
        }
    }

    _esperarColor(propiedad, valores) {
        if (valores.length === 0) return;
        var v = valores[0];

        if (v.tipo !== 'identificador') {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    String(v.valor || ''),
                    v.linea || propiedad.linea,
                    v.columna || propiedad.columna,
                    'La propiedad "' + propiedad.nombre + '" espera un color, se encontro: ' + v.tipo + '.'
                )
            );
        }
    }

    _esperarAlineacion(propiedad, valores) {
        if (valores.length === 0) return;
        var v = valores[0];
        var validos = ['CENTER', 'RIGHT', 'LEFT'];

        if (v.tipo !== 'identificador' || validos.indexOf(v.valor) === -1) {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    String(v.valor || ''),
                    v.linea || propiedad.linea,
                    v.columna || propiedad.columna,
                    'La propiedad "text align" espera CENTER, RIGHT o LEFT. Se encontro: "' + v.valor + '".'
                )
            );
        }
    }

    _esperarFuente(propiedad, valores) {
        if (valores.length === 0) return;
        var fuente = valores.map(function(v) { return v.valor; }).join(' ');
        var validas = ['HELVETICA', 'SANS', 'SANS SERIF', 'MONO', 'CURSIVE'];

        var primer = valores[0];
        if (validas.indexOf(fuente) === -1) {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    fuente,
                    primer.linea || propiedad.linea,
                    primer.columna || propiedad.columna,
                    'La propiedad "text font" espera HELVETICA, SANS, SANS SERIF, MONO o CURSIVE. Se encontro: "' + fuente + '".'
                )
            );
        }
    }

    _esperarEstiloBorde(propiedad, valores) {
        if (valores.length === 0) return;
        var v = valores[0];
        var validos = ['DOTTED', 'LINE', 'DOUBLE'];

        if (v.tipo !== 'identificador' || validos.indexOf(v.valor) === -1) {
            this.errores.push(
                new ErrorYFERA(
                    'Semantico',
                    String(v.valor || ''),
                    v.linea || propiedad.linea,
                    v.columna || propiedad.columna,
                    'La propiedad "border style" espera DOTTED, LINE o DOUBLE. Se encontro: "' + v.valor + '".'
                )
            );
        }
    }
}

module.exports = ValidadorPropiedades;