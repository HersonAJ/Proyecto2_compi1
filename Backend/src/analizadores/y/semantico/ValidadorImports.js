const ErrorYFERA = require('../../errores/ErrorYFERA');

class ValidadorImports {
    constructor(contexto) {
        this.contexto = contexto;
    }

    validar(imports, tabla) {
        const errores = [];

        for (let i = 0; i < imports.length; i++) {
            const imp = imports[i];
            const ruta = imp.ruta;

            // Validar formato: extension valida
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

            // Validar ruta relativa
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

            // Validar duplicados
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

            if (this.contexto && this.contexto.estaActivo()) {
                const ruta_resuelta = this.contexto.resolverRuta(ruta);

                if (ruta_resuelta === null) {
                    errores.push(new ErrorYFERA(
                        'Semantico',
                        'import',
                        imp.linea,
                        imp.columna,
                        'El import "' + ruta + '" apunta fuera del proyecto'
                    ));
                    continue;
                }

                if (!this.contexto.existeArchivo(ruta)) {
                    errores.push(new ErrorYFERA(
                        'Semantico',
                        'import',
                        imp.linea,
                        imp.columna,
                        'No se encontro el archivo importado: "' + ruta + '"'
                    ));
                    continue;
                }

                let resultado;
                if (ruta.endsWith('.styles')) {
                    resultado = this.contexto.cargarStyles(ruta);
                } else {
                    resultado = this.contexto.cargarComp(ruta);
                }

                if (!resultado.exito && resultado.errores.length > 0) {
                    errores.push(new ErrorYFERA(
                        'Semantico',
                        'import',
                        imp.linea,
                        imp.columna,
                        'El archivo importado "' + ruta + '" tiene ' +
                        resultado.errores.length + ' error(es). Corrige ese archivo primero.'
                    ));
                }
            }

            // Registrar el import en la tabla del .y
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