%{
    var ErrorYFERA = require('../errores/ErrorYFERA');
    var erroresLexicos = [];
    var erroresSintacticos = [];

    function marcarToken(yy, yytext, yylineno, yylloc, tipo) {
        yy._ultimoToken = {
            lexema: yytext,
            linea: yylineno + 1,
            columna: yylloc.first_column + 1,
            tipo: tipo
        };

        if (tipo === 'ENTERO' || tipo === 'VARIABLE' || tipo === 'IDENTIFICADOR') {
            yy._ultimoValor = yy._ultimoToken;
        }
    }
%}

%options locations

%lex
%%

\s+                                         /* espacios */
\/\*[\s\S]*?\*\/                            /* comentarios */

"@for"      { marcarToken(yy,yytext,yylineno,yylloc); return 'FOR_LOOP'; }
"extends"   { marcarToken(yy,yytext,yylineno,yylloc); return 'EXTENDS'; }
"from"      { marcarToken(yy,yytext,yylineno,yylloc); return 'FROM'; }
"through"   { marcarToken(yy,yytext,yylineno,yylloc); return 'THROUGH'; }

"{"         { marcarToken(yy,yytext,yylineno,yylloc); return 'LLAVE_IZQ'; }
"}"         { marcarToken(yy,yytext,yylineno,yylloc); return 'LLAVE_DER'; }
"="         { marcarToken(yy,yytext,yylineno,yylloc); return 'IGUAL'; }
";"         { marcarToken(yy,yytext,yylineno,yylloc); return 'PUNTO_COMA'; }
"+"         { marcarToken(yy,yytext,yylineno,yylloc); return 'MAS'; }
"*"         { marcarToken(yy,yytext,yylineno,yylloc); return 'POR'; }
"/"         { marcarToken(yy,yytext,yylineno,yylloc); return 'DIVISION'; }
"("         { marcarToken(yy,yytext,yylineno,yylloc); return 'PAR_IZQ'; }
")"         { marcarToken(yy,yytext,yylineno,yylloc); return 'PAR_DER'; }
"-"         { marcarToken(yy,yytext,yylineno,yylloc); return 'MENOS'; }

\$[a-zA-Z_][a-zA-Z0-9_]*  { marcarToken(yy,yytext,yylineno,yylloc,'VARIABLE'); return 'VARIABLE'; }

[0-9]+(\.[0-9]+)?"%"      { marcarToken(yy,yytext,yylineno,yylloc); return 'PORCENTAJE'; }
[0-9]+\.[0-9]+            { marcarToken(yy,yytext,yylineno,yylloc); return 'DECIMAL'; }
[0-9]+                    { marcarToken(yy,yytext,yylineno,yylloc,'ENTERO'); return 'ENTERO'; }

[a-zA-Z][a-zA-Z0-9]*(\-[a-zA-Z0-9]+)* { marcarToken(yy,yytext,yylineno,yylloc,'IDENTIFICADOR');  return 'IDENTIFICADOR';  }

<<EOF>> return 'EOF';

. {
    var linea = yylineno + 1;
    var columna = yylloc.first_column + 1;
    var ultimo = erroresLexicos[erroresLexicos.length - 1];

    if (
        ultimo &&
        ultimo.linea === linea &&
        ultimo._acumulando &&
        columna === ultimo.columna + ultimo._texto.length
    ) {
        ultimo._texto += yytext;
        ultimo.lexema = ultimo._texto;
        ultimo.mensaje = 'Caracter(es) no reconocido(s): "' + ultimo._texto + '"';
    } else {
        var err = new ErrorYFERA(
            'Lexico',
            yytext,
            linea,
            columna,
            'Caracter no reconocido: "' + yytext + '"'
        );
        err._texto = yytext;
        err._acumulando = true;
        erroresLexicos.push(err);
    }
}

/lex

%start archivo
%left MAS MENOS
%left POR DIVISION

%%

archivo
    : definiciones EOF {
        $$ = {
            definiciones: $1,
            erroresLexicos,
            erroresSintacticos
        };
        erroresLexicos = [];
        erroresSintacticos = [];
        return $$;
    }
;

definiciones
    : definiciones definicion { if($2) $1.push($2); $$=$1; }
    | { $$=[]; }
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
    | IDENTIFICADOR LLAVE_IZQ error LLAVE_DER {
        var info = yy._ultimoError || yy._ultimoToken;
        erroresSintacticos.push(
            new ErrorYFERA(
                'Sintactico',
                info?.lexema || '',
                info?.linea,
                info?.columna,
                'Error en la definicion del estilo "' + $1 + '"'
            )
        );
        $$ = null;
    }
;

bucle_for
    : FOR_LOOP VARIABLE FROM ENTERO THROUGH ENTERO LLAVE_IZQ cuerpo_for LLAVE_DER {
        $$ = {
            tipo: 'for',
            variable: $2,
            desde: Number($4),
            hasta: Number($6),
            cuerpo: $8,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
    | FOR_LOOP error LLAVE_DER {
        var info = yy._ultimoError || yy._ultimoToken;
        erroresSintacticos.push(
            new ErrorYFERA(
                'Sintactico',
                info?.lexema || '',
                info?.linea,
                info?.columna,
                'Error en el bucle @for. Se esperaba "@for $var from n through n { ... }"'
            )
        );
        $$ = null;
    }
;

cuerpo_for
    : cuerpo_for estilo_for { if($2) $1.push($2); $$=$1; }
    | { $$=[]; }
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
    | nombre_for LLAVE_IZQ error LLAVE_DER {
        var info = yy._ultimoError || yy._ultimoToken;
        erroresSintacticos.push(
            new ErrorYFERA(
                'Sintactico',
                info?.lexema || '',
                info?.linea,
                info?.columna,
                'Error en estilo dentro de @for'
            )
        );
        $$ = null;
    }
;

nombre_for
    : IDENTIFICADOR
    | IDENTIFICADOR MENOS VARIABLE { $$=$1+'-'+$3; }
    | VARIABLE MENOS IDENTIFICADOR { $$=$1+'-'+$3; }
;

propiedades
    : lista_propiedades
    | { $$=[]; }
;

lista_propiedades
    : lista_propiedades propiedad { if($2) $1.push($2); $$=$1; }
    | propiedad { $$ = $1 ? [$1] : []; }
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
    | nombre_propiedad IGUAL valores error {
        var encontrado = yy._ultimoToken;
        var ultimoValor = yy._ultimoValor;

        erroresSintacticos.push(
            new ErrorYFERA(
                'Sintactico',
                encontrado.lexema,
                encontrado.linea,
                encontrado.columna,
                'Se esperaba ";" despues de "' + (ultimoValor ? ultimoValor.lexema : '') + '". Se encontro "' + encontrado.lexema + '"'
            )
        );

        $$ = null;
    }
    | nombre_propiedad IGUAL PUNTO_COMA {
        var info = yy._ultimoToken;

        erroresSintacticos.push(
            new ErrorYFERA(
                'Sintactico',
                info.lexema,
                info.linea,
                info.columna,
                'Se esperaba un valor antes de ";"'
            )
        );

        $$ = null;
    }
;

nombre_propiedad
    : lista_identificadores { $$=$1.join(' '); }
;

lista_identificadores
    : lista_identificadores IDENTIFICADOR { $1.push($2); $$=$1; }
    | IDENTIFICADOR { $$=[$1]; }
;

valores
    : valores valor_item { $1.push($2); $$=$1; }
    | valor_item { $$=[$1]; }
;

valor_item
    : expresion { $$ = $1; }
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
    : VARIABLE {
        $$ = {
            tipo: 'variable',
            valor: $1,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
    | ENTERO {
        $$ = {
            tipo: 'entero',
            valor: Number($1),
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
    | expresion MAS expresion {
        $$ = {
            tipo: 'binaria',
            op: '+',
            izq: $1,
            der: $3,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
    | expresion MENOS expresion {
        $$ = {
            tipo: 'binaria',
            op: '-',
            izq: $1,
            der: $3,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
    | expresion POR expresion {
        $$ = {
            tipo: 'binaria',
            op: '*',
            izq: $1,
            der: $3,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
    | expresion DIVISION expresion {
        $$ = {
            tipo: 'binaria',
            op: '/',
            izq: $1,
            der: $3,
            linea: @1.first_line,
            columna: @1.first_column + 1
        };
    }
    | PAR_IZQ expresion PAR_DER { $$ = $2; }
;