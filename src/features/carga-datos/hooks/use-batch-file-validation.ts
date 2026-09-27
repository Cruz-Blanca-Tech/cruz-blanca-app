import { useMemo } from 'react';
import type { ExpectedDocument, PickedFile } from '../types';

const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp']);

/** DNI peruano: 8 dígitos. */
const DNI_REGEX = /^\d{8}$/;

/** La clave de agrupación es un token numérico, de cualquier largo. */
const GROUP_KEY_REGEX = /^\d+$/;

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
}

/**
 * Valida y clasifica los archivos seleccionados en base a las reglas de la actividad.
 * Detecta códigos erróneos, extensiones no soportadas y calcula la completitud por DNI.
 */
export function useBatchFileValidation(
  files: PickedFile[],
  expectedDocuments: ExpectedDocument[]
): BatchValidationResult {
  return useMemo(() => {
    const expectedCodes = expectedDocuments.map((doc) => doc.code.toUpperCase());
    const expectedCodeSet = new Set(expectedCodes);
    const requiredDocuments = expectedDocuments.filter((doc) => doc.isRequired !== false);
    const requiredCodes = requiredDocuments.map((doc) => doc.code.toUpperCase());

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
          errorReason: `Formato de archivo no soportado (${ext || 'sin extensión'}). Usa JPG, PNG o PDF.`,
        };
      }

      const parts = baseName.split('_');
      if (parts.length < 2) {
        return {
          file,
          isValid: false,
          dni: null,
          code: null,
          errorReason: 'Formato de nombre incorrecto. Usa la estructura {DNI}_{CODIGO}.ext (ej: 78076548_FINS.pdf).',
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
          errorReason: `El identificador '${dniCandidate || '(vacío)'}' no es numérico, así que no se puede agrupar el archivo en un expediente. Usa la estructura {DNI}_{CODIGO}.ext con solo dígitos.`,
        };
      }

      // A partir de acá el token numérico SÍ sirve para agrupar, mida lo que
      // mida. Solo se deja constancia de que no parece un DNI, para que el
      // operador lo note y triaje lo diga explícitamente.
      const keyWarning = DNI_REGEX.test(dniCandidate)
        ? undefined
        : `El identificador '${dniCandidate}' no es un DNI válido (no tiene 8 dígitos). Se enviará igual y los archivos se agruparán bajo esa clave. Si fue un error de tipeo, conviene renombrarlos antes de continuar.`;

      const codeCandidate = parts[1].trim().toUpperCase();
      if (!codeCandidate || codeCandidate.length < 2) {
        return {
          file,
          isValid: false,
          dni: dniCandidate,
          code: codeCandidate || null,
          errorReason: 'El código de documento debe tener al menos 2 caracteres.',
        };
      }

      if (expectedCodes.length > 0 && !expectedCodeSet.has(codeCandidate)) {
        return {
          file,
          isValid: false,
          dni: dniCandidate,
          code: codeCandidate,
          errorReason: `El código '${codeCandidate}' no es válido para esta actividad. Códigos permitidos: ${expectedCodes.join(', ')}.`,
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
          totalPresent: presentCodes.filter((c) => requiredCodes.includes(c)).length,
        };
      }
    );

    const completeDossierCount = dossierGroups.filter((g) => g.isComplete).length;
    const incompleteDossierCount = dossierGroups.length - completeDossierCount;
    const hasIncompleteDossiers = incompleteDossierCount > 0;
    const nonDniKeyCount = dossierGroups.filter((g) => !g.isDni).length;
    const hasInvalidFiles = invalidFiles.length > 0;
    const canSubmit = validFiles.length > 0;
    const isAllComplete =
      canSubmit && !hasInvalidFiles && !hasIncompleteDossiers;

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
    };
  }, [files, expectedDocuments]);
}
