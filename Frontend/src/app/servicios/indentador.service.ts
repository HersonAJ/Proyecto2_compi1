import { Injectable } from '@angular/core';
import { Lenguaje } from './resaltado.service';

@Injectable({ providedIn: 'root' })
export class IndentadorService {
    /**
     * Re-indenta el codigo segun la profundidad de llaves, corchetes y parentesis.
     * Funciona para todos los lenguajes porque solo se basa en simbolos
     * de agrupacion comunes ({ } [ ] ( )).
     */
    indentar(codigo: string, lenguaje: Lenguaje): string {
        const TAB = '    '; // 4 espacios
        const lineas = codigo.split('\n');
        const resultado: string[] = [];
        let nivel = 0;

        for (let i = 0; i < lineas.length; i++) {
            const lineaCruda = lineas[i];
            const lineaSinIndentar = lineaCruda.trim();

            if (lineaSinIndentar === '') {
                resultado.push('');
                continue;
            }

            // Si la linea EMPIEZA con cierre, baja nivel ANTES de indentar
            const empiezaConCierre = /^[\}\]\)]/.test(lineaSinIndentar);
            if (empiezaConCierre) {
                nivel = Math.max(0, nivel - 1);
            }

            resultado.push(TAB.repeat(nivel) + lineaSinIndentar);

            // Contar aperturas/cierres NETOS de esta linea 
            const balance = this._calcularBalanceLinea(lineaSinIndentar, empiezaConCierre);
            nivel = Math.max(0, nivel + balance);
        }

        return resultado.join('\n');
    }

    /**
     * Devuelve el balance neto de aperturas vs cierres en la linea,
     * ignorando los que estan dentro de strings o comentarios.
     * Si la linea ya empezaba con cierre, no contamos ese primer cierre dos veces.
     */
    private _calcularBalanceLinea(linea: string, yaContamosPrimerCierre: boolean): number {
        let balance = 0;
        let enString = false;
        let charString = '';
        let enComentario = false;
        let yaSeIgnoroPrimerCierre = !yaContamosPrimerCierre;

        for (let i = 0; i < linea.length; i++) {
            const c = linea[i];
            const siguiente = linea[i + 1];

            // Comentario multilinea 
            if (!enString && !enComentario && c === '/' && siguiente === '*') {
                enComentario = true;
                i++;
                continue;
            }
            if (enComentario && c === '*' && siguiente === '/') {
                enComentario = false;
                i++;
                continue;
            }
            if (enComentario) continue;

            // Comentario de linea: ignorar resto
            if (!enString && c === '#') break;
            if (!enString && c === '/' && siguiente === '/') break;

            // Strings
            if (!enString && (c === '"' || c === "'" || c === '`')) {
                enString = true;
                charString = c;
                continue;
            }
            if (enString && c === charString && linea[i - 1] !== '\\') {
                enString = false;
                continue;
            }
            if (enString) continue;

            // Aperturas y cierres
            if (c === '{' || c === '[' || c === '(') {
                balance++;
            } else if (c === '}' || c === ']' || c === ')') {
                if (!yaSeIgnoroPrimerCierre) {
                    yaSeIgnoroPrimerCierre = true;
                    continue;
                }
                balance--;
            }
        }

        return balance;
    }
}