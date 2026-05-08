const fs = require('fs');
const path = require('path');
const yModulo = require('./y');
const ErrorYFERA = require('../errores/ErrorYFERA');
const GeneradorSQL = require('../sql/GeneradorSQL');

/**
 * Invoca una funcion del .y con argumentos reales (recolectados del form
 * en el navegador). Ejecuta los `execute` y los `load` del cuerpo y devuelve
 * un resumen al frontend.
 */
class InvocadorFuncionY {
    constructor(opciones) {
        this.opciones = opciones || {};
    }

    invocar(params) {
        const respuesta = {
            exito: false,
            recargar: false,
            mensajes: [],
            errores: []
        };

        // 1. Parsear el .y
        yModulo.reiniciarErrores();
        let ast = [];
        try {
            ast = yModulo.parse(params.codigo) || [];
        } catch (e) {
            // errores ya registrados
        }

        const erroresInternos = yModulo.obtenerErrores();
        const todosErroresParseo = [
            ...(erroresInternos.lexicos || []),
            ...(erroresInternos.sintacticos || [])
        ];
        if (todosErroresParseo.length > 0) {
            respuesta.errores = todosErroresParseo.map(this._mapearError);
            return respuesta;
        }

        // 2. Encontrar la funcion
        const funcion = ast.find(function (d) {
            return d && d.tipo === 'funcion' && d.nombre === params.nombreFuncion;
        });

        if (!funcion) {
            respuesta.errores.push({
                tipo: 'Semantico',
                lexema: params.nombreFuncion,
                linea: 0,
                columna: 0,
                mensaje: 'No se encontro la funcion "' + params.nombreFuncion + '" en el archivo'
            });
            return respuesta;
        }

        // 3. Mapear argumentos a parametros
        if (params.argumentos.length !== funcion.parametros.length) {
            respuesta.errores.push({
                tipo: 'Semantico',
                lexema: params.nombreFuncion,
                linea: funcion.linea,
                columna: funcion.columna,
                mensaje: 'La funcion "' + params.nombreFuncion + '" espera ' +
                    funcion.parametros.length + ' argumento(s) pero se recibieron ' + params.argumentos.length
            });
            return respuesta;
        }

        const valores = new Map();
        for (let i = 0; i < funcion.parametros.length; i++) {
            const p = funcion.parametros[i];
            const arg = params.argumentos[i];
            const convertido = this._convertirTipo(arg, p.tipoDato);
            if (convertido.error) {
                respuesta.errores.push({
                    tipo: 'Semantico',
                    lexema: p.nombre,
                    linea: p.linea,
                    columna: p.columna,
                    mensaje: 'El parametro "' + p.nombre + '" espera tipo ' + p.tipoDato +
                        ' pero recibio: ' + JSON.stringify(arg)
                });
                return respuesta;
            }
            valores.set(p.nombre, convertido.valor);
        }

        // 4. Ejecutar el cuerpo de la funcion en orden
        for (let i = 0; i < funcion.cuerpo.length; i++) {
            const sentencia = funcion.cuerpo[i];

            if (sentencia.tipo === 'execute') {
                const sqlSustituido = this._sustituirVariables(sentencia.sql, valores);
                const r = this._ejecutarSQL(sqlSustituido);
                if (!r.exito) {
                    respuesta.errores.push({
                        tipo: 'Semantico',
                        lexema: 'execute',
                        linea: sentencia.linea,
                        columna: sentencia.columna,
                        mensaje: 'Error en execute: ' + r.mensaje
                    });
                    return respuesta;
                }
                respuesta.mensajes.push(r.mensaje);
            } else if (sentencia.tipo === 'load') {
                let archivo;
                if (sentencia.clase === 'literal') {
                    archivo = sentencia.valor;
                } else if (sentencia.clase === 'variable') {
                    archivo = valores.get(sentencia.valor);
                    if (typeof archivo !== 'string') {
                        respuesta.errores.push({
                            tipo: 'Semantico',
                            lexema: 'load',
                            linea: sentencia.linea,
                            columna: sentencia.columna,
                            mensaje: 'load espera una variable string que apunte a un archivo .y'
                        });
                        return respuesta;
                    }
                }
                if (typeof archivo !== 'string' || !archivo.endsWith('.y')) {
                    respuesta.errores.push({
                        tipo: 'Semantico',
                        lexema: 'load',
                        linea: sentencia.linea,
                        columna: sentencia.columna,
                        mensaje: 'load debe apuntar a un archivo .y, recibio: "' + archivo + '"'
                    });
                    return respuesta;
                }
                respuesta.recargar = true;
                respuesta.mensajes.push('load: se recargara la pagina');
                break;
            }
        }

        respuesta.exito = true;
        return respuesta;
    }

    _mapearError(e) {
        return {
            tipo: e.tipo,
            lexema: e.lexema,
            linea: e.linea,
            columna: e.columna,
            mensaje: e.mensaje
        };
    }

    /**
     * Convierte el valor recibido del navegador al tipo declarado del parametro.
     * Devuelve { valor } si tuvo exito o { error: true } si no.
     */
    _convertirTipo(valor, tipoDato) {
        if (valor === null || valor === undefined) {
            return { error: true };
        }
        switch (tipoDato) {
            case 'int': {
                const n = parseInt(valor, 10);
                if (isNaN(n)) return { error: true };
                return { valor: n };
            }
            case 'float': {
                const n = parseFloat(valor);
                if (isNaN(n)) return { error: true };
                return { valor: n };
            }
            case 'boolean': {
                if (typeof valor === 'boolean') return { valor: valor };
                if (valor === 'true' || valor === true) return { valor: true };
                if (valor === 'false' || valor === false) return { valor: false };
                return { error: true };
            }
            case 'string':
            case 'char':
                return { valor: String(valor) };
            case 'function':
                return { valor: String(valor) };
            default:
                return { valor: valor };
        }
    }

    /**
     * Sustituye $variable en una cadena SQL por los valores reales de la funcion.
     * - string => "valor con comillas"
     * - number/boolean => sin comillas
     */
    _sustituirVariables(sql, valores) {
        return sql.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, function (match, nombre) {
            if (!valores.has(nombre)) return match;
            const v = valores.get(nombre);
            if (typeof v === 'string') {
                return '"' + v.replace(/"/g, '\\"') + '"';
            }
            if (typeof v === 'boolean') {
                return v ? '1' : '0';  // SQLite usa 0/1
            }
            return String(v);
        });
    }

    _ejecutarSQL(sqlCrudo) {
        let codigo = sqlCrudo.trim();
        if (!codigo.endsWith(';')) codigo += ';';

        const generador = new GeneradorSQL();
        const resultado = generador.analizar(codigo, {
            ejecutar: true,
            proyecto: this.opciones.proyecto,
            rutaBaseProyectos: this.opciones.rutaBaseProyectos
        });

        if (!resultado.exito) {
            return {
                exito: false,
                mensaje: resultado.errores.map(function (e) { return e.mensaje; }).join('; ')
            };
        }

        const r = resultado.resultados[0];
        return { exito: true, mensaje: r ? r.mensaje : 'Sin resultado' };
    }
}

module.exports = InvocadorFuncionY;