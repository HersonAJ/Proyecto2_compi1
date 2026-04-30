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
"<"                         return 'MENOR';
">"                         return 'MAYOR';
","                         return 'COMA';
";"                         return 'PUNTO_COMA';
":"                         return 'DOS_PUNTOS';

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