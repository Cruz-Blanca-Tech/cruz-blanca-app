import { useMemo } from 'react';
import type { ExpectedDocument, PickedFile } from '../types';

const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp']);

/** DNI peruano: 8 dígitos. */
const DNI_REGEX = /^\d{8}$/;

/** La clave de agrupación es un token numérico, de cualquier largo. */
const GROUP_KEY_REGEX = /^\d+$/;

/**
 * Por qué un archivo no se puede subir.
 *
 * No es cosmético: cada motivo tiene una acción distinta y el operador tiene
 * que ver solo la que le corresponde. Un archivo sin clave necesita que le
 * elijan expediente; uno con clave y código equivocado ya sabe a qué
 * expediente pertenece y lo único que falta es el código.
 */
export type InvalidReason =
  /** La extensión no está entre las soportadas: renombrar no lo arregla. */
  | 'bad-ext'
  /** No hay `_` en el nombre, así que no hay clave de agrupación. */
  | 'no-key'
  /** Hay `_` pero el token no es numérico: no se puede agrupar. */
  | 'bad-key'
  /** Hay clave pero el código es demasiado corto para ser un código. */
  | 'short-code'
  /** Hay clave y el código no pertenece a la actividad. */
  | 'bad-code';

/**
 * Qué se sabe del expediente al que pertenece un archivo con código inválido.
 *
 * Hace falta distinguir tres casos, no dos: un expediente al que le falta
 * exactamente un documento se arregla de un clic; uno que ya está completo
 * significa que el archivo sobra (o es de otra persona); y uno al que le
 * faltan dos o más no permite adivinar nada, así que hay que elegir a mano.
 * Confundir el segundo con el tercero produce el mensaje falso de "este
 * expediente ya está completo" sobre un expediente que está a medias.
 */
export interface CodeFix {
  /** Códigos requeridos que le faltan a su expediente. Vacío si está completo. */
  missingCodes: string[];
  /** Código a usar, solo si falta exactamente uno. */
  suggestedCode: string | null;
}

export interface ValidatedFileItem {
  file: PickedFile;
  isValid: boolean;
  dni: string | null;
  code: string | null;
  errorReason?: string;
  /**
   * Algo que NO impide subir el archivo pero que el operador debería mirar.
   *
   * Existe porque el backend agrupa por clave numérica y NO por DNI validado
   * (`GroupKey`): un token de 7 u 9 dígitos es casi siempre un dígito tipeado
   * de más o de menos, no un documento ajeno. Marcarlo inválido lo borraba
   * del lote, que era como se perdían. Se sube, se agrupa tal cual y el
   * aviso honesto aparece en triaje.
   */
  warning?: string;
  /** Motivo del rechazo, para agrupar la bandeja por acción y no por texto. */
  invalidReason?: InvalidReason;
  /**
   * Solo en archivos con clave y código inválido: qué le falta a su
   * expediente, para ofrecer la corrección que corresponde.
   */
  fix?: CodeFix;
}

export interface DossierGroup {
  dni: string;
  files: ValidatedFileItem[];
  presentCodes: string[];
  missingCodes: string[];
  isComplete: boolean;
  /** False si la clave de agrupación no es un DNI de 8 dígitos. */
  isDni: boolean;
  totalRequired: number;
  totalPresent: number;
  /** Códigos válidos que llegaron pero no son requeridos por la actividad. */
  extraCodes: string[];
}

export interface BatchValidationResult {
  validatedFiles: ValidatedFileItem[];
  validFiles: ValidatedFileItem[];
  invalidFiles: ValidatedFileItem[];
  dossierGroups: DossierGroup[];
  totalFiles: number;
  validCount: number;
  invalidCount: number;
  dossierCount: number;
  completeDossierCount: number;
  incompleteDossierCount: number;
  /** Expedientes cuya clave de agrupación no es un DNI de 8 dígitos. */
  nonDniKeyCount: number;
  isAllComplete: boolean;
  hasIncompleteDossiers: boolean;
  hasInvalidFiles: boolean;
  canSubmit: boolean;
  /** Códigos de la actividad en su orden de catálogo, para pintar los huecos. */
  requiredCodes: string[];
  optionalCodes: string[];
  /** Código -> nombre del documento, para los tooltips de los chips. */
  codeNames: Record<string, string>;
  /** Sin clave de agrupación: hay que elegir expediente y código. */
  unassignedFiles: ValidatedFileItem[];
  /** Con clave y código equivocado: el expediente ya se sabe. */
  misCodedFiles: ValidatedFileItem[];
  /** Extensión no soportada: renombrar no lo arregla. */
  unsupportedFiles: ValidatedFileItem[];
}

/** Extensión en minúsculas, o cadena vacía si el nombre no tiene. */
export function fileExtension(fileName: string): string {
  const lastDot = fileName.trim().lastIndexOf('.');
  return lastDot === -1 ? '' : fileName.trim().slice(lastDot).toLowerCase();
}

