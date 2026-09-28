import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Texto en la forma en que se compara cuando el operador busca algo.
 *
 * Sin acentes y en minúscula, porque se escribe en el teclado que se tiene:
 * "Declaracion" tiene que encontrar "Declaración Jurada", y un `toLowerCase`
 * solo no alcanza. `NFD` separa la tilde de la letra y el rango de diacríticos
 * combinantes es lo que queda pegado; los caracteres de más de 127 se
 * conservan, así que una búsqueda en cirílico o con ñ sigue funcionando.
 */
export function searchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}
