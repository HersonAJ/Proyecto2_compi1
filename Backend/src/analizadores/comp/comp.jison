%{
    const ErrorYFERA = require('../errores/ErrorYFERA');

    let erroresLexicos = [];
    let erroresSintacticos = [];

    if (typeof exports !== 'undefined') {
        exports.reiniciarErrores = function () {
            erroresLexicos = [];
            erroresSintacticos = [];
        };
        exports.obtenerErrores = function () {
            return {
                lexicos: erroresLexicos,
                sintacticos: erroresSintacticos
            };
        };
    }
%}

/* ============================ LEXER ============================ */

%lex
%options case-sensitive

%x string

%%

\s+                                              /* ignorar espacios */
"/*"([^*]|\*+[^*/])*\*+"/"                       /* comentario multilinea */

"T"                         return 'T';
"IMG"                       return 'IMG';
"int"                       return 'INT';
"float"                     return 'FLOAT';
"string"                    return 'STRING_T';
"boolean"                   return 'BOOLEAN';
"char"                      return 'CHAR';
"function"                  return 'FUNCTION';

"[["                        return 'COR_DOBLE_IZQ';
"]]"                        return 'COR_DOBLE_DER';
"["                         return 'COR_IZQ';
"]"                         return 'COR_DER';
"("                         return 'PAR_IZQ';
")"                         return 'PAR_DER';
"{"                         return 'LLAVE_IZQ';
"}"                         return 'LLAVE_DER';
">="                        return 'MAYOR_IGUAL';
"<="                        return 'MENOR_IGUAL';
"=="                        return 'IGUAL_IGUAL';
"!="                        return 'DIFERENTE';
"&&"                        return 'AND';
"||"                        return 'OR';
"<"                         return 'MENOR';
">"                         return 'MAYOR';
","                         return 'COMA';
";"                         return 'PUNTO_COMA';
":"                         return 'DOS_PUNTOS';

"+"                         return 'MAS';
"-"                         return 'MENOS';
"*"                         return 'POR';
"/"                         return 'DIVIDIDO';
"%"                         return 'MODULO';
"!"                         return 'NEGACION';
"="                         return 'IGUAL';

"if"                        return 'IF';
"else"                      return 'ELSE';
"Switch"                    return 'SWITCH';
"case"                      return 'CASE';
"default"                   return 'DEFAULT';
"for"                       return 'FOR';
"each"                      return 'EACH';
"track"                     return 'TRACK';
"empty"                     return 'EMPTY';

"FORM"                      return 'FORM';
"INPUT_TEXT"                return 'INPUT_TEXT';
"INPUT_NUMBER"              return 'INPUT_NUMBER';
"INPUT_BOOL"                return 'INPUT_BOOL';
"SUBMIT"                    return 'SUBMIT';
"true"                      return 'TRUE';
"false"                     return 'FALSE';
"id"                        return 'ID_PROP';
"label"                     return 'LABEL_PROP';
"value"                     return 'VALUE_PROP';
"function"                  return 'FUNCTION';

[0-9]+("."[0-9]+)?          return 'NUMERO';
"@"[a-zA-Z_][a-zA-Z0-9_]*   return 'REFERENCIA';
\$[a-zA-Z_][a-zA-Z0-9_]*    return 'VARIABLE';
[a-zA-Z_][a-zA-Z0-9_\-]*    return 'IDENTIFICADOR';