/**
 * Arma el nombre `{clave}_{código}{ext}` conservando la extensión original.
 *
 * El backend no consulta el nombre real del archivo en Drive: usa el `file_name`
 * que le manda el cliente y de ahí saca la clave de agrupación y el código
 * (`RawFileMapper` → `RawFile.group_key` / `extracted_code`). Por eso corregir
 * el nombre desde la UI no es una mentira: el nombre que el sistema le pone al
 * documento es este, no el que tenía el archivo en el celular del operador.
 */
export function composeFileName(key: string, code: string, currentName: string): string {
  return `${key.trim()}_${code.trim().toUpperCase()}${fileExtension(currentName)}`;
}

/**
 * Por qué no se puede aplicar la asignación elegida, o `null` si se puede.
 *
 * Deliberadamente espeja las reglas de `useBatchFileValidation` para que el
 * diálogo muestre el error antes de aplicar y no después.
 */
export function assignProblem(
  key: string,
  code: string,
  currentName: string,
  validCodes: string[]
): string | null {
  const ext = fileExtension(currentName);
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return `La extensión ${ext || '(ninguna)'} no se puede procesar.`;
  }
  if (!key.trim()) return 'Elegí a qué expediente pertenece el archivo.';
  if (!GROUP_KEY_REGEX.test(key.trim())) {
    return 'La clave de agrupación tiene que ser un número.';
  }
  if (!code.trim()) return 'Elegí el tipo de documento.';
  if (validCodes.length > 0 && !validCodes.includes(code.trim().toUpperCase())) {
    return `"${code.trim().toUpperCase()}" no es un tipo de documento de esta actividad.`;
  }
  return null;
}

/**
 * Valida y clasifica los archivos seleccionados en base a las reglas de la actividad.
 * Detecta códigos erróneos, extensiones no soportadas y calcula la completitud por
 * clave de agrupación.
 */
