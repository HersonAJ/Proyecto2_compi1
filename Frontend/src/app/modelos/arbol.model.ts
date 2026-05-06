export interface NodoArbol {
    nombre: string;
    tipo: 'archivo' | 'carpeta';
    ruta: string;
    hijos?: NodoArbol[];
}