%lex

%%

\s+                                         /* saltar espacios */
\/\*[\s\S]*?\*\/                            /* saltar comentarios de bloque */

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

\$[a-zA-Z_][a-zA-Z0-9_]*                   return 'VARIABLE';

[0-9]+(\.[0-9]+)?"%"                        return 'PORCENTAJE';
[0-9]+\.[0-9]+                              return 'DECIMAL';
[0-9]+                                      return 'ENTERO';

[a-zA-Z][a-zA-Z0-9]*(\-[a-zA-Z0-9]+)*      return 'IDENTIFICADOR';

"-"                                         return 'MENOS';

<<EOF>>                                     return 'EOF';
.                                           return 'DESCONOCIDO';

/lex

%start archivo

%%

archivo
    : definiciones EOF          { return $1; }
    ;

definiciones
    : definiciones definicion   { $1.push($2); $$ = $1; }
    |                           { $$ = []; }
    ;

definicion
    : estilo                    { $$ = $1; }
    | bucle_for                 { $$ = $1; }
    ;

estilo
    : IDENTIFICADOR LLAVE_IZQ propiedades LLAVE_DER
        { $$ = { tipo: 'estilo', nombre: $1, propiedades: $3, linea: @1.first_line }; }
    | IDENTIFICADOR EXTENDS IDENTIFICADOR LLAVE_IZQ propiedades LLAVE_DER
        { $$ = { tipo: 'estilo', nombre: $1, extiende: $3, propiedades: $5, linea: @1.first_line }; }
    ;

bucle_for
    : FOR_LOOP VARIABLE FROM ENTERO THROUGH ENTERO LLAVE_IZQ cuerpo_for LLAVE_DER
        { $$ = { tipo: 'bucle_for', variable: $2, desde: Number($4), hasta: Number($6), cuerpo: $8, linea: @1.first_line }; }
    ;

cuerpo_for
    : cuerpo_for estilo_for     { $1.push($2); $$ = $1; }
    |                           { $$ = []; }
    ;

estilo_for
    : nombre_for LLAVE_IZQ propiedades LLAVE_DER
        { $$ = { tipo: 'estilo', nombre: $1, propiedades: $3, linea: @1.first_line }; }
    ;

nombre_for
    : IDENTIFICADOR                         { $$ = $1; }
    | IDENTIFICADOR MENOS VARIABLE          { $$ = $1 + '-' + $3; }
    ;

propiedades
    : propiedades propiedad     { $1.push($2); $$ = $1; }
    |                           { $$ = []; }
    ;

propiedad
    : nombre_propiedad IGUAL valores PUNTO_COMA
        { $$ = { nombre: $1, valores: $3, linea: @1.first_line }; }
    ;

nombre_propiedad
    : IDENTIFICADOR
        { $$ = $1; }
    | IDENTIFICADOR IDENTIFICADOR
        { $$ = $1 + ' ' + $2; }
    | IDENTIFICADOR IDENTIFICADOR IDENTIFICADOR
        { $$ = $1 + ' ' + $2 + ' ' + $3; }
    ;

valores
    : valores valor_item        { $1.push($2); $$ = $1; }
    | valor_item                { $$ = [$1]; }
    ;

valor_item
    : ENTERO                    { $$ = { tipo: 'entero', valor: Number($1), linea: @1.first_line }; }
    | DECIMAL                   { $$ = { tipo: 'decimal', valor: parseFloat($1), linea: @1.first_line }; }
    | PORCENTAJE                { $$ = { tipo: 'porcentaje', valor: $1, linea: @1.first_line }; }
    | IDENTIFICADOR             { $$ = { tipo: 'identificador', valor: $1, linea: @1.first_line }; }
    | VARIABLE                  { $$ = { tipo: 'variable', valor: $1, linea: @1.first_line }; }
    | VARIABLE POR ENTERO       { $$ = { tipo: 'expresion', operador: '*', izq: $1, der: Number($3), linea: @1.first_line }; }
    | VARIABLE MAS ENTERO       { $$ = { tipo: 'expresion', operador: '+', izq: $1, der: Number($3), linea: @1.first_line }; }
    | VARIABLE MENOS ENTERO     { $$ = { tipo: 'expresion', operador: '-', izq: $1, der: Number($3), linea: @1.first_line }; }
    | VARIABLE DIVISION ENTERO  { $$ = { tipo: 'expresion', operador: '/', izq: $1, der: Number($3), linea: @1.first_line }; }
    ;