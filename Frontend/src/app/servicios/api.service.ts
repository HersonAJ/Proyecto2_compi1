import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { RespuestaAnalisisEstilos, RespuestaAnalisisComp } from "../modelos/respuesta-analisis.model";

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'http://localhost:3000/api';

    estado(): Observable<{ mensaje: string; estado: string}> {
        return this.http.get<{ mensaje: string; estado: string}>(`${this.baseUrl}/estado`);
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
}