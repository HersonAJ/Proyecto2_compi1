const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const ErrorYFERA = require('../errores/ErrorYFERA');

class EjecutorSQL {

    constructor(opciones) {
        this.opciones = opciones || {};
        this.db = null;
        this.errores = [];
    }

    //Abre/crea la BD del proyecto
    _abrirBD() {
        if (this.db) return this.db;
        if (!this.opciones.proyecto || !this.opciones.rutaBaseProyectos) {
            throw new Error('No se puede abrir la BD sin proyecto y rutaBaseProyectos');
        }
        const rutaProyecto = path.join(this.opciones.rutaBaseProyectos, this.opciones.proyecto);
        if (!fs.existsSync(rutaProyecto)) {
            throw new Error('El proyecto no existe: ' + this.opciones.proyecto);
        }
        const rutaBD = path.join(rutaProyecto, 'database.db');
        this.db = new Database(rutaBD);
        return this.db;
    }

    cerrar() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    /**
     Ejecuta una lista de sentencias (AST). Devuelve un array de resultados uno por sentencia ejecutada con exito Si una falla, se detiene y reporta el error
     */
    ejecutar(ast) {
        if (!Array.isArray(ast) || ast.length === 0) {
            return { resultados: [], errores: [] };
        }

        const resultados = [];
        try {
            this._abrirBD();

            for (let i = 0; i < ast.length; i++) {
                const s = ast[i];
                const r = this._ejecutarSentencia(s);
                if (r.error) {
                    this.errores.push(r.error);
                    break; // Detener al primer error
                }
                resultados.push(r);
            }
        } catch (e) {
            this.errores.push(new ErrorYFERA(
                'Semantico',
                'sql',
                0,
                0,
                'Error al abrir la BD del proyecto: ' + e.message
            ));
        } finally {
            this.cerrar();
        }

        return { resultados: resultados, errores: this.errores };
    }

    _ejecutarSentencia(s) {
        switch (s.tipo) {
            case 'create_table': return this._createTable(s);
            case 'select':       return this._select(s);
            case 'insert':       return this._insert(s);
            case 'update':       return this._update(s);
            case 'delete':       return this._delete(s);
            default:
                return {
                    error: new ErrorYFERA(
                        'Semantico', s.tipo, s.linea || 0, s.columna_pos || 0,
                        'Tipo de sentencia desconocido: ' + s.tipo
                    )
                };
        }
    }

    _createTable(s) {
        // Validar nombres unicos de columnas
        const vistas = new Set();
        for (let i = 0; i < s.columnas.length; i++) {
            const c = s.columnas[i];
            if (c.nombre === 'id') {
                return {
                    error: new ErrorYFERA(
                        'Semantico', s.tabla, s.linea, c.columna,
                        'No se puede declarar la columna "id" porque ya es generada automaticamente'
                    )
                };
            }
            if (vistas.has(c.nombre)) {
                return {
                    error: new ErrorYFERA(
                        'Semantico', s.tabla, s.linea, c.columna,
                        'La columna "' + c.nombre + '" esta duplicada en la tabla "' + s.tabla + '"'
                    )
                };
            }
            vistas.add(c.nombre);
        }

        // Construir SQL: id INTEGER PRIMARY KEY AUTOINCREMENT, columnas...
        const partes = ['id INTEGER PRIMARY KEY AUTOINCREMENT'];
        for (let i = 0; i < s.columnas.length; i++) {
            partes.push('"' + s.columnas[i].nombre + '" ' + this._mapearTipoSqlite(s.columnas[i].tipoDato));
        }
        const sqlCrear = 'CREATE TABLE IF NOT EXISTS "' + s.tabla + '" (' + partes.join(', ') + ')';

        try {
            this.db.exec(sqlCrear);
            return {
                tipo: 'create_table',
                tabla: s.tabla,
                mensaje: 'Tabla "' + s.tabla + '" creada (o ya existia)'
            };
        } catch (e) {
            return {
                error: new ErrorYFERA(
                    'Semantico', s.tabla, s.linea, s.columna,
                    'Error al crear la tabla "' + s.tabla + '": ' + e.message
                )
            };
        }
    }

    _mapearTipoSqlite(tipo) {
        switch (tipo) {
            case 'int':     return 'INTEGER';
            case 'float':   return 'REAL';
            case 'string':  return 'TEXT';
            case 'char':    return 'TEXT';
            case 'boolean': return 'INTEGER';  //integer porque sqlite no tiene boolean nativo
            default:        return 'TEXT';
        }
    }

