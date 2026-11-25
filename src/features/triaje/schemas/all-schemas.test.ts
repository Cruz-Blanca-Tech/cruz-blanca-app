import { describe, expect, it } from 'vitest';

import {
  educaCaseDetailSchema,
  educaCaseSchema,
  educaRejectSchema,
  isEducaCaseApproved,
} from './educa-case-schema';
import {
  revalidateDossierResultSchema,
  uploadMissingDocPayloadSchema,
  uploadMissingDocResultSchema,
} from './dossier-schema';
import {
  batchRejectSchema,
  batchVerifyCompletionSchema,
} from './batch-actions-schema';
import { triageCasesSchema } from './triage-cases-schema';
import { batchesListSchema } from './batches-list-schema';
import { mdmBeneficiaryMatchSchema } from './mdm-match-schema';
import { batchDetailSummarySchema } from './batch-detail-summary-schema';
import { batchStatusesSchema } from './batch-status-schema';
import { batchesSummarySchema } from './batches-summary-schema';
import { caseDocumentsSchema } from './case-documents-schema';
import { rejectBatchFormSchema } from './reject-batch-form-schema';
import { rejectCaseFormSchema } from './reject-case-form-schema';

import {
  createActivitySchema,
  DEFAULT_CONFIDENCE_THRESHOLD,
} from '@/features/carga-datos/schemas/create-activity-schema';
import {
  createBatchFormSchema,
  createBatchResponseSchema,
} from '@/features/carga-datos/schemas/create-batch-schema';
import { beneficiariesListSchema } from '@/features/beneficiarios/schemas/beneficiaries-list-schema';
import { automationLevelSchema } from '@/features/dashboard/schemas/automation-level-schema';
import { dailyVolumeSchema } from '@/features/dashboard/schemas/daily-volume-schema';
import { populationPyramidSchema } from '@/features/dashboard/schemas/population-pyramid-schema';
import { registrationGrowthSchema } from '@/features/dashboard/schemas/registration-growth-schema';
import { successRateSchema } from '@/features/dashboard/schemas/success-rate-schema';
import {
  createActivityFormSchema,
  createActivityPayloadSchema,
} from '@/features/mdm/schemas/create-activity-schema';
import {
  schoolFormSchema,
  schoolsListSchema,
} from '@/features/mdm/schemas/school-schema';
import {
  updateRoleFormSchema,
  usersListSchema,
} from '@/features/usuarios/schemas/user-schema';

