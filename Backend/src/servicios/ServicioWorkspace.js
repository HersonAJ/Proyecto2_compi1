const fs = require('fs');
const path = require('path');

class ServicioWorkspace {
    constructor(rutaBaseProyectos) {
        this.rutaBaseProyectos = rutaBaseProyectos;
        this._asegurarBase();
    }

    _asegurarBase() {
        if (!fs.existsSync(this.rutaBaseProyectos)) {
            fs.mkdirSync(this.rutaBaseProyectos, { recursive: true });
        }
    }

    /* ============== PROYECTOS ============== */

    listarProyectos() {
        var entradas = fs.readdirSync(this.rutaBaseProyectos);
        return entradas.filter(function(nombre) {
            var rutaCompleta = path.join(this.rutaBaseProyectos, nombre);
            return fs.statSync(rutaCompleta).isDirectory();
        }.bind(this)).sort();
    }

    crearProyecto(nombre) {
        this._validarNombreProyecto(nombre);
        var ruta = path.join(this.rutaBaseProyectos, nombre);
        if (fs.existsSync(ruta)) {
            throw new Error('Ya existe un proyecto con ese nombre: ' + nombre);
        }
        fs.mkdirSync(ruta, { recursive: true });
        return true;
    }

    eliminarProyecto(nombre) {
        this._validarNombreProyecto(nombre);
        var ruta = path.join(this.rutaBaseProyectos, nombre);
        if (!fs.existsSync(ruta)) {
            throw new Error('El proyecto no existe: ' + nombre);
        }
        fs.rmSync(ruta, { recursive: true, force: true });
        return true;
    }

    _validarNombreProyecto(nombre) {
        if (typeof nombre !== 'string' || nombre.trim() === '') {
            throw new Error('El nombre del proyecto no puede estar vacio');
        }
        if (!/^[a-zA-Z0-9_\-]+$/.test(nombre)) {
            throw new Error('El nombre del proyecto solo puede contener letras, numeros, guiones y guion bajo');
        }
    }

    /* ============== ARCHIVOS DENTRO DE UN PROYECTO ============== */

    _rutaProyecto(nombreProyecto) {
        this._validarNombreProyecto(nombreProyecto);
        var ruta = path.join(this.rutaBaseProyectos, nombreProyecto);
        if (!fs.existsSync(ruta)) {
            throw new Error('El proyecto no existe: ' + nombreProyecto);
        }
        return ruta;
    }

    _rutaSegura(nombreProyecto, rutaRelativa) {
        var rutaProyecto = this._rutaProyecto(nombreProyecto);
        var rutaAbsoluta = path.resolve(rutaProyecto, rutaRelativa || '');
        if (!rutaAbsoluta.startsWith(rutaProyecto)) {
            throw new Error('Ruta fuera del proyecto');
        }
        return rutaAbsoluta;
    }

    listarArchivos(nombreProyecto) {
        var rutaProyecto = this._rutaProyecto(nombreProyecto);
        return this._listarRecursivo(rutaProyecto, '');
    }

    _listarRecursivo(rutaAbsoluta, rutaRelativa) {
        var nombre = rutaRelativa === '' ? path.basename(rutaAbsoluta) : path.basename(rutaRelativa);
        var stat = fs.statSync(rutaAbsoluta);

        if (stat.isDirectory()) {
            var entradas = fs.readdirSync(rutaAbsoluta).sort(function(a, b) {
                var rutaA = path.join(rutaAbsoluta, a);
                var rutaB = path.join(rutaAbsoluta, b);
                var esCarpetaA = fs.statSync(rutaA).isDirectory();
                var esCarpetaB = fs.statSync(rutaB).isDirectory();
                if (esCarpetaA && !esCarpetaB) return -1;
                if (!esCarpetaA && esCarpetaB) return 1;
                return a.localeCompare(b);
            });

            var hijos = entradas.map(function(entrada) {
                var rutaHija = path.join(rutaAbsoluta, entrada);
                var rutaRelativaHija = rutaRelativa === '' ? entrada : (rutaRelativa + '/' + entrada);
                return this._listarRecursivo(rutaHija, rutaRelativaHija);
            }.bind(this));

            return {
                nombre: nombre,
                tipo: 'carpeta',
                ruta: rutaRelativa,
                hijos: hijos
            };
        }

        return {
            nombre: nombre,
            tipo: 'archivo',
            ruta: rutaRelativa
        };
    }

    leerArchivo(nombreProyecto, rutaRelativa) {
        var ruta = this._rutaSegura(nombreProyecto, rutaRelativa);
        if (!fs.existsSync(ruta)) {
            throw new Error('El archivo no existe: ' + rutaRelativa);
        }
        if (fs.statSync(ruta).isDirectory()) {
            throw new Error('La ruta es una carpeta, no un archivo: ' + rutaRelativa);
        }
        return fs.readFileSync(ruta, 'utf8');
    }

    guardarArchivo(nombreProyecto, rutaRelativa, contenido) {
        var ruta = this._rutaSegura(nombreProyecto, rutaRelativa);
        var carpetaPadre = path.dirname(ruta);
        if (!fs.existsSync(carpetaPadre)) {
            fs.mkdirSync(carpetaPadre, { recursive: true });
        }
        fs.writeFileSync(ruta, contenido, 'utf8');
        return true;
    }

    crearCarpeta(nombreProyecto, rutaRelativa) {
        var ruta = this._rutaSegura(nombreProyecto, rutaRelativa);
        if (fs.existsSync(ruta)) {
            throw new Error('Ya existe un archivo o carpeta con ese nombre: ' + rutaRelativa);
        }
        fs.mkdirSync(ruta, { recursive: true });
        return true;
    }

    eliminar(nombreProyecto, rutaRelativa) {
        var ruta = this._rutaSegura(nombreProyecto, rutaRelativa);
        var rutaProyecto = this._rutaProyecto(nombreProyecto);
        if (ruta === rutaProyecto) {
            throw new Error('No se puede eliminar la raiz del proyecto');
        }
        if (!fs.existsSync(ruta)) {
            throw new Error('No existe: ' + rutaRelativa);
        }
        fs.rmSync(ruta, { recursive: true, force: true });
        return true;
    }
}

module.exports = ServicioWorkspace;