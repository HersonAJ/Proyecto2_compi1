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

/* --- Casos previos (sanity) --- */
probar('1) Componente vacio', `
header() {
}
`);

probar('2) Secciones anidadas con estilos', `
profile() {
    <azul>[
        <chico>[
        ]
    ]
}
`);

/* --- Fase 2: nuevos casos --- */
probar('3) Texto simple sin estilos', `
saludo() {
    T("Hola mundo")
}
`);

probar('4) Texto con multiples estilos', `
titulo() {
    T<grande, negrita>("Bienvenido")
}
`);

probar('5) Texto multilinea', `
descripcion() {
    T("
        Este es un texto
        con varias lineas.
    ")
}
`);

probar('6) Imagen individual', `
foto() {
    IMG("https://ejemplo.com/img.png")
}
`);

probar('7) Carrusel con literales y variables', `
galeria(string $url1) {
    IMG<grande>("https://a.com/1.png", $url1, "https://b.com/2.png")
}
`);

probar('8) Tabla simple', `
grilla() {
    [[
        [[ T("celda 1") ]]
        [[ T("celda 2") ]]
    ]]
}
`);

probar('9) Tabla con estilos y filas anidadas', `
matriz() {
    <bordes>[[
        [[
            [[ T("11") ]]
            [[ T("12") ]]
        ]]
        [[
            [[ T("21") ]]
            [[ T("22") ]]
        ]]
    ]]
}
`);

probar('10) Mezcla de elementos en seccion', `
panel() {
    <fondo>[
        T<titulo>("Mi panel")
        IMG("logo.png")
        [[
            [[ T("dato 1") ]]
            [[ T("dato 2") ]]
        ]]
    ]
}
`);