    _verificarTablaExiste(nombre) {
        const r = this.db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
        ).get(nombre);
        return Boolean(r);
    }

    _verificarColumnaExiste(tabla, columna) {
        const cols = this.db.prepare('PRAGMA table_info("' + tabla + '")').all();
        return cols.some(function (c) { return c.name === columna; });
    }

    _select(s) {
        if (!this._verificarTablaExiste(s.tabla)) {
            return {
                error: new ErrorYFERA(
                    'Semantico', s.tabla, s.linea, s.columna_pos,
                    'La tabla "' + s.tabla + '" no existe'
                )
            };
        }
        if (!this._verificarColumnaExiste(s.tabla, s.columna)) {
            return {
                error: new ErrorYFERA(
                    'Semantico', s.columna, s.linea, s.columna_pos,
                    'La columna "' + s.columna + '" no existe en la tabla "' + s.tabla + '"'
                )
            };
        }

        try {
            const filas = this.db.prepare(
                'SELECT "' + s.columna + '" FROM "' + s.tabla + '"'
            ).all();
            const valores = filas.map(function (f) { return f[s.columna]; });
            return {
                tipo: 'select',
                tabla: s.tabla,
                columna: s.columna,
                valores: valores,
                mensaje: 'SELECT devolvio ' + valores.length + ' fila(s)'
            };
        } catch (e) {
            return {
                error: new ErrorYFERA(
                    'Semantico', s.tabla, s.linea, s.columna_pos,
                    'Error en SELECT: ' + e.message
                )
            };
        }
    }

    _insert(s) {
        if (!this._verificarTablaExiste(s.tabla)) {
            return {
                error: new ErrorYFERA(
                    'Semantico', s.tabla, s.linea, s.columna_pos,
                    'La tabla "' + s.tabla + '" no existe'
                )
            };
        }

        // Verificar que cada columna asignada existe
        for (let i = 0; i < s.asignaciones.length; i++) {
            const a = s.asignaciones[i];
            if (!this._verificarColumnaExiste(s.tabla, a.columna)) {
                return {
                    error: new ErrorYFERA(
                        'Semantico', a.columna, s.linea, a.columna_pos,
                        'La columna "' + a.columna + '" no existe en la tabla "' + s.tabla + '"'
                    )
                };
            }
        }

        const cols = s.asignaciones.map(function (a) { return '"' + a.columna + '"'; });
        const placeholders = s.asignaciones.map(function () { return '?'; });
        const valores = s.asignaciones.map(function (a) {
            return a.valor.tipo === 'boolean' ? (a.valor.valor ? 1 : 0) : a.valor.valor;
        });

        try {
            const stmt = this.db.prepare(
                'INSERT INTO "' + s.tabla + '" (' + cols.join(', ') + ') VALUES (' + placeholders.join(', ') + ')'
            );
            const info = stmt.run(valores);
            return {
                tipo: 'insert',
                tabla: s.tabla,
                idInsertado: info.lastInsertRowid,
                mensaje: 'INSERT en "' + s.tabla + '" con id ' + info.lastInsertRowid
            };
        } catch (e) {
            return {
                error: new ErrorYFERA(
                    'Semantico', s.tabla, s.linea, s.columna_pos,
                    'Error en INSERT: ' + e.message
                )
            };
        }
    }

    _update(s) {
        if (!this._verificarTablaExiste(s.tabla)) {
            return {
                error: new ErrorYFERA(
                    'Semantico', s.tabla, s.linea, s.columna_pos,
                    'La tabla "' + s.tabla + '" no existe'
                )
            };
        }

        for (let i = 0; i < s.asignaciones.length; i++) {
            const a = s.asignaciones[i];
            if (!this._verificarColumnaExiste(s.tabla, a.columna)) {
                return {
                    error: new ErrorYFERA(
                        'Semantico', a.columna, s.linea, a.columna_pos,
                        'La columna "' + a.columna + '" no existe en la tabla "' + s.tabla + '"'
                    )
                };
            }
        }

        const sets = s.asignaciones.map(function (a) { return '"' + a.columna + '" = ?'; });
        const valores = s.asignaciones.map(function (a) {
            return a.valor.tipo === 'boolean' ? (a.valor.valor ? 1 : 0) : a.valor.valor;
        });
        valores.push(s.id);

        try {
            const stmt = this.db.prepare(
                'UPDATE "' + s.tabla + '" SET ' + sets.join(', ') + ' WHERE id = ?'
            );
            const info = stmt.run(valores);
            if (info.changes === 0) {
                return {
                    tipo: 'update',
                    tabla: s.tabla,
                    filasAfectadas: 0,
                    mensaje: 'UPDATE no afecto filas (id ' + s.id + ' no existe)'
                };
            }
            return {
                tipo: 'update',
                tabla: s.tabla,
                filasAfectadas: info.changes,
                mensaje: 'UPDATE afecto ' + info.changes + ' fila(s)'
            };
        } catch (e) {
            return {
                error: new ErrorYFERA(
                    'Semantico', s.tabla, s.linea, s.columna_pos,
                    'Error en UPDATE: ' + e.message
                )
            };
        }
    }

    _delete(s) {
        if (!this._verificarTablaExiste(s.tabla)) {
            return {
                error: new ErrorYFERA(
                    'Semantico', s.tabla, s.linea, s.columna_pos,
                    'La tabla "' + s.tabla + '" no existe'
                )
            };
        }

        try {
            const stmt = this.db.prepare('DELETE FROM "' + s.tabla + '" WHERE id = ?');
            const info = stmt.run(s.id);
            if (info.changes === 0) {
                return {
                    tipo: 'delete',
                    tabla: s.tabla,
                    filasAfectadas: 0,
                    mensaje: 'DELETE no afecto filas (id ' + s.id + ' no existe)'
                };
            }
            return {
                tipo: 'delete',
                tabla: s.tabla,
                filasAfectadas: info.changes,
                mensaje: 'DELETE afecto ' + info.changes + ' fila(s)'
            };
        } catch (e) {
            return {
                error: new ErrorYFERA(
                    'Semantico', s.tabla, s.linea, s.columna_pos,
                    'Error en DELETE: ' + e.message
                )
            };
        }
    }
}

module.exports = EjecutorSQL;