import { Ambito } from "../../../model/xml/Ambito/Ambito";
import { Element } from "../../../model/xml/Element";
import { Atributo } from "../../../model/xml/Atributo";
import { Tipos } from "../../../model/xpath/Enum";
import DobleEje from "./Selecting/DobleEje";
import Eje from "./Selecting/Eje";
import Axis from "./Selecting/Axis";

let reset: any;
let output: Array<any> = [];

function Bloque(_instruccion: Array<any>, _ambito: Ambito, _retorno: any) {
    let tmp: any;
    reset = _retorno;
    for (let i = 0; i < _instruccion.length; i++) {
        const camino = _instruccion[i]; // En caso de tener varios caminos
        for (let j = 0; j < camino.length; j++) {
            const instr = camino[j];
            if (instr.tipo === Tipos.SELECT_FROM_ROOT) {
                tmp = Eje(instr, _ambito, _retorno);
                if (tmp.notFound) { _retorno = reset; break; }
                if (tmp.error) return tmp;
                _retorno = tmp;
            }
            else if (instr.tipo === Tipos.SELECT_FROM_CURRENT) {
                tmp = DobleEje(instr, _ambito, _retorno);
                if (tmp.notFound) { _retorno = reset; break; }
                if (tmp.error) return tmp;
                _retorno = tmp;
            }
            else if (instr.tipo === Tipos.SELECT_AXIS) {
                tmp = Axis.SA(instr, _ambito, _retorno);
                if (tmp.notFound) { _retorno = reset; break; }
                if (tmp.error) return tmp;
                _retorno = tmp;
            }
            else {
                return { error: "Error: Instrucción no procesada.", tipo: "Semántico", origen: "Query", linea: instr.linea, columna: instr.columna };
            }
        }
        output.push(_retorno);
        _retorno = reset;
    }
    return writeOutput();
}

function writeOutput() {
    let cadena = "";
    for (let i = 0; i < output.length; i++) {
        const path = output[i];
        if (path.cadena === Tipos.TEXTOS) {
            let root: Array<string> = (path.texto) ? (path.texto) : (path.elementos);
            root.forEach(txt => {
                cadena += concatText(txt);
            });
        }
        else if (path.cadena === Tipos.ELEMENTOS) {
            let root: Array<Element> = path.elementos;
            root.forEach(element => {
                cadena += concatChilds(element, "");
            });
        }
        else if (path.cadena === Tipos.ATRIBUTOS) {
            if (path.atributos) {
                let root: Array<Atributo> = path.atributos; // <-- muestra sólo el atributo
                root.forEach(attr => {
                    cadena += concatAttributes(attr);
                });
            }
            else {
                let root: Array<Element> = path.elementos; // <-- muestra toda la etiqueta
                root.forEach(element => {
                    cadena += extractAttributes(element, "");
                });
            }
        }
        else if (path.cadena === Tipos.COMBINADO) {
            let root: Array<any> = path.nodos;
            root.forEach((elemento: any) => {
                if (elemento.elementos) {
                    cadena += concatChilds(elemento.elementos, "");
                }
                else if (elemento.textos) {
                    cadena += concatText(elemento.textos);
                }
            });
        }
    }
    output = [];
    if (cadena) return cadena.substring(1);
    return "No se encontraron elementos.";
}

function concatChilds(_element: Element, cadena: string): string {
    cadena = ("\n<" + _element.id_open);
    if (_element.attributes) {
        _element.attributes.forEach(attribute => {
            cadena += (" " + attribute.id + "=\"" + attribute.value + "\"");
        });
    }
    if (_element.childs) {
        cadena += ">";
        _element.childs.forEach(child => {
            cadena += concatChilds(child, cadena);
        });
        cadena += ("\n</" + _element.id_close + ">");
    }
    else {
        if (_element.id_close === null)
            cadena += "/>";
        else {
            cadena += ">";
            cadena += (_element.value + "</" + _element.id_close + ">");
        }
    }
    return cadena;
}

function concatAttributes(_attribute: Atributo): string {
    return `\n${_attribute.id}="${_attribute.value}"`;
}

function extractAttributes(_element: Element, cadena: string): string {
    if (_element.attributes) {
        _element.attributes.forEach(attribute => {
            cadena += `\n${attribute.id}="${attribute.value}"`;
        });
    }
    return cadena;
}

function concatText(_text: string): string {
    return `\n${_text}`;
}

export = Bloque;