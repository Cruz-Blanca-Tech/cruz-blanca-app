import { describe, it, expect } from 'vitest';
import { matchDiscrepancy, deriveFieldValidation, type CorrectionFieldDescriptor } from './correction-fields';
import type { TriageDiscrepancy } from '../schemas/triage-discrepancy-schema';

describe('correction-fields (D14: Prioridad de severidad)', () => {
  const dummyField: CorrectionFieldDescriptor = {
    id: 'beneficiary.dni',
    name: 'beneficiary.dni',
    label: 'DNI del niño',
    group: 'Beneficiario',
    control: 'text',
    matchFieldNames: ['DNI del Niño/a', 'DNI Niño'],
    matchDocCodes: ['DNIBE'],
  };

  it('D14: Prioriza ERROR sobre AI_INSIGHT cuando coinciden en el mismo campo', () => {
    const aiInsight: TriageDiscrepancy = {
      field_name: 'beneficiary.dni',
      severity: 'AI_INSIGHT',
      rule_description: 'Sugerencia de IA: cambiar a DNI 12345678',
      expected_pattern: '12345678',
      actual_value: '87654321',
      document_code: 'DNIBE',
      navigation_hint: null,
    };

    const errorDisc: TriageDiscrepancy = {
      field_name: 'beneficiary.dni',
      severity: 'ERROR',
      rule_description: 'El DNI debe tener exactamente 8 dígitos numéricos',
      expected_pattern: '^\\d{8}$',
      actual_value: '123',
      document_code: 'DNIBE',
      navigation_hint: null,
    };

    // Sin importar el orden del array (AI_INSIGHT primero):
    const matched = matchDiscrepancy(dummyField, [aiInsight, errorDisc]);
    expect(matched).not.toBeNull();
    expect(matched?.severity).toBe('ERROR');
    expect(matched?.rule_description).toBe('El DNI debe tener exactamente 8 dígitos numéricos');

    const validation = deriveFieldValidation(dummyField, '123', [aiInsight, errorDisc]);
    expect(validation.status).toBe('error');
    expect(validation.message).toContain('El DNI debe tener exactamente 8 dígitos numéricos');
  });

  it('D14: Prioriza ERROR sobre WARNING', () => {
    const warningDisc: TriageDiscrepancy = {
      field_name: 'beneficiary.dni',
      severity: 'WARNING',
      rule_description: 'Advertencia: DNI repetido en otro expediente',
      expected_pattern: null,
      actual_value: null,
      document_code: null,
      navigation_hint: null,
    };

    const errorDisc: TriageDiscrepancy = {
      field_name: 'beneficiary.dni',
      severity: 'ERROR',
      rule_description: 'Formato inválido',
      expected_pattern: null,
      actual_value: null,
      document_code: null,
      navigation_hint: null,
    };

    const matched = matchDiscrepancy(dummyField, [warningDisc, errorDisc]);
    expect(matched?.severity).toBe('ERROR');
  });

  it('D14: Prioriza WARNING sobre AI_INSIGHT', () => {
    const aiInsight: TriageDiscrepancy = {
      field_name: 'beneficiary.dni',
      severity: 'AI_INSIGHT',
      rule_description: 'Sugerencia IA',
      expected_pattern: null,
      actual_value: null,
      document_code: null,
      navigation_hint: null,
    };

    const warningDisc: TriageDiscrepancy = {
      field_name: 'beneficiary.dni',
      severity: 'WARNING',
      rule_description: 'Advertencia de negocio',
      expected_pattern: null,
      actual_value: null,
      document_code: null,
      navigation_hint: null,
    };

    const matched = matchDiscrepancy(dummyField, [aiInsight, warningDisc]);
    expect(matched?.severity).toBe('WARNING');
  });

  it('Retorna null si ninguna discrepancia coincide con el campo', () => {
    const otherDisc: TriageDiscrepancy = {
      field_name: 'education.grade',
      severity: 'ERROR',
      rule_description: 'Grado requerido',
      expected_pattern: null,
      actual_value: null,
      document_code: null,
      navigation_hint: null,
    };

    const matched = matchDiscrepancy(dummyField, [otherDisc]);
    expect(matched).toBeNull();
  });
});