\"                          { yy.cadena = ''; yy.cadenaInicio = { linea: yylloc.first_line, columna: yylloc.first_column + 1 }; this.begin('string'); }
<string>\"                  { this.popState(); yytext = yy.cadena; yylloc.first_line = yy.cadenaInicio.linea; yylloc.first_column = yy.cadenaInicio.columna - 1; return 'CADENA'; }
<string>\\\"                { yy.cadena += '"'; }
<string>[^\"]               { yy.cadena += yytext; }

<<EOF>>                     return 'EOF';

.                           {
                                erroresLexicos.push(
                                    new ErrorYFERA(
                                        'Lexico',
                                        yytext,
                                        yylloc.first_line,
                                        yylloc.first_column + 1,
                                        'Caracter no reconocido: "' + yytext + '"'
                                    )
                                );
                            }

/lex

/* ============================ PARSER ============================ */

%start programa

%%

programa
    : lista_componentes EOF     { return $1; }
    | EOF                       { return []; }
    | expresion EOF             { return { tipo: 'modo_expresion', expresion: $1 }; }
    ;

lista_componentes
    : lista_componentes componente
        {
            if ($2 !== null) $1.push($2);
            $$ = $1;
        }
    | componente
        { $$ = $1 !== null ? [$1] : []; }
    ;

componente
    : IDENTIFICADOR PAR_IZQ parametros_opt PAR_DER LLAVE_IZQ elementos_opt LLAVE_DER
        {
            $$ = {
                tipo: 'componente',
                nombre: $1,
                parametros: $3,
                elementos: $6,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

parametros_opt
    : parametros        { $$ = $1; }
    |                   { $$ = []; }
    ;

parametros
    : parametros COMA parametro
        { $1.push($3); $$ = $1; }
    | parametro
        { $$ = [$1]; }
    ;

parametro
    : tipo IDENTIFICADOR
        {
            $$ = {
                tipoDato: $1,
                nombre: $2,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | tipo VARIABLE
        {
            $$ = {
                tipoDato: $1,
                nombre: $2.substring(1),
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

tipo
    : INT       { $$ = 'int'; }
    | FLOAT     { $$ = 'float'; }
    | STRING_T  { $$ = 'string'; }
    | BOOLEAN   { $$ = 'boolean'; }
    | CHAR      { $$ = 'char'; }
    | FUNCTION  { $$ = 'function'; }
    ;

elementos_opt
    : elementos     { $$ = $1; }
    |               { $$ = []; }
    ;

elementos
    : elementos elemento
        {
            if ($2 !== null) $1.push($2);
            $$ = $1;
        }
    | elemento
        { $$ = $1 !== null ? [$1] : []; }
    ;

elemento
    : seccion       { $$ = $1; }
    | tabla_elem    { $$ = $1; }
    | texto         { $$ = $1; }
    | imagen        { $$ = $1; }
    | formulario    { $$ = $1; }
    | input_elem    { $$ = $1; }
    | bloque_logico { $$ = $1; }
    ;

seccion
    : COR_IZQ elementos_opt COR_DER
        {
            $$ = {
                tipo: 'seccion',
                estilos: [],
                elementos: $2,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | MENOR lista_estilos MAYOR COR_IZQ elementos_opt COR_DER
        {
            $$ = {
                tipo: 'seccion',
                estilos: $2,
                elementos: $5,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

lista_estilos
    : lista_estilos COMA IDENTIFICADOR
        { $1.push($3); $$ = $1; }
    | IDENTIFICADOR
        { $$ = [$1]; }
    ;

tabla_elem
    : COR_DOBLE_IZQ elementos_opt COR_DOBLE_DER
        {
            $$ = {
                tipo: 'tabla',
                estilos: [],
                elementos: $2,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | MENOR lista_estilos MAYOR COR_DOBLE_IZQ elementos_opt COR_DOBLE_DER
        {
            $$ = {
                tipo: 'tabla',
                estilos: $2,
                elementos: $5,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

texto
    : T PAR_IZQ CADENA PAR_DER
        {
            $$ = {
                tipo: 'texto',
                estilos: [],
                contenido: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | T MENOR lista_estilos MAYOR PAR_IZQ CADENA PAR_DER
        {
            $$ = {
                tipo: 'texto',
                estilos: $3,
                contenido: $6,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

imagen
    : IMG PAR_IZQ lista_urls PAR_DER
        {
            $$ = {
                tipo: 'imagen',
                estilos: [],
                urls: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | IMG MENOR lista_estilos MAYOR PAR_IZQ lista_urls PAR_DER
        {
            $$ = {
                tipo: 'imagen',
                estilos: $3,
                urls: $6,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

lista_urls
    : lista_urls COMA url_item
        { $1.push($3); $$ = $1; }
    | url_item
        { $$ = [$1]; }
    ;

url_item
    : CADENA        { $$ = { tipo: 'literal', valor: $1 }; }
    | VARIABLE      { $$ = { tipo: 'variable', valor: $1.substring(1) }; }
    ;

formulario
    : FORM LLAVE_IZQ elementos_opt LLAVE_DER submit_opt
        {
            $$ = {
                tipo: 'formulario',
                estilos: [],
                elementos: $3,
                submit: $5,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | FORM MENOR lista_estilos MAYOR LLAVE_IZQ elementos_opt LLAVE_DER submit_opt
        {
            $$ = {
                tipo: 'formulario',
                estilos: $3,
                elementos: $6,
                submit: $8,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

submit_opt
    : submit        { $$ = $1; }
    |               { $$ = null; }
    ;

submit
    : SUBMIT LLAVE_IZQ propiedades_submit LLAVE_DER
        {
            $$ = {
                tipo: 'submit',
                estilos: [],
                propiedades: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | SUBMIT MENOR lista_estilos MAYOR LLAVE_IZQ propiedades_submit LLAVE_DER
        {
            $$ = {
                tipo: 'submit',
                estilos: $3,
                propiedades: $6,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

propiedades_submit
    : propiedades_submit COMA propiedad_submit
        { $1.push($3); $$ = $1; }
    | propiedad_submit
        { $$ = [$1]; }
    ;

propiedad_submit
    : LABEL_PROP DOS_PUNTOS CADENA
        {
            $$ = {
                clave: 'label',
                valor: { tipo: 'literal', valor: $3 },
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | FUNCTION DOS_PUNTOS llamada_funcion
        {
            $$ = {
                clave: 'function',
                valor: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

llamada_funcion
    : VARIABLE PAR_IZQ argumentos_opt PAR_DER
        {
            $$ = {
                tipo: 'llamada_funcion',
                nombre: $1.substring(1),
                argumentos: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

argumentos_opt
    : argumentos        { $$ = $1; }
    |                   { $$ = []; }
    ;

argumentos
    : argumentos COMA argumento
        { $1.push($3); $$ = $1; }
    | argumento
        { $$ = [$1]; }
    ;

argumento
    : REFERENCIA    { $$ = { tipo: 'referencia', valor: $1.substring(1) }; }
    | VARIABLE      { $$ = { tipo: 'variable', valor: $1.substring(1) }; }
    | CADENA        { $$ = { tipo: 'literal', valor: $1 }; }
    | NUMERO        { $$ = { tipo: 'numero', valor: parseFloat($1) }; }
    ;

input_elem
    : INPUT_TEXT PAR_IZQ propiedades_input PAR_DER
        {
            $$ = {
                tipo: 'input',
                subtipo: 'text',
                estilos: [],
                propiedades: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | INPUT_TEXT MENOR lista_estilos MAYOR PAR_IZQ propiedades_input PAR_DER
        {
            $$ = {
                tipo: 'input',
                subtipo: 'text',
                estilos: $3,
                propiedades: $6,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | INPUT_NUMBER PAR_IZQ propiedades_input PAR_DER
        {
            $$ = {
                tipo: 'input',
                subtipo: 'number',
                estilos: [],
                propiedades: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | INPUT_NUMBER MENOR lista_estilos MAYOR PAR_IZQ propiedades_input PAR_DER
        {
            $$ = {
                tipo: 'input',
                subtipo: 'number',
                estilos: $3,
                propiedades: $6,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | INPUT_BOOL PAR_IZQ propiedades_input PAR_DER
        {
            $$ = {
                tipo: 'input',
                subtipo: 'bool',
                estilos: [],
                propiedades: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | INPUT_BOOL MENOR lista_estilos MAYOR PAR_IZQ propiedades_input PAR_DER
        {
            $$ = {
                tipo: 'input',
                subtipo: 'bool',
                estilos: $3,
                propiedades: $6,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

propiedades_input
    : propiedades_input COMA propiedad_input
        { $1.push($3); $$ = $1; }
    | propiedad_input
        { $$ = [$1]; }
    ;

propiedad_input
    : ID_PROP DOS_PUNTOS valor_input
        { $$ = { clave: 'id', valor: $3 }; }
    | LABEL_PROP DOS_PUNTOS valor_input
        { $$ = { clave: 'label', valor: $3 }; }
    | VALUE_PROP DOS_PUNTOS valor_input
        { $$ = { clave: 'value', valor: $3 }; }
    ;

valor_input
    : CADENA        { $$ = { tipo: 'literal', valor: $1 }; }
    | NUMERO        { $$ = { tipo: 'numero', valor: parseFloat($1) }; }
    | TRUE          { $$ = { tipo: 'booleano', valor: true }; }
    | FALSE         { $$ = { tipo: 'booleano', valor: false }; }
    | VARIABLE      { $$ = { tipo: 'variable', valor: $1.substring(1) }; }
    ;

expresion
    : expresion OR expresion_and
        { $$ = { tipo: 'or', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_and
        { $$ = $1; }
    ;

expresion_and
    : expresion_and AND expresion_negacion
        { $$ = { tipo: 'and', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_negacion
        { $$ = $1; }
    ;

expresion_negacion
    : NEGACION expresion_negacion
        { $$ = { tipo: 'negacion', operando: $2, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_comparacion
        { $$ = $1; }
    ;

expresion_comparacion
    : expresion_aritmetica MAYOR expresion_aritmetica
        { $$ = { tipo: 'mayor', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_aritmetica MAYOR_IGUAL expresion_aritmetica
        { $$ = { tipo: 'mayor_igual', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_aritmetica MENOR expresion_aritmetica
        { $$ = { tipo: 'menor', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_aritmetica MENOR_IGUAL expresion_aritmetica
        { $$ = { tipo: 'menor_igual', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_aritmetica IGUAL_IGUAL expresion_aritmetica
        { $$ = { tipo: 'igual_igual', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_aritmetica DIFERENTE expresion_aritmetica
        { $$ = { tipo: 'diferente', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_aritmetica
        { $$ = $1; }
    ;

expresion_aritmetica
    : expresion_aritmetica MAS expresion_termino
        { $$ = { tipo: 'suma', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_aritmetica MENOS expresion_termino
        { $$ = { tipo: 'resta', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_termino
        { $$ = $1; }
    ;

expresion_termino
    : expresion_termino POR expresion_modulo
        { $$ = { tipo: 'multiplicacion', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_termino DIVIDIDO expresion_modulo
        { $$ = { tipo: 'division', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_modulo
        { $$ = $1; }
    ;

expresion_modulo
    : expresion_modulo MODULO expresion_unaria
        { $$ = { tipo: 'modulo', izq: $1, der: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_unaria
        { $$ = $1; }
    ;

expresion_unaria
    : MENOS expresion_unaria
        { $$ = { tipo: 'menos_unario', operando: $2, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | expresion_primaria
        { $$ = $1; }
    ;

expresion_primaria
    : NUMERO
        { $$ = { tipo: 'numero', valor: parseFloat($1), linea: @1.first_line, columna: @1.first_column + 1 }; }
    | CADENA
        { $$ = { tipo: 'cadena', valor: $1, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | TRUE
        { $$ = { tipo: 'booleano', valor: true, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | FALSE
        { $$ = { tipo: 'booleano', valor: false, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | VARIABLE
        { $$ = { tipo: 'variable', nombre: $1.substring(1), linea: @1.first_line, columna: @1.first_column + 1 }; }
    | VARIABLE COR_IZQ expresion COR_DER
        { $$ = { tipo: 'acceso_array', nombre: $1.substring(1), indice: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | PAR_IZQ expresion PAR_DER
        { $$ = $2; }
    ;

bloque_logico
    : if_elem       { $$ = $1; }
    | switch_elem   { $$ = $1; }
    | for_elem      { $$ = $1; }
    ;

/* ===== IF ===== */

if_elem
    : IF PAR_IZQ expresion PAR_DER LLAVE_IZQ elementos_opt LLAVE_DER lista_else_opt
        {
            $$ = {
                tipo: 'if',
                condicion: $3,
                elementos: $6,
                ramas_else: $8,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

lista_else_opt
    : lista_else        { $$ = $1; }
    |                   { $$ = []; }
    ;

lista_else
    : lista_else else_con_cond
        { $1.push($2); $$ = $1; }
    | lista_else else_final
        { $1.push($2); $$ = $1; }
    | else_con_cond
        { $$ = [$1]; }
    | else_final
        { $$ = [$1]; }
    ;

else_con_cond
    : ELSE PAR_IZQ expresion PAR_DER LLAVE_IZQ elementos_opt LLAVE_DER
        {
            $$ = {
                tipo: 'else_if',
                condicion: $3,
                elementos: $6,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

else_final
    : ELSE LLAVE_IZQ elementos_opt LLAVE_DER
        {
            $$ = {
                tipo: 'else',
                elementos: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

/* ===== SWITCH ===== */

switch_elem
    : SWITCH PAR_IZQ expresion PAR_DER LLAVE_IZQ lista_casos LLAVE_DER
        {
            $$ = {
                tipo: 'switch',
                expresion: $3,
                casos: $6.casos,
                defecto: $6.defecto,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

lista_casos
    : lista_casos COMA caso_o_default
        {
            if ($3.tipo === 'default') {
                $1.defecto = $3;
            } else {
                $1.casos.push($3);
            }
            $$ = $1;
        }
    | caso_o_default
        {
            if ($1.tipo === 'default') {
                $$ = { casos: [], defecto: $1 };
            } else {
                $$ = { casos: [$1], defecto: null };
            }
        }
    ;

caso_o_default
    : CASE valor_caso LLAVE_IZQ elementos_opt LLAVE_DER
        {
            $$ = {
                tipo: 'caso',
                valor: $2,
                elementos: $4,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | DEFAULT LLAVE_IZQ elementos_opt LLAVE_DER
        {
            $$ = {
                tipo: 'default',
                elementos: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

valor_caso
    : CADENA        { $$ = { tipo: 'cadena', valor: $1 }; }
    | NUMERO        { $$ = { tipo: 'numero', valor: parseFloat($1) }; }
    ;

/* ===== FOR ===== */

for_elem
    : FOR EACH PAR_IZQ par_for PAR_DER LLAVE_IZQ elementos_opt LLAVE_DER
        {
            $$ = {
                tipo: 'for_each',
                pares: [$4],
                elementos: $7,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | FOR PAR_IZQ lista_pares_for PAR_DER TRACK VARIABLE LLAVE_IZQ elementos_opt LLAVE_DER empty_opt
        {
            $$ = {
                tipo: 'for_complejo',
                pares: $3,
                indice: $6.substring(1),
                elementos: $8,
                vacio: $10,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

lista_pares_for
    : lista_pares_for COMA par_for
        { $1.push($3); $$ = $1; }
    | par_for
        { $$ = [$1]; }
    ;

par_for
    : VARIABLE DOS_PUNTOS VARIABLE
        {
            $$ = {
                variable: $1.substring(1),
                arreglo: $3.substring(1),
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

empty_opt
    : EMPTY LLAVE_IZQ elementos_opt LLAVE_DER
        {
            $$ = {
                tipo: 'empty',
                elementos: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    |   { $$ = null; }
    ;