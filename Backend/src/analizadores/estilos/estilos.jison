%{
    var erroresLexicos = [];
    var erroresSintacticos = [];
%}

%options locations

%lex
%%

\s+                                         /* saltar espacios */
\/\*[\s\S]*?\*\/                            /* comentarios de bloque */

"@for"                                      return 'FOR_LOOP';
"extends"                                   return 'EXTENDS';
"from"                                      return 'FROM';
"through"                                   return 'THROUGH';

"{"                                         return 'LLAVE_IZQ';
"}"                                         return 'LLAVE_DER';
"="                                         return 'IGUAL';
";"                                         return 'PUNTO_COMA';
"+"                                         return 'MAS';
"*"                                         return 'POR';
"/"                                         return 'DIVISION';
"("                                         return 'PAR_IZQ';
")"                                         return 'PAR_DER';
"-"                                         return 'MENOS';

\$[a-zA-Z_][a-zA-Z0-9_]*                   return 'VARIABLE';

[0-9]+(\.[0-9]+)?"%"                        return 'PORCENTAJE';
[0-9]+\.[0-9]+                              return 'DECIMAL';
[0-9]+                                      return 'ENTERO';

[a-zA-Z][a-zA-Z0-9]*(\-[a-zA-Z0-9]+)*      return 'IDENTIFICADOR';

<<EOF>>                                     return 'EOF';

.                                           return 'DESCONOCIDO';

/lex

%start archivo
%left MAS MENOS
%left POR DIVISION

%%

archivo
    : definiciones EOF {
        $$ = {
            definiciones: $1,
            erroresLexicos: erroresLexicos,
            erroresSintacticos: erroresSintacticos
        };
        erroresLexicos = [];
        erroresSintacticos = [];
        return $$;
    }
;
definiciones
    : definiciones definicion {
        $1.push($2);
        $$ = $1;
    }
    | {
        $$ = [];
    }
;

definicion
    : estilo
    | bucle_for
;

estilo
    : IDENTIFICADOR LLAVE_IZQ propiedades LLAVE_DER {
        $$ = {
            tipo: 'estilo',
            nombre: $1,
            propiedades: $3,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }

    | IDENTIFICADOR EXTENDS IDENTIFICADOR LLAVE_IZQ propiedades LLAVE_DER {
        $$ = {
            tipo: 'estilo',
            nombre: $1,
            extiende: $3,
            propiedades: $5,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
;

bucle_for
    : FOR_LOOP VARIABLE FROM ENTERO THROUGH ENTERO LLAVE_IZQ cuerpo_for LLAVE_DER {
        $$ = {
            tipo: 'bucle_for',
            variable: $2,
            desde: Number($4),
            hasta: Number($6),
            cuerpo: $8,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
;

cuerpo_for
    : cuerpo_for estilo_for {
        $1.push($2);
        $$ = $1;
    }
    | {
        $$ = [];
    }
;

estilo_for
    : nombre_for LLAVE_IZQ propiedades LLAVE_DER {
        $$ = {
            tipo: 'estilo',
            nombre: $1,
            propiedades: $3,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
;

nombre_for
    : IDENTIFICADOR {
        $$ = $1;
    }
    | IDENTIFICADOR MENOS VARIABLE {
        $$ = $1 + '-' + $3;
    }
    | VARIABLE MENOS IDENTIFICADOR {
        $$ = $1 + '-' + $3;
    }
;

propiedades
    : lista_propiedades {
        $$ = $1;
    }
    | {
        $$ = [];
    }
;

lista_propiedades
    : lista_propiedades propiedad {
        $1.push($2);
        $$ = $1;
    }
    | propiedad {
        $$ = [$1];
    }
;

propiedad
    : nombre_propiedad IGUAL valores PUNTO_COMA {
        $$ = {
            nombre: $1,
            valores: $3,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
;

nombre_propiedad
    : lista_identificadores {
        $$ = $1.join(' ');
    }
;

lista_identificadores
    : lista_identificadores IDENTIFICADOR {
        $1.push($2);
        $$ = $1;
    }
    | IDENTIFICADOR {
        $$ = [$1];
    }
;

valores
    : valores valor_item {
        $1.push($2);
        $$ = $1;
    }
    | valor_item {
        $$ = [$1];
    }
;

valor_item
    : expresion {
        $$ = {
            tipo: 'expresion',
            valor: $1,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
    | DECIMAL {
        $$ = {
            tipo: 'decimal',
            valor: parseFloat($1),
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
    | PORCENTAJE {
        $$ = {
            tipo: 'porcentaje',
            valor: $1,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
    | IDENTIFICADOR {
        $$ = {
            tipo: 'identificador',
            valor: $1,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
;

expresion
    : VARIABLE { $$ = { tipo: 'variable', valor: $1 }; }
    | ENTERO { $$ = { tipo: 'entero', valor: Number($1) }; }
    | expresion MAS expresion { $$ = { tipo: 'binaria', operador: '+', izq: $1, der: $3 }; }
    | expresion MENOS expresion { $$ = { tipo: 'binaria', operador: '-', izq: $1, der: $3 }; }
    | expresion POR expresion { $$ = { tipo: 'binaria', operador: '*', izq: $1, der: $3 }; }
    | expresion DIVISION expresion { $$ = { tipo: 'binaria', operador: '/', izq: $1, der: $3 }; }
    | PAR_IZQ expresion PAR_DER { $$ = $2; }
;