export function useBatchFileValidation(
  files: PickedFile[],
  expectedDocuments: ExpectedDocument[]
): BatchValidationResult {
  return useMemo(() => {
    const codeNames: Record<string, string> = {};
    for (const doc of expectedDocuments) {
      codeNames[doc.code.toUpperCase()] = doc.name;
    }

    const allCodes = expectedDocuments.map((doc) => doc.code.toUpperCase());
    const expectedCodeSet = new Set(allCodes);
    const requiredCodes = expectedDocuments
      .filter((doc) => doc.isRequired !== false)
      .map((doc) => doc.code.toUpperCase());
    const requiredSet = new Set(requiredCodes);
    const optionalCodes = allCodes.filter((code) => !requiredSet.has(code));

    const validatedFiles: ValidatedFileItem[] = files.map((file) => {
      const fileName = file.file_name.trim();
      const lastDot = fileName.lastIndexOf('.');
      const ext = lastDot !== -1 ? fileName.slice(lastDot).toLowerCase() : '';
      const baseName = lastDot !== -1 ? fileName.slice(0, lastDot) : fileName;

      if (!SUPPORTED_EXTENSIONS.has(ext)) {
        return {
          file,
          isValid: false,
          dni: null,
          code: null,
          invalidReason: 'bad-ext' as const,
          errorReason: `La extensión ${ext || '(ninguna)'} no se puede procesar. Subí el archivo como JPG, PNG o PDF.`,
        };
      }

      const parts = baseName.split('_');
      if (parts.length < 2) {
        return {
          file,
          isValid: false,
          dni: null,
          code: null,
          invalidReason: 'no-key' as const,
          errorReason:
            'El nombre no dice a qué expediente pertenece. Elegí el expediente y el tipo de documento, o renombrá el archivo antes de subirlo.',
        };
      }

      const dniCandidate = parts[0].trim();
      if (!GROUP_KEY_REGEX.test(dniCandidate)) {
        // Sin token numérico no hay forma de saber a qué expediente pertenece
        // el archivo, así que acá sí se rechaza (y el mensaje dice qué hacer).
        return {
          file,
          isValid: false,
          dni: dniCandidate || null,
          code: null,
          invalidReason: 'bad-key' as const,
          errorReason: `"${dniCandidate || '(vacío)'}" no es un número, así que no se puede saber a qué expediente pertenece el archivo.`,
        };
      }

      // A partir de acá el token numérico SÍ sirve para agrupar, mida lo que
      // mida. Solo se deja constancia de que no parece un DNI, para que el
      // operador lo note y triaje lo diga explícitamente.
      const keyWarning = DNI_REGEX.test(dniCandidate)
        ? undefined
        : `El identificador '${dniCandidate}' no parece un DNI (no tiene 8 dígitos). Se enviará igual y en Triaje aparecerá como identificador de agrupación, no como DNI.`;

      const codeCandidate = parts[1].trim().toUpperCase();
      if (!codeCandidate || codeCandidate.length < 2) {
        return {
          file,
          isValid: false,
          dni: dniCandidate,
          code: codeCandidate || null,
          invalidReason: 'short-code' as const,
          errorReason: 'Falta el tipo de documento después del identificador.',
        };
      }

      if (allCodes.length > 0 && !expectedCodeSet.has(codeCandidate)) {
        return {
          file,
          isValid: false,
          dni: dniCandidate,
          code: codeCandidate,
          invalidReason: 'bad-code' as const,
          errorReason: `"${codeCandidate}" no es un tipo de documento de esta actividad. Los válidos son: ${allCodes.join(', ')}.`,
        };
      }

      return {
        file,
        isValid: true,
        dni: dniCandidate,
        code: codeCandidate,
        warning: keyWarning,
      };
    });

    const validFiles = validatedFiles.filter((f) => f.isValid);
    const invalidFiles = validatedFiles.filter((f) => !f.isValid);

    // Agrupar los válidos por clave de agrupación (el token antes del `_`).
    // No por DNI validado: el backend tampoco lo hace, y filtrar acá los
    // descartaba archivos que allá sí se podían recuperar.
    const dossierMap = new Map<string, ValidatedFileItem[]>();
    for (const valid of validFiles) {
      if (!valid.dni) continue;
      const current = dossierMap.get(valid.dni) ?? [];
      current.push(valid);
      dossierMap.set(valid.dni, current);
    }

    const dossierGroups: DossierGroup[] = Array.from(dossierMap.entries()).map(
      ([dni, groupFiles]) => {
        const presentCodes = Array.from(
          new Set(groupFiles.map((f) => f.code!).filter(Boolean))
        );
        const presentSet = new Set(presentCodes);
        const missingCodes = requiredCodes.filter((code) => !presentSet.has(code));
        const isComplete = requiredCodes.length > 0 && missingCodes.length === 0;

        return {
          dni,
          files: groupFiles,
          presentCodes,
          missingCodes,
          isComplete,
          isDni: DNI_REGEX.test(dni),
          totalRequired: requiredCodes.length,
          totalPresent: presentCodes.filter((c) => requiredSet.has(c)).length,
          extraCodes: presentCodes.filter((c) => !requiredSet.has(c)),
        };
      }
    );

    // Segunda pasada: ahora que existe el mapa de expedientes, un archivo con
    // código equivocado puede saber qué le falta a su propio expediente, y con
    // eso la bandeja puede ofrecer la corrección que corresponde en vez de un
    // "arreglalo vos" genérico.
    const groupByKey = new Map(dossierGroups.map((g) => [g.dni, g]));
    for (const item of invalidFiles) {
      if (item.invalidReason !== 'bad-code' && item.invalidReason !== 'short-code') {
        continue;
      }
      const group = item.dni ? groupByKey.get(item.dni) : undefined;
      item.fix = {
        missingCodes: group ? [...group.missingCodes] : [],
        suggestedCode:
          group && group.missingCodes.length === 1 ? group.missingCodes[0] : null,
      };
    }

    const completeDossierCount = dossierGroups.filter((g) => g.isComplete).length;
    const incompleteDossierCount = dossierGroups.length - completeDossierCount;
    const hasIncompleteDossiers = incompleteDossierCount > 0;
    const nonDniKeyCount = dossierGroups.filter((g) => !g.isDni).length;
    const hasInvalidFiles = invalidFiles.length > 0;
    const canSubmit = validFiles.length > 0;
    const isAllComplete =
      canSubmit && !hasInvalidFiles && !hasIncompleteDossiers;

    // Bandeja partida por acción, no por texto de error. Ver `InvalidReason`.
    const noKey = new Set<InvalidReason>(['no-key', 'bad-key']);

    return {
      validatedFiles,
      validFiles,
      invalidFiles,
      dossierGroups,
      totalFiles: files.length,
      validCount: validFiles.length,
      invalidCount: invalidFiles.length,
      dossierCount: dossierGroups.length,
      completeDossierCount,
      incompleteDossierCount,
      nonDniKeyCount,
      isAllComplete,
      hasIncompleteDossiers,
      hasInvalidFiles,
      canSubmit,
      requiredCodes,
      optionalCodes,
      codeNames,
      unassignedFiles: invalidFiles.filter((f) =>
        f.invalidReason ? noKey.has(f.invalidReason) : false
      ),
      misCodedFiles: invalidFiles.filter(
        (f) => f.invalidReason === 'bad-code' || f.invalidReason === 'short-code'
      ),
      unsupportedFiles: invalidFiles.filter((f) => f.invalidReason === 'bad-ext'),
    };
  }, [files, expectedDocuments]);
}
