import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RespuestaAnalisisEstilos, RespuestaAnalisisComp, RespuestaAnalisisY, RespuestaEjecucionSQL} from '../modelos/respuesta-analisis.model';
import { NodoArbol } from '../modelos/arbol.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'http://localhost:3000/api';

    estado(): Observable<{ mensaje: string; estado: string }> {
        return this.http.get<{ mensaje: string; estado: string }>(`${this.baseUrl}/estado`);
    }

    analizarEstilos(codigo: string): Observable<RespuestaAnalisisEstilos> {
        return this.http.post<RespuestaAnalisisEstilos>(
            `${this.baseUrl}/estilos/analizar`,
            { codigo }
        );
    }

    analizarComp(codigo: string): Observable<RespuestaAnalisisComp> {
        return this.http.post<RespuestaAnalisisComp>(
            `${this.baseUrl}/comp/analizar`,
            { codigo }
        );
    }

    analizarY(codigo: string, proyecto: string | null, rutaArchivo: string | null): Observable<RespuestaAnalisisY> {
        return this.http.post<RespuestaAnalisisY>(
            `${this.baseUrl}/y/analizar`,
            { codigo, proyecto, rutaArchivo }
        );
    }

    /* ============== Workspace: proyectos ============== */

    listarProyectos(): Observable<{ proyectos: string[] }> {
        return this.http.get<{ proyectos: string[] }>(`${this.baseUrl}/workspace/proyectos`);
    }

    crearProyecto(nombre: string): Observable<{ ok: boolean; nombre: string }> {
        return this.http.post<{ ok: boolean; nombre: string }>(
            `${this.baseUrl}/workspace/proyectos`,
            { nombre }
        );
    }

    eliminarProyecto(nombre: string): Observable<{ ok: boolean }> {
        return this.http.delete<{ ok: boolean }>(
            `${this.baseUrl}/workspace/proyectos`,
            { body: { nombre } }
        );
    }

    /* ============== Workspace: archivos ============== */

    listarArchivos(proyecto: string): Observable<{ arbol: NodoArbol }> {
        return this.http.get<{ arbol: NodoArbol }>(
            `${this.baseUrl}/workspace/archivos`,
            { params: { proyecto } }
        );
    }

    leerArchivo(proyecto: string, ruta: string): Observable<{ proyecto: string; ruta: string; contenido: string }> {
        return this.http.get<{ proyecto: string; ruta: string; contenido: string }>(
            `${this.baseUrl}/workspace/leer`,
            { params: { proyecto, ruta } }
        );
    }

    guardarArchivo(proyecto: string, ruta: string, contenido: string): Observable<{ ok: boolean }> {
        return this.http.post<{ ok: boolean }>(
            `${this.baseUrl}/workspace/guardar`,
            { proyecto, ruta, contenido }
        );
    }

    crearCarpeta(proyecto: string, ruta: string): Observable<{ ok: boolean }> {
        return this.http.post<{ ok: boolean }>(
            `${this.baseUrl}/workspace/crear-carpeta`,
            { proyecto, ruta }
        );
    }

    eliminarArchivoOCarpeta(proyecto: string, ruta: string): Observable<{ ok: boolean }> {
        return this.http.post<{ ok: boolean }>(
            `${this.baseUrl}/workspace/eliminar`,
            { proyecto, ruta }
        );
    }
    /* ============== SQL ============== */

    ejecutarSQL(codigo: string, proyecto: string): Observable<RespuestaEjecucionSQL> {
        return this.http.post<RespuestaEjecucionSQL>(
            `${this.baseUrl}/sql/ejecutar`,
            { codigo, proyecto }
        );
    }
}