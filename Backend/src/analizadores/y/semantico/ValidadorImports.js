const fs = require('fs');
const path = require('path');
const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorImports {
    constructor(opciones) {
        this.opciones = opciones || {};
    }

    validar(imports, tabla) {
        const errores = [];

        for (let i = 0; i < imports.length; i++) {
            const imp = imports[i];
            const ruta = imp.ruta;

            // Validar formato: debe terminar en .styles o .comp
            if (!ruta.endsWith('.styles') && !ruta.endsWith('.comp')) {
                errores.push(new ErrorYFERA(
                    'Semantico',
                    'import',
                    imp.linea,
                    imp.columna,
                    'El import "' + ruta + '" debe terminar en .styles o .comp'
                ));
                continue;
            }

            // Validar que sea ruta relativa
            if (!ruta.startsWith('./') && !ruta.startsWith('../')) {
                errores.push(new ErrorYFERA(
                    'Semantico',
                    'import',
                    imp.linea,
                    imp.columna,
                    'El import "' + ruta + '" debe ser una ruta relativa (empezar con ./ o ../)'
                ));
                continue;
            }

            // Validar duplicados (consultando la tabla de simbolos)
            if (tabla.existeLocal(ruta)) {
                errores.push(new ErrorYFERA(
                    'Semantico',
                    'import',
                    imp.linea,
                    imp.columna,
                    'El import "' + ruta + '" ya fue declarado anteriormente'
                ));
                continue;
            }


            // Validar que el archivo exista en el proyecto
            if (this.opciones.proyecto && this.opciones.rutaBaseProyectos && this.opciones.rutaArchivo) {
                const rutaProyecto = path.join(this.opciones.rutaBaseProyectos, this.opciones.proyecto);
                const carpetaArchivo = path.dirname(path.join(rutaProyecto, this.opciones.rutaArchivo));
                const rutaResuelta = path.resolve(carpetaArchivo, ruta);

                // Validacion de seguridad: no salir del proyecto
                if (!rutaResuelta.startsWith(rutaProyecto)) {
                    errores.push(new ErrorYFERA(
                        'Semantico',
                        'import',
                        imp.linea,
                        imp.columna,
                        'El import "' + ruta + '" apunta fuera del proyecto'
                    ));
                    continue;
                }

                if (!fs.existsSync(rutaResuelta)) {
                    errores.push(new ErrorYFERA(
                        'Semantico',
                        'import',
                        imp.linea,
                        imp.columna,
                        'No se encontro el archivo importado: "' + ruta + '"'
                    ));
                    continue;
                }
            }

            // Registrar en tabla de simbolos
            tabla.insertar(ruta, {
                categoria: 'import',
                tipoDato: ruta.endsWith('.styles') ? 'styles' : 'comp',
                linea: imp.linea,
                columna: imp.columna
            });
        }

        return errores;
    }
}

module.exports = ValidadorImports;