describe('Zod Schemas across all features', () => {
  it('validates EducaCase, EducaCaseDetail, EducaReject and isEducaCaseApproved', () => {
    const baseCase = {
      status: 'APPROVED',
      dossier_data: {
        beneficiary: {
          dni: '70000001',
          first_name: 'JUAN',
          last_name: 'PEREZ',
          birth_date: '2018-05-10',
          gender: 'MALE',
          address: 'Ancón',
          validation_issues: [],
        },
        related_adults: {
          adults: [
            {
              relationship: 'MOTHER',
              dni: '40000001',
              full_name: 'MARIA LOPEZ',
              phone: '999888777',
            },
          ],
          guardian_dni: '40000001',
          emergency_contact_dni: '40000001',
          validation_issues: [],
        },
        education: {
          school: 'SAN MARTIN',
          grade: '2DO_PRIMARIA',
          knows_read: true,
          knows_write: true,
          repeated_grade: false,
          learning_difficulties: false,
        },
        medical: {
          allergies: [],
          diseases: [],
          insurance: ['SIS'],
          has_been_operated: false,
          operation_reason: null,
          has_been_hospitalized: false,
          hospitalization_reason: null,
          vaccines: [],
          medications: [],
        },
        religion: {
          baptized: true,
          first_communion: false,
          validation_issues: [],
        },
        permissions: {
          haircut_permission: true,
          medical_exams_permission: true,
          validation_issues: [],
        },
      },
      discrepancies: [],
    };

    const parsed = educaCaseSchema.parse(baseCase);
    expect(isEducaCaseApproved(parsed)).toBe(true);
    expect(
      isEducaCaseApproved({ status: 'PENDING_REVIEW', discrepancies: [] })
    ).toBe(false);

    const detail = educaCaseDetailSchema.parse({
      ...baseCase,
      id: 'c1',
      batch_id: 'b1',
      dni_reference: '70000001',
      verdict: 'MANUALLY_APPROVED',
      confidence_scores: { dni: 0.99 },
    });
    expect(detail.id).toBe('c1');

    expect(
      educaRejectSchema.parse({ case_id: 'c1', message: 'Rechazado' }).case_id
    ).toBe('c1');
  });

  it('validates triage batch, dossier, and MDM match schemas', () => {
    expect(
      uploadMissingDocPayloadSchema.parse({
        document_code: 'FINS',
        file: { file_name: '70000001_FINS.jpg', source_id: 's1' },
      }).document_code
    ).toBe('FINS');

    expect(
      uploadMissingDocResultSchema.parse({
        batch_id: 'b1',
        dni_reference: '70000001',
        dossier_status: 'COMPLETE',
        added_documents_count: 1,
        rejected_documents_count: 0,
        failed_files: [],
        message: 'OK',
      }).added_documents_count
    ).toBe(1);

    expect(
      revalidateDossierResultSchema.parse({ status: 'REVALIDATING' }).status
    ).toBe('REVALIDATING');

    expect(
      batchVerifyCompletionSchema.parse({
        status: 'COMPLETED',
        message: 'Cerrado',
      }).status
    ).toBe('COMPLETED');

    expect(
      batchRejectSchema.parse({
        batch_id: 'b1',
        rejected_count: 3,
        message: 'Rechazado',
      }).rejected_count
    ).toBe(3);

    expect(
      triageCasesSchema.parse({
        items: [
          {
            id: 'c1',
            batch_id: 'b1',
            dni_reference: '70000001',
            status: 'APPROVED',
            verdict: 'AUTO_APPROVED',
            min_confidence_score: 0.95,
            confidence_threshold: 0.85,
            error_count: 0,
            warning_count: 0,
            discrepancies: [],
            created_at: '2026-10-01',
            updated_at: null,
          },
        ],
        total: 1,
        skip: 0,
        limit: 10,
      }).total
    ).toBe(1);

    expect(
      batchesListSchema.parse({
        total: 1,
        batches: [
          {
            id: 'b1',
            activity_id: 'a1',
            status: 'COMPLETED',
            created_at: '2026-10-01',
            documents_failed_count: 0,
            documents_approved_count: 4,
            description: 'Lote 1',
            activity_name: 'Inscripción',
            program_name: 'Educa',
            triage_summary: { total_cases: 1, verdicts: { AUTO_APPROVED: 1 } },
          },
        ],
      }).total
    ).toBe(1);

    const match = mdmBeneficiaryMatchSchema.parse({
      exists: true,
      beneficiary: {
        dni: '70000001',
        first_name: 'JUAN',
        last_name: 'PEREZ',
        relatives: null,
      },
    });
    expect(match.beneficiary?.relatives).toEqual([]);

    expect(
      batchDetailSummarySchema.parse({
        batch_id: 'b1',
        total_cases: 5,
        verdicts: {},
      }).batch_id
    ).toBe('b1');

    expect(batchStatusesSchema.parse(['PENDING', 'COMPLETED'])).toHaveLength(2);
    expect(
      batchesSummarySchema.parse({
        total_batches: 2,
        statuses: {
          PENDING: 1,
          PROCESSING: 0,
          COMPLETED: 1,
          FAILED: 0,
          REJECTED: 0,
          FINALIZED: 0,
          SYNCING: 0,
          SYNC_FAILED: 0,
        },
      }).total_batches
    ).toBe(2);

    const docs = caseDocumentsSchema.parse({
      documents: null,
      pending_documents: null,
      version: 1,
    });
    expect(docs.documents).toEqual([]);
    expect(docs.version).toBe('1');

    expect(
      rejectBatchFormSchema.parse({ reason: 'Motivo suficientemente largo' })
        .reason
    ).toContain('Motivo');
    expect(
      rejectCaseFormSchema.parse({ reason: 'Documento ilegible o borroso' })
        .reason
    ).toContain('Documento');
  });

  it('validates carga-datos, beneficiarios, dashboard, mdm, and usuarios schemas', () => {
    expect(DEFAULT_CONFIDENCE_THRESHOLD).toBe(0.85);
    expect(
      createActivitySchema.parse({
        name: 'Campaña 2026',
        documents: [
          {
            document_type_config_id: 'd1',
            name: 'FINS',
            selected: true,
            confidence_threshold: 0.85,
          },
        ],
      }).name
    ).toBe('Campaña 2026');

    expect(
      createBatchFormSchema.parse({
        activity_id: 'a1',
        files: [{ id: 'f1', name: 'doc.jpg', mimeType: 'image/jpeg' }],
        description: '  Lote Educa  ',
      }).description
    ).toBe('Lote Educa');

    expect(
      createBatchResponseSchema.parse({
        batch_id: 'b1',
        batch_status: 'PROCESSING',
        description: 'Lote',
        total_dossiers: 1,
        total_failed_files: 0,
        failed_files: [],
        message: 'Creado',
      }).batch_id
    ).toBe('b1');

    expect(
      beneficiariesListSchema.parse({
        items: [
          {
            id: '1',
            dni: '70000001',
            first_name: 'JUAN',
            last_name: 'PEREZ',
            birth_date: '2018-01-01',
            age: 8,
            gender: 'MALE',
            is_active: true,
            grade: '2DO_PRIMARIA',
          },
        ],
        total: 1,
        skip: 0,
        limit: 10,
      }).total
    ).toBe(1);

    const envelope = {
      title: 'Título',
      description: 'Desc',
      source: 'SQL',
      legend: null,
    };
    expect(
      automationLevelSchema.parse({
        ...envelope,
        data: [{ verdict: 'AUTO_APPROVED', count: 10 }],
      }).data
    ).toHaveLength(1);
    expect(
      dailyVolumeSchema.parse({
        ...envelope,
        data: [{ day: '2026-10-01', total_cases: 5 }],
      }).data
    ).toHaveLength(1);
    expect(
      populationPyramidSchema.parse({
        ...envelope,
        data: [{ age_group: '6-11', male: 4, female: 6 }],
      }).data
    ).toHaveLength(1);
    expect(
      registrationGrowthSchema.parse({
        ...envelope,
        data: [{ month: '2026-10', new_beneficiaries: 12 }],
      }).data
    ).toHaveLength(1);
    expect(
      successRateSchema.parse({
        ...envelope,
        data: [{ status: 'APPROVED', count: 20 }],
      }).data
    ).toHaveLength(1);

    expect(
      createActivityFormSchema.parse({
        name: 'Educa 2026',
        program_id: 'p1',
        activity_type: 'EDUCA_INSCRIPTION',
      }).name
    ).toBe('Educa 2026');

    expect(
      createActivityPayloadSchema.parse({
        name: 'Educa 2026',
        program_id: 'p1',
        activity_type: 'EDUCA_INSCRIPTION',
        start_date: null,
        end_date: null,
        requirements: [],
      }).requirements
    ).toEqual([]);

    expect(
      schoolsListSchema.parse([
        {
          id: 's1',
          name: 'SAN MARTIN',
          location: 'Ancón',
          phone: null,
          is_active: true,
        },
      ])
    ).toHaveLength(1);
    expect(schoolFormSchema.parse({ name: 'VILLAS ANCON' }).name).toBe(
      'VILLAS ANCON'
    );

    expect(
      usersListSchema.parse([
        {
          id: 'u1',
          email: 'enzo@cruz-blanca.org',
          role: 'admin',
          full_name: 'Enzo Trujillo',
        },
      ])
    ).toHaveLength(1);
    expect(updateRoleFormSchema.parse({ role: 'revisor' }).role).toBe(
      'revisor'
    );
  });
});
