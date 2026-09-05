import { useMemo } from 'react';
import type { ExpectedDocument, PickedFile } from '../types';

const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp']);

export interface ValidatedFileItem {
  file: PickedFile;
  isValid: boolean;
  dni: string | null;
  code: string | null;
  errorReason?: string;
}

export interface DossierGroup {
  dni: string;
  files: ValidatedFileItem[];
  presentCodes: string[];
  missingCodes: string[];
  isComplete: boolean;
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
      if (!/^\d{8}$/.test(dniCandidate)) {
        return {
          file,
          isValid: false,
          dni: dniCandidate || null,
          code: null,
          errorReason: `DNI no válido ('${dniCandidate}'). Debe contener exactamente 8 dígitos numéricos.`,
        };
      }

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
      };
    });

    const validFiles = validatedFiles.filter((f) => f.isValid);
    const invalidFiles = validatedFiles.filter((f) => !f.isValid);

    // Agrupar los válidos por DNI
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
          totalRequired: requiredCodes.length,
          totalPresent: presentCodes.filter((c) => requiredCodes.includes(c)).length,
        };
      }
    );

    const completeDossierCount = dossierGroups.filter((g) => g.isComplete).length;
    const incompleteDossierCount = dossierGroups.length - completeDossierCount;
    const hasIncompleteDossiers = incompleteDossierCount > 0;
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
      isAllComplete,
      hasIncompleteDossiers,
      hasInvalidFiles,
      canSubmit,
    };
  }, [files, expectedDocuments]);
}
