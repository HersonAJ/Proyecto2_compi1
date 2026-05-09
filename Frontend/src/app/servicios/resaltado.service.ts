import { Injectable } from '@angular/core';

export type TipoToken =
    | 'reservada'      // morado
    | 'variable'       // blanco
    | 'cadena'         // naranja
    | 'literal'        // celeste (numeros, true, false)
    | 'operador'       // verde
    | 'agrupador'      // azul (llaves, corchetes, parentesis)
    | 'comentario'     // gris (extra, no en la rubrica pero se ve mejor)
    | 'normal';        // blanco por defecto

export interface TokenResaltado {
    texto: string;
    tipo: TipoToken;
}

export type Lenguaje = 'styles' | 'comp' | 'y' | 'plano';

@Injectable({ providedIn: 'root' })
export class ResaltadoService {
    // Palabras reservadas por lenguaje
    private readonly reservadasStyles = new Set([
        '@for', 'from', 'through', 'to', 'extends'
    ]);

    private readonly reservadasComp = new Set([
        'int', 'float', 'string', 'boolean', 'char', 'function',
        'T', 'IMG', 'FORM', 'INPUT_TEXT', 'INPUT_NUMBER', 'INPUT_BOOL', 'SUBMIT',
        'if', 'else', 'Switch', 'case', 'default',
        'for', 'each', 'track', 'empty',
        'true', 'false',
        'id', 'label', 'value'
    ]);

    private readonly reservadasY = new Set([
        'import', 'function', 'main', 'execute', 'load',
        'int', 'float', 'string', 'boolean', 'char',
        'if', 'else', 'switch', 'case', 'default',
        'while', 'do', 'for', 'break', 'continue',
        'true', 'True', 'false', 'False'
    ]);

    private readonly operadores = new Set([
        '+', '-', '*', '/', '%', '=', '<', '>',
        '<=', '>=', '==', '!=', '&&', '||', '!'
    ]);

    private readonly agrupadores = new Set([
        '{', '}', '[', ']', '(', ')', '[[', ']]'
    ]);

    /**
     * Tokeniza el codigo y devuelve una lista plana de tokens con su tipo.
     */
    tokenizar(codigo: string, lenguaje: Lenguaje): TokenResaltado[] {
        if (lenguaje === 'plano') {
            return [{ texto: codigo, tipo: 'normal' }];
        }

    let reservadas: Set<string>;
    if (lenguaje === 'styles') reservadas = this.reservadasStyles;
    else if (lenguaje === 'comp') reservadas = this.reservadasComp;
    else if (lenguaje === 'y') reservadas = this.reservadasY;
    else reservadas = new Set();
        const tokens: TokenResaltado[] = [];
        let i = 0;

        while (i < codigo.length) {
            const c = codigo[i];

            // Comentario /* ... */
            if (c === '/' && codigo[i + 1] === '*') {
                let j = i + 2;
                while (j < codigo.length && !(codigo[j] === '*' && codigo[j + 1] === '/')) {
                    j++;
                }
                j = Math.min(j + 2, codigo.length);
                tokens.push({ texto: codigo.substring(i, j), tipo: 'comentario' });
                i = j;
                continue;
            }

            // String "..."
            if (c === '"') {
                let j = i + 1;
                while (j < codigo.length && codigo[j] !== '"') {
                    if (codigo[j] === '\\' && j + 1 < codigo.length) j++;
                    j++;
                }
                j = Math.min(j + 1, codigo.length);
                tokens.push({ texto: codigo.substring(i, j), tipo: 'cadena' });
                i = j;
                continue;
            }

            // Variable $nombre
            if (c === '$') {
                let j = i + 1;
                while (j < codigo.length && /[a-zA-Z0-9_]/.test(codigo[j])) {
                    j++;
                }
                tokens.push({ texto: codigo.substring(i, j), tipo: 'variable' });
                i = j;
                continue;
            }

            // Numero (entero o decimal, con opcional %)
            if (/[0-9]/.test(c)) {
                let j = i;
                while (j < codigo.length && /[0-9]/.test(codigo[j])) j++;
                if (codigo[j] === '.' && /[0-9]/.test(codigo[j + 1])) {
                    j++;
                    while (j < codigo.length && /[0-9]/.test(codigo[j])) j++;
                }
                if (codigo[j] === '%') j++;
                tokens.push({ texto: codigo.substring(i, j), tipo: 'literal' });
                i = j;
                continue;
            }

            // Agrupadores dobles primero: [[ ]]
            if ((c === '[' && codigo[i + 1] === '[') || (c === ']' && codigo[i + 1] === ']')) {
                tokens.push({ texto: codigo.substring(i, i + 2), tipo: 'agrupador' });
                i += 2;
                continue;
            }

            // Agrupadores simples
            if (this.agrupadores.has(c)) {
                tokens.push({ texto: c, tipo: 'agrupador' });
                i++;
                continue;
            }

            // Operadores dobles primero: <= >= == != && ||
            const dosChars = codigo.substring(i, i + 2);
            if (this.operadores.has(dosChars)) {
                tokens.push({ texto: dosChars, tipo: 'operador' });
                i += 2;
                continue;
            }

            // Operadores simples
            if (this.operadores.has(c)) {
                tokens.push({ texto: c, tipo: 'operador' });
                i++;
                continue;
            }

            // @palabra (para @for)
            if (c === '@') {
                let j = i + 1;
                while (j < codigo.length && /[a-zA-Z]/.test(codigo[j])) j++;
                const palabra = codigo.substring(i, j);
                if (reservadas.has(palabra)) {
                    tokens.push({ texto: palabra, tipo: 'reservada' });
                } else {
                    tokens.push({ texto: palabra, tipo: 'normal' });
                }
                i = j;
                continue;
            }

            // Identificador o palabra reservada
            if (/[a-zA-Z_]/.test(c)) {
                let j = i;
                while (j < codigo.length && /[a-zA-Z0-9_\-]/.test(codigo[j])) j++;
                const palabra = codigo.substring(i, j);
                if (reservadas.has(palabra)) {
                    tokens.push({ texto: palabra, tipo: 'reservada' });
                } else if (palabra === 'true' || palabra === 'false') {
                    tokens.push({ texto: palabra, tipo: 'literal' });
                } else {
                    tokens.push({ texto: palabra, tipo: 'normal' });
                }
                i = j;
                continue;
            }

            // Cualquier otro caracter (espacios, saltos de linea, etc) lo agrupamos como normal
            let j = i;
            while (j < codigo.length && !this.esInicioToken(codigo[j])) {
                j++;
            }
            if (j === i) j = i + 1;  // garantia de avance
            tokens.push({ texto: codigo.substring(i, j), tipo: 'normal' });
            i = j;
        }

        return tokens;
    }

    private esInicioToken(c: string): boolean {
        return c === '/' || c === '"' || c === '$' || c === '@' ||
               /[a-zA-Z0-9_]/.test(c) ||
               this.agrupadores.has(c) ||
               this.operadores.has(c);
    }

    /**
     * Convierte una lista de tokens a HTML escapando caracteres especiales.
     */
    aHtml(tokens: TokenResaltado[]): string {
        return tokens.map(t => {
            const escapado = this.escaparHtml(t.texto);
            if (t.tipo === 'normal') return escapado;
            return `<span class="tok-${t.tipo}">${escapado}</span>`;
        }).join('');
    }

    private escaparHtml(texto: string): string {
        return texto
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}