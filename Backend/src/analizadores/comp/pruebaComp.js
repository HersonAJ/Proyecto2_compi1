const GeneradorComp = require('./GeneradorComp');
const generador = new GeneradorComp();

function probar(titulo, entrada) {
    console.log('\n========================================');
    console.log('  ' + titulo);
    console.log('========================================');
    const resultado = generador.analizar(entrada);
    console.log('AST:');
    console.log(JSON.stringify(resultado.ast, null, 2));
    console.log('Errores:');
    console.log(JSON.stringify(resultado.errores, null, 2));
}

/* --- sanity de fases anteriores --- */
probar('1) Sanity: expresion aislada', `1 + 2 * 3`);

probar('2) Sanity: for complejo', `
demo() {
    for ( $a : $arr ) track $i {
        T("$a")
    }
}
`);

/* --- IF actualizado: else if con la palabra "if" --- */
probar('3) If con else if y else final', `
demo() {
    if ( $x == "a" ) {
        T("uno")
    } else if ( $x == "b" && $valido ) {
        T("dos")
    } else if ( $x == "c" ) {
        T("tres")
    } else {
        T("otro")
    }
}
`);

/* --- URLs con expresiones --- */
probar('4) URL literal sola', `
foto() {
    IMG("foto.png")
}
`);

probar('5) URL como variable simple', `
foto(string $url) {
    IMG($url)
}
`);

probar('6) URL como acceso a array', `
galeria(string $urls) {
    IMG($urls[1])
}
`);

probar('7) URL con expresion (indice computado)', `
galeria(string $urls, int $i) {
    IMG($urls[$i + 1])
}
`);

probar('8) Carrusel mezclando literal, variable y acceso', `
galeria(string $url_3, string $urls) {
    IMG<grande>(
        "https://a.com/1.png",
        "https://b.com/2.png",
        $url_3,
        $urls[1],
        "url_n"
    )
}
`);