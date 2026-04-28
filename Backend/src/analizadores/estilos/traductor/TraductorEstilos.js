const ExpansorBucleFor = require('./ExpansorBucleFor');
const ResolutorHerencia = require('./ResolutorHerencia');
const MapeadorCSS = require('./MapeadorCSS');

class TraductorEstilos {
    traducir(definiciones) {
        if (!Array.isArray(definiciones)) return '';

        // PASO 1: expandir todos los @for en estilos planos
        var estilosPlanos = this._aplanarDefiniciones(definiciones);

        // PASO 2: construir mapa de estilos por nombre (para resolver extends)
        var mapaEstilos = {};
        for (var i = 0; i < estilosPlanos.length; i++) {
            mapaEstilos[estilosPlanos[i].nombre] = estilosPlanos[i];
        }

        // PASO 3: resolver herencia para cada estilo
        var resolutor = new ResolutorHerencia(mapaEstilos);
        var estilosResueltos = estilosPlanos.map(function(e) {
            return resolutor.resolver(e);
        });

        // PASO 4: convertir a CSS
        var mapeador = new MapeadorCSS();
        var bloquesCSS = estilosResueltos
            .filter(function(e) { return e.propiedades && e.propiedades.length > 0; })
            .map(function(e) {
                return this._estiloACSS(e, mapeador);
            }.bind(this));

        return bloquesCSS.join('\n\n');
    }

    _aplanarDefiniciones(definiciones) {
        var planos = [];
        var expansor = new ExpansorBucleFor();

        for (var i = 0; i < definiciones.length; i++) {
            var def = definiciones[i];
            if (!def) continue;

            if (def.tipo === 'estilo') {
                planos.push(def);
            } else if (def.tipo === 'for') {
                var expandidos = expansor.expandir(def);
                for (var j = 0; j < expandidos.length; j++) {
                    planos.push(expandidos[j]);
                }
            }
        }

        return planos;
    }

_estiloACSS(estilo, mapeador) {
    var lineas = [];
    var nombreSeguro = this._asegurarNombreCSS(estilo.nombre);
    lineas.push('.' + nombreSeguro + ' {');

    for (var i = 0; i < estilo.propiedades.length; i++) {
        var propCSS = mapeador.mapearPropiedad(estilo.propiedades[i]);
        lineas.push('    ' + propCSS);
    }

    lineas.push('}');
    return lineas.join('\n');
}

_asegurarNombreCSS(nombre) {
    // CSS no permite que las clases empiecen con un digito
    if (/^[0-9]/.test(nombre)) {
        return '_' + nombre;
    }
    return nombre;
}
}

module.exports = TraductorEstilos;