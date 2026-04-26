class TablaSimbolos {
    constructor(nombre = 'global', padre = null) {
        this.nombre = nombre;          // identificador del scope
        this.padre = padre;             // tabla padre (para scopes anidados)
        this.simbolos = new Map();      // map nombre -> info
    }

    // Inserta un simbolo. Retorna false si ya existe en este scope
    insertar(nombre, info) {
        if (this.simbolos.has(nombre)) {
            return false;
        }
        this.simbolos.set(nombre, info);
        return true;
    }

    // Busca un simbolo en este scope y en los padres (scope chain)
    buscar(nombre) {
        if (this.simbolos.has(nombre)) {
            return this.simbolos.get(nombre);
        }
        if (this.padre) {
            return this.padre.buscar(nombre);
        }
        return null;
    }

    // Busca un simbolo SOLO en este scope (sin subir al padre)
    buscarLocal(nombre) {
        return this.simbolos.has(nombre) ? this.simbolos.get(nombre) : null;
    }

    // Verifica si un simbolo existe (en este scope o padres)
    existe(nombre) {
        return this.buscar(nombre) !== null;
    }

    // Verifica si un simbolo existe SOLO en este scope
    existeLocal(nombre) {
        return this.simbolos.has(nombre);
    }

    // Actualiza la informacion de un simbolo existente
    actualizar(nombre, info) {
        if (this.simbolos.has(nombre)) {
            this.simbolos.set(nombre, info);
            return true;
        }
        if (this.padre) {
            return this.padre.actualizar(nombre, info);
        }
        return false;
    }

    // Crea un scope hijo a partir de este
    crearScopeHijo(nombreScope) {
        return new TablaSimbolos(nombreScope, this);
    }

    // Retorna todos los simbolos de este scope (sin los del padre)
    obtenerLocales() {
        var lista = [];
        this.simbolos.forEach(function(info, nombre) {
            lista.push({ nombre: nombre, info: info });
        });
        return lista;
    }

    // Retorna todos los simbolos visibles desde este scope (incluyendo padres)
    obtenerTodos() {
        var lista = [];
        var actual = this;
        var visitados = new Set();

        while (actual !== null) {
            actual.simbolos.forEach(function(info, nombre) {
                if (!visitados.has(nombre)) {
                    visitados.add(nombre);
                    lista.push({
                        nombre: nombre,
                        info: info,
                        scope: actual.nombre
                    });
                }
            });
            actual = actual.padre;
        }

        return lista;
    }

    // Util para depuracion: imprime el contenido del scope y sus padres
    imprimir() {
        var actual = this;
        while (actual !== null) {
            console.log('Scope: ' + actual.nombre);
            actual.simbolos.forEach(function(info, nombre) {
                console.log('  ' + nombre + ':', info);
            });
            actual = actual.padre;
        }
    }
}

module.exports = TablaSimbolos;