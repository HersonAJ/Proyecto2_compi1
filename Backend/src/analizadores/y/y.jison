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
        exports.registrarErrorSintactico = function (err) {
            erroresSintacticos.push(err);
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
"#".*                                            /* comentario de linea */

"import"                    return 'IMPORT';
"function"                  return 'FUNCTION';
"main"                      return 'MAIN';
"execute"                   return 'EXECUTE';
"load"                      return 'LOAD';

"int"                       return 'INT';
"float"                     return 'FLOAT';
"string"                    return 'STRING_T';
"boolean"                   return 'BOOLEAN';
"char"                      return 'CHAR';

"if"                        return 'IF';
"else"                      return 'ELSE';
"switch"                    return 'SWITCH';
"case"                      return 'CASE';
"default"                   return 'DEFAULT';
"while"                     return 'WHILE';
"do"                        return 'DO';
"for"                       return 'FOR';
"break"                     return 'BREAK';
"continue"                  return 'CONTINUE';

"True"                      return 'TRUE';
"true"                      return 'TRUE';
"False"                     return 'FALSE';
"false"                     return 'FALSE';

"=="                        return 'IGUAL_IGUAL';
"!="                        return 'DIFERENTE';
">="                        return 'MAYOR_IGUAL';
"<="                        return 'MENOR_IGUAL';
"&&"                        return 'AND';
"||"                        return 'OR';
"++"                        return 'INCREMENTO';
"--"                        return 'DECREMENTO';

"="                         return 'IGUAL';
">"                         return 'MAYOR';
"<"                         return 'MENOR';
"+"                         return 'MAS';
"-"                         return 'MENOS';
"*"                         return 'POR';
"/"                         return 'DIVIDIDO';
"%"                         return 'MODULO';
"!"                         return 'NEGACION';

"["                         return 'COR_IZQ';
"]"                         return 'COR_DER';
"("                         return 'PAR_IZQ';
")"                         return 'PAR_DER';
"{"                         return 'LLAVE_IZQ';
"}"                         return 'LLAVE_DER';
","                         return 'COMA';
";"                         return 'PUNTO_COMA';
":"                         return 'DOS_PUNTOS';

"@"[a-zA-Z_][a-zA-Z0-9_]*   return 'REFERENCIA';
[0-9]+"."[0-9]+             return 'NUMERO_DECIMAL';
[0-9]+                      return 'NUMERO_ENTERO';
[a-zA-Z_][a-zA-Z0-9_]*      return 'IDENTIFICADOR';

"'"[^'\n]"'"                { yytext = yytext.substring(1, yytext.length - 1); return 'CARACTER'; }

"`"[^`]*"`"                 { yytext = yytext.substring(1, yytext.length - 1); return 'CADENA_SQL'; }

\"                          { yy.cadena = ''; yy.cadenaInicio = { linea: yylloc.first_line, columna: yylloc.first_column + 1 }; this.begin('string'); }
<string>\"                  { this.popState(); yytext = yy.cadena; yylloc.first_line = yy.cadenaInicio.linea; yylloc.first_column = yy.cadenaInicio.columna - 1; return 'CADENA'; }
<string>\\\"                { yy.cadena += '"'; }
<string>\\n                 { yy.cadena += '\n'; }
<string>\\t                 { yy.cadena += '\t'; }
<string>\\\\                { yy.cadena += '\\'; }
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
    : lista_declaraciones EOF       { return $1; }
    | EOF                           { return []; }
    ;

lista_declaraciones
    : lista_declaraciones declaracion
        {
            if ($2 !== null) $1.push($2); $$ = $1;
        }
    | lista_declaraciones error PUNTO_COMA
        { $$ = $1; }
    | declaracion
        { $$ = $1 !== null ? [$1] : []; }
    | error PUNTO_COMA
        { $$ = []; }
    ;

declaracion
    : import_decl       { $$ = $1; }
    | variable_decl     { $$ = $1; }
    | function_decl     { $$ = $1; }
    | main_decl         { $$ = $1; }
    ;

/* ============== IMPORTS ============== */

import_decl
    : IMPORT CADENA PUNTO_COMA
        {
            $$ = {
                tipo: 'import',
                ruta: $2.trim(),
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

/* ============== DECLARACION DE VARIABLES ============== */

variable_decl
    : tipo IDENTIFICADOR IGUAL expresion PUNTO_COMA
        {
            $$ = {
                tipo: 'variable',
                tipoDato: $1,
                esArreglo: false,
                nombre: $2,
                inicializador: $4,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | tipo COR_IZQ COR_DER IDENTIFICADOR IGUAL inicializador_arreglo PUNTO_COMA
        {
            $$ = {
                tipo: 'variable',
                tipoDato: $1,
                esArreglo: true,
                nombre: $4,
                inicializador: $6,
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
    ;

inicializador_arreglo
    : COR_IZQ NUMERO_ENTERO COR_DER
        {
            $$ = {
                tipo: 'arreglo_tamano',
                tamano: parseInt($2),
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | LLAVE_IZQ lista_valores LLAVE_DER
        {
            $$ = {
                tipo: 'arreglo_valores',
                valores: $2,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | EXECUTE CADENA_SQL
        {
            $$ = {
                tipo: 'arreglo_execute',
                sql: $2,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

lista_valores
    : lista_valores COMA expresion
        { $1.push($3); $$ = $1; }
    | expresion
        { $$ = [$1]; }
    ;

/* ============== EXPRESIONES  ============== */

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
    : NUMERO_ENTERO
        { $$ = { tipo: 'numero_entero', valor: parseInt($1), linea: @1.first_line, columna: @1.first_column + 1 }; }
    | NUMERO_DECIMAL
        { $$ = { tipo: 'numero_decimal', valor: parseFloat($1), linea: @1.first_line, columna: @1.first_column + 1 }; }
    | CADENA
        { $$ = { tipo: 'cadena', valor: $1, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | CARACTER
        { $$ = { tipo: 'caracter', valor: $1, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | TRUE
        { $$ = { tipo: 'booleano', valor: true, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | FALSE
        { $$ = { tipo: 'booleano', valor: false, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | IDENTIFICADOR
        { $$ = { tipo: 'identificador', nombre: $1, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | IDENTIFICADOR COR_IZQ expresion COR_DER
        { $$ = { tipo: 'acceso_array', nombre: $1, indice: $3, linea: @1.first_line, columna: @1.first_column + 1 }; }
    | PAR_IZQ expresion PAR_DER
        { $$ = $2; }
    ;

/* ============== FUNCIONES ============== */

function_decl
    : FUNCTION IDENTIFICADOR PAR_IZQ parametros_opt PAR_DER LLAVE_IZQ cuerpo_funcion_opt LLAVE_DER
        {
            $$ = {
                tipo: 'funcion',
                nombre: $2,
                parametros: $4,
                cuerpo: $7,
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
                esArreglo: false,
                nombre: $2,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | tipo COR_IZQ COR_DER IDENTIFICADOR
        {
            $$ = {
                tipoDato: $1,
                esArreglo: true,
                nombre: $4,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

cuerpo_funcion_opt
    : cuerpo_funcion        { $$ = $1; }
    |                       { $$ = []; }
    ;

cuerpo_funcion
    : cuerpo_funcion sentencia_funcion
        {
            if ($2 !== null) $1.push($2);
            $$ = $1;
        }
    | cuerpo_funcion error PUNTO_COMA
        { $$ = $1; }
    | sentencia_funcion
        { $$ = $1 !== null ? [$1] : []; }
    | error PUNTO_COMA
        { $$ = []; }
    ;

sentencia_funcion
    : execute_stmt          { $$ = $1; }
    | load_stmt             { $$ = $1; }
    ;

execute_stmt
    : EXECUTE CADENA_SQL PUNTO_COMA
        {
            $$ = {
                tipo: 'execute',
                sql: $2,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

load_stmt
    : LOAD CADENA PUNTO_COMA
        {
            $$ = {
                tipo: 'load',
                clase: 'literal',
                valor: $2,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | LOAD IDENTIFICADOR PUNTO_COMA
        {
            $$ = {
                tipo: 'load',
                clase: 'variable',
                valor: $2,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

/* ============== MAIN ============== */

main_decl
    : MAIN LLAVE_IZQ cuerpo_main_opt LLAVE_DER
        {
            $$ = {
                tipo: 'main',
                cuerpo: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

cuerpo_main_opt
    : cuerpo_main       { $$ = $1; }
    |                   { $$ = []; }
    ;

cuerpo_main
    : cuerpo_main sentencia_main
        {
            if ($2 !== null) $1.push($2);
            $$ = $1;
        }
    | cuerpo_main error PUNTO_COMA
        { $$ = $1; }
    | sentencia_main
        { $$ = $1 !== null ? [$1] : []; }
    | error PUNTO_COMA
        { $$ = []; }
    ;

sentencia_main
    : invocacion_componente     { $$ = $1; }
    | asignacion                { $$ = $1; }
    ;

invocacion_componente
    : REFERENCIA PAR_IZQ argumentos_opt PAR_DER PUNTO_COMA
        {
            $$ = {
                tipo: 'invocacion_componente',
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
    : argumentos COMA expresion
        { $1.push($3); $$ = $1; }
    | expresion
        { $$ = [$1]; }
    ;

asignacion
    : IDENTIFICADOR IGUAL expresion PUNTO_COMA
        {
            $$ = {
                tipo: 'asignacion',
                nombre: $1,
                indice: null,
                expresion: $3,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    | IDENTIFICADOR COR_IZQ expresion COR_DER IGUAL expresion PUNTO_COMA
        {
            $$ = {
                tipo: 'asignacion',
                nombre: $1,
                indice: $3,
                expresion: $6,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;