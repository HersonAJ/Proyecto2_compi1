const fs = require('fs');
const path = require('path');

class ContextoProyecto {
    constructor(opciones) {
        this.opciones = opciones || {};
        this.cache = new Map();
        // Tabla del proyecto: agrupa todo lo que los imports han aportado
        this.componentes = new Map();   // nombre -> { archivo, parametros, linea, columna }
        this.estilos = new Map();       // nombre -> { archivo, linea, columna }
    }

    estaActivo() {
        return Boolean(
            this.opciones.proyecto &&
            this.opciones.rutaArchivo &&
            this.opciones.rutaBaseProyectos
        );
    }

    resolverRuta(rutaRelativa) {
        if (!this.estaActivo()) return null;
        const rutaProyecto = path.join(this.opciones.rutaBaseProyectos, this.opciones.proyecto);
        const carpetaArchivoActual = path.dirname(path.join(rutaProyecto, this.opciones.rutaArchivo));
        const rutaResuelta = path.resolve(carpetaArchivoActual, rutaRelativa);
        if (!rutaResuelta.startsWith(rutaProyecto)) return null;
        return rutaResuelta;
    }

    existeArchivo(rutaRelativa) {
        const ruta = this.resolverRuta(rutaRelativa);
        if (!ruta) return false;
        return fs.existsSync(ruta);
    }

    leerArchivo(rutaRelativa) {
        const ruta = this.resolverRuta(rutaRelativa);
        if (!ruta || !fs.existsSync(ruta)) return null;
        return fs.readFileSync(ruta, 'utf8');
    }

    cargarStyles(rutaRelativa) {
        if (this.cache.has(rutaRelativa)) {
            return this.cache.get(rutaRelativa);
        }

        const contenido = this.leerArchivo(rutaRelativa);
        if (contenido === null) {
            const r = { exito: false, errores: [], estilosDefinidos: [], archivoNoEncontrado: true };
            this.cache.set(rutaRelativa, r);
            return r;
        }

        const GeneradorEstilos = require('../../estilos/GeneradorEstilos');
        const generador = new GeneradorEstilos();
        const resultado = generador.analizar(contenido);

        const estilosDefinidos = this._extraerEstilos(resultado.ast);

        // Registrar estilos en la tabla del proyecto
        for (let i = 0; i < estilosDefinidos.length; i++) {
            const e = estilosDefinidos[i];
            if (!this.estilos.has(e.nombre)) {
                this.estilos.set(e.nombre, {
                    archivo: rutaRelativa,
                    linea: e.linea,
                    columna: e.columna
                });
            }
        }

        const r = {
            exito: resultado.exito,
            errores: resultado.errores || [],
            estilosDefinidos: estilosDefinidos
        };
        this.cache.set(rutaRelativa, r);
        return r;
    }

    cargarComp(rutaRelativa) {
        if (this.cache.has(rutaRelativa)) {
            return this.cache.get(rutaRelativa);
        }

        const contenido = this.leerArchivo(rutaRelativa);
        if (contenido === null) {
            const r = { exito: false, errores: [], componentesDefinidos: [], archivoNoEncontrado: true };
            this.cache.set(rutaRelativa, r);
            return r;
        }

        const GeneradorComp = require('../../comp/GeneradorComp');
        const generador = new GeneradorComp();
        const resultado = generador.analizar(contenido);

        const componentesDefinidos = this._extraerComponentes(resultado.ast);

        // Registrar componentes en la tabla del proyecto
        for (let i = 0; i < componentesDefinidos.length; i++) {
            const c = componentesDefinidos[i];
            if (!this.componentes.has(c.nombre)) {
                this.componentes.set(c.nombre, {
                    archivo: rutaRelativa,
                    parametros: c.parametros,
                    linea: c.linea,
                    columna: c.columna
                });
            }
        }

        const r = {
            exito: resultado.exito,
            errores: resultado.errores || [],
            componentesDefinidos: componentesDefinidos
        };
        this.cache.set(rutaRelativa, r);
        return r;
    }

    //Devuelve la info de un componente registrado, o null si no existe
    buscarComponente(nombre) {
        return this.componentes.get(nombre) || null;
    }

    //Devuelve la info de un estilo registrado, o null si no existe
    buscarEstilo(nombre) {
        return this.estilos.get(nombre) || null;
    }

    _extraerComponentes(ast) {
        if (!Array.isArray(ast)) return [];
        const lista = [];
        for (let i = 0; i < ast.length; i++) {
            const n = ast[i];
            if (n && n.tipo === 'componente') {
                lista.push({
                    nombre: n.nombre,
                    parametros: n.parametros || [],
                    linea: n.linea,
                    columna: n.columna
                });
            }
        }
        return lista;
    }

    _extraerEstilos(ast) {
        if (!Array.isArray(ast)) return [];
        const lista = [];
        for (let i = 0; i < ast.length; i++) {
            const n = ast[i];
            if (!n) continue;
            if (n.tipo === 'estilo') {
                lista.push({ nombre: n.nombre, linea: n.linea, columna: n.columna });
            }
            if (n.tipo === 'for_estilos' && Array.isArray(n.estilos)) {
                for (let j = 0; j < n.estilos.length; j++) {
                    const e = n.estilos[j];
                }
            }
        }
        return lista;
    }
}

module.exports = ContextoProyecto;