class ResolutorHerencia {
    constructor(mapaEstilos) {
        // mapaEstilos: { 'nombre-estilo': nodoEstilo }
        this.mapaEstilos = mapaEstilos;
    }

    resolver(estilo) {
        // Retorna un estilo con todas las propiedades efectivas
        // (heredadas + propias, donde las propias sobreescriben)

        if (!estilo.extiende) {
            return {
                nombre: estilo.nombre,
                propiedades: estilo.propiedades || []
            };
        }

        var padre = this.mapaEstilos[estilo.extiende];
        if (!padre) {
            return {
                nombre: estilo.nombre,
                propiedades: estilo.propiedades || []
            };
        }

        // Resolver recursivamente las propiedades del padre
        var propiedadesPadre = this.resolver(padre).propiedades;
        var propiedadesPropias = estilo.propiedades || [];

        // Combinar: padre primero, luego propias (las propias sobreescriben)
        var propiedadesCombinadas = this._combinar(propiedadesPadre, propiedadesPropias);

        return {
            nombre: estilo.nombre,
            propiedades: propiedadesCombinadas
        };
    }

    _combinar(propiedadesPadre, propiedadesPropias) {
        // Las propiedades se identifican por nombre. Si una propia tiene el mismo
        // nombre que una heredada, la propia gana.
        var mapa = {};

        // Primero las del padre
        for (var i = 0; i < propiedadesPadre.length; i++) {
            mapa[propiedadesPadre[i].nombre] = propiedadesPadre[i];
        }

        // Luego las propias (sobreescriben si hay coincidencia)
        for (var j = 0; j < propiedadesPropias.length; j++) {
            mapa[propiedadesPropias[j].nombre] = propiedadesPropias[j];
        }

        return Object.values(mapa);
    }
}

module.exports = ResolutorHerencia;