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
"--".*                                           /* comentario SQL clasico */

"TABLE"                     return 'TABLE';
"COLUMNS"                   return 'COLUMNS';
"DELETE"                    return 'DELETE';
"IN"                        return 'IN';

"int"                       return 'INT';
"float"                     return 'FLOAT';
"string"                    return 'STRING_T';
"boolean"                   return 'BOOLEAN';
"char"                      return 'CHAR';

"true"                      return 'TRUE';
"True"                      return 'TRUE';
"false"                     return 'FALSE';
"False"                     return 'FALSE';

"="                         return 'IGUAL';
","                         return 'COMA';
";"                         return 'PUNTO_COMA';
"."                         return 'PUNTO';
"["                         return 'COR_IZQ';
"]"                         return 'COR_DER';

[0-9]+"."[0-9]+             return 'NUMERO_DECIMAL';
[0-9]+                      return 'NUMERO_ENTERO';
[a-zA-Z_][a-zA-Z0-9_]*      return 'IDENTIFICADOR';

"'"[^'\n]"'"                { yytext = yytext.substring(1, yytext.length - 1); return 'CARACTER'; }

\"                          { yy.cadena = ''; yy.cadenaInicio = { linea: yylloc.first_line, columna: yylloc.first_column + 1 }; this.begin('string'); }
<string>\"                  { this.popState(); yytext = yy.cadena; yylloc.first_line = yy.cadenaInicio.linea; yylloc.first_column = yy.cadenaInicio.columna - 1; return 'CADENA'; }
<string>\\\"                { yy.cadena += '"'; }
<string>\\n                 { yy.cadena += '\n'; }
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
    : lista_sentencias EOF      { return $1; }
    | EOF                       { return []; }
    ;

lista_sentencias
    : lista_sentencias sentencia
        {
            if ($2 !== null) $1.push($2); $$ = $1;
        }
    | lista_sentencias error PUNTO_COMA
        { $$ = $1; }
    | sentencia
        { $$ = $1 !== null ? [$1] : []; }
    | error PUNTO_COMA
        { $$ = []; }
    ;

sentencia
    : create_table      { $$ = $1; }
    | select_stmt       { $$ = $1; }
    | insert_stmt       { $$ = $1; }
    | update_stmt       { $$ = $1; }
    | delete_stmt       { $$ = $1; }
    ;

/* ============== CREATE TABLE ============== */

create_table
    : TABLE IDENTIFICADOR COLUMNS lista_columnas PUNTO_COMA
        {
            $$ = {
                tipo: 'create_table',
                tabla: $2,
                columnas: $4,
                linea: @1.first_line,
                columna: @1.first_column + 1
            };
        }
    ;

lista_columnas
    : lista_columnas COMA columna
        { $1.push($3); $$ = $1; }
    | columna
        { $$ = [$1]; }
    ;

columna
    : IDENTIFICADOR IGUAL tipo
        {
            $$ = {
                nombre: $1,
                tipoDato: $3,
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

/* ============== SELECT ============== */

select_stmt
    : IDENTIFICADOR PUNTO IDENTIFICADOR PUNTO_COMA
        {
            $$ = {
                tipo: 'select',
                tabla: $1,
                columna: $3,
                linea: @1.first_line,
                columna_pos: @1.first_column + 1
            };
        }
    ;

/* ============== INSERT ============== */

insert_stmt
    : IDENTIFICADOR COR_IZQ lista_asignaciones COR_DER PUNTO_COMA
        {
            $$ = {
                tipo: 'insert',
                tabla: $1,
                asignaciones: $3,
                linea: @1.first_line,
                columna_pos: @1.first_column + 1
            };
        }
    ;

lista_asignaciones
    : lista_asignaciones COMA asignacion_col
        { $1.push($3); $$ = $1; }
    | asignacion_col
        { $$ = [$1]; }
    ;

asignacion_col
    : IDENTIFICADOR IGUAL valor
        {
            $$ = {
                columna: $1,
                valor: $3,
                linea: @1.first_line,
                columna_pos: @1.first_column + 1
            };
        }
    ;

valor
    : NUMERO_ENTERO     { $$ = { tipo: 'int', valor: parseInt($1) }; }
    | NUMERO_DECIMAL    { $$ = { tipo: 'float', valor: parseFloat($1) }; }
    | CADENA            { $$ = { tipo: 'string', valor: $1 }; }
    | CARACTER          { $$ = { tipo: 'char', valor: $1 }; }
    | TRUE              { $$ = { tipo: 'boolean', valor: true }; }
    | FALSE             { $$ = { tipo: 'boolean', valor: false }; }
    ;

/* ============== UPDATE ============== */

update_stmt
    : IDENTIFICADOR COR_IZQ lista_asignaciones COR_DER IN NUMERO_ENTERO PUNTO_COMA
        {
            $$ = {
                tipo: 'update',
                tabla: $1,
                asignaciones: $3,
                id: parseInt($6),
                linea: @1.first_line,
                columna_pos: @1.first_column + 1
            };
        }
    ;

/* ============== DELETE ============== */

delete_stmt
    : IDENTIFICADOR DELETE NUMERO_ENTERO PUNTO_COMA
        {
            $$ = {
                tipo: 'delete',
                tabla: $1,
                id: parseInt($3),
                linea: @1.first_line,
                columna_pos: @1.first_column + 1
            };
        }
    ;