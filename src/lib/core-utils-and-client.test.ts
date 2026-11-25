import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';

import { API_PATHS } from './api-paths';
import { toDriveThumbnailUrl } from './drive-image';
import { cn, searchText } from './utils';
import {
  getGenderLabel,
  getGradeLabel,
  getRelationshipLabel,
  getSyncStatusLabel,
  getTriageStatusLabel,
  getTriageVerdictLabel,
  SELECTABLE_RELATIONSHIP_ROLES,
} from './domain/enum-labels';
import { ROLE_CONFIG, ROLE_LIST } from '@/features/usuarios/lib/role-config';
import { REPORTS_CATALOG } from '@/features/reportes/lib/reports-catalog';
import {
  ACTIVITY_TEMPLATES,
  findTemplateById,
} from '@/features/mdm/lib/activity-templates';
import { BATCH_STATUS_CONFIG } from '@/features/triaje/lib/batch-status-config';
import {
  APPROVED_VERDICT_KEYS,
  getVerdictConfig,
  TRIAGE_VERDICT_CONFIG,
  TRIAGE_VERDICT_LIST,
} from '@/features/triaje/lib/triage-verdict-config';
import { ApiClient, apiClient } from './api-client';

describe('API_PATHS & Core Utils', () => {
  it('exposes all backend context prefixes', () => {
    expect(API_PATHS.intake).toBe('/api/v1/intake');
    expect(API_PATHS.batches).toBe('/api/v1/intake/api/v1/batches');
    expect(API_PATHS.batch).toBe('/api/v1/triage/batch');
    expect(API_PATHS.educa).toBe('/api/v1/triage/educa');
    expect(API_PATHS.beneficiaries).toBe('/api/v1/mdm/beneficiaries');
    expect(API_PATHS.schools).toBe('/api/v1/mdm/schools');
    expect(API_PATHS.reporting).toBe('/api/v1/reporting');
    expect(API_PATHS.users).toBe('/auth/users');
  });

  it('normalizes Google Drive URLs to proxy thumbnail URLs', () => {
    expect(toDriveThumbnailUrl(null)).toBeNull();
    expect(toDriveThumbnailUrl('https://example.com/a.jpg')).toBe(
      'https://example.com/a.jpg'
    );
    expect(
      toDriveThumbnailUrl('https://drive.google.com/uc?export=view&id=ABC_123')
    ).toBe('/api/drive-image?id=ABC_123&sz=w1000');
    expect(
      toDriveThumbnailUrl(
        'https://drive.google.com/file/d/FILE_99/view',
        'w500'
      )
    ).toBe('/api/drive-image?id=FILE_99&sz=w500');
    expect(
      toDriveThumbnailUrl('https://lh3.googleusercontent.com/d/G_42')
    ).toBe('/api/drive-image?id=G_42&sz=w1000');
    expect(
      toDriveThumbnailUrl('https://drive.google.com/drive/folders/without-id')
    ).toBe('https://drive.google.com/drive/folders/without-id');
  });

  it('merges class names and normalizes search text without accents', () => {
    expect(cn('px-2', 'px-4', 'text-sm')).toBe('px-4 text-sm');
    expect(searchText('  Declaración Jurada  ')).toBe('declaracion jurada');
  });
});

describe('Domain Enum Labels & UI Configs', () => {
  it('translates all domain enums with fallback behavior', () => {
    expect(SELECTABLE_RELATIONSHIP_ROLES).toContain('MOTHER');
    expect(getRelationshipLabel('mother')).toBe('Madre');
    expect(getRelationshipLabel(null)).toBe('Familiar');
    expect(getRelationshipLabel('CUSTOM')).toBe('CUSTOM');

    expect(getGenderLabel('male')).toBe('Masculino');
    expect(getGenderLabel(undefined)).toBe('—');
    expect(getGenderLabel('X')).toBe('X');

    expect(getTriageStatusLabel('approved')).toBe('Aprobado');
    expect(getTriageStatusLabel('')).toBe('—');
    expect(getTriageStatusLabel('NEW')).toBe('NEW');

    expect(getTriageVerdictLabel('auto_approved')).toBe(
      'Aprobado automáticamente'
    );
    expect(getTriageVerdictLabel(null)).toBe('—');
    expect(getTriageVerdictLabel('OTHER')).toBe('OTHER');

    expect(getSyncStatusLabel('synced')).toBe('Sincronizado');
    expect(getSyncStatusLabel(null)).toBe('—');
    expect(getSyncStatusLabel('RETRY')).toBe('RETRY');

    expect(getGradeLabel('1ro_primaria')).toBe('1ro Primaria');
    expect(getGradeLabel(null)).toBe('—');
    expect(getGradeLabel('OTRO')).toBe('OTRO');
  });

  it('loads role configs, reports catalog, activity templates, and triage configs', () => {
    expect(ROLE_LIST).toHaveLength(4);
    expect(ROLE_CONFIG.admin.label).toBe('Administrador');

    expect(REPORTS_CATALOG).toHaveLength(3);
    expect(REPORTS_CATALOG[0].id).toBe('beneficiaries-master');

    expect(ACTIVITY_TEMPLATES).toHaveLength(2);
    expect(findTemplateById('EDUCA_INSCRIPTION')?.label).toBe(
      'Inscripción Educa'
    );
    expect(findTemplateById(null)).toBeUndefined();
    expect(findTemplateById('UNKNOWN')).toBeUndefined();

    expect(BATCH_STATUS_CONFIG.PROCESSING.spin).toBe(true);
    expect(BATCH_STATUS_CONFIG.FINALIZED.label).toBe('FINALIZADO');

    expect(TRIAGE_VERDICT_LIST).toHaveLength(4);
    expect(APPROVED_VERDICT_KEYS).toContain('AUTO_APPROVED');
    expect(getVerdictConfig('REQUIRES_TRIAGE')).toEqual(
      TRIAGE_VERDICT_CONFIG.REQUIRES_TRIAGE
    );
    expect(getVerdictConfig('UNKNOWN_VERDICT')).toBeUndefined();
  });
});

describe('ApiClient HTTP methods and interceptors', () => {
  it('executes get, post, put, patch, delete and handles errors', async () => {
    expect(apiClient).toBeInstanceOf(ApiClient);
    const client = new ApiClient();
    const instance = (
      client as unknown as {
        axiosInstance: {
          get: ReturnType<typeof vi.fn>;
          post: ReturnType<typeof vi.fn>;
          put: ReturnType<typeof vi.fn>;
          patch: ReturnType<typeof vi.fn>;
          delete: ReturnType<typeof vi.fn>;
          interceptors: {
            response: {
              handlers: {
                fulfilled: (v: unknown) => unknown;
                rejected: (e: unknown) => Promise<unknown>;
              }[];
            };
          };
        };
      }
    ).axiosInstance;

    instance.get = vi.fn().mockResolvedValue({ data: { ok: 'get' } });
    instance.post = vi.fn().mockResolvedValue({ data: { ok: 'post' } });
    instance.put = vi.fn().mockResolvedValue({ data: { ok: 'put' } });
    instance.patch = vi.fn().mockResolvedValue({ data: { ok: 'patch' } });
    instance.delete = vi.fn().mockResolvedValue({ data: { ok: 'delete' } });

    expect(await client.get('/test')).toEqual({ ok: 'get' });
    expect(await client.post('/test', { a: 1 })).toEqual({ ok: 'post' });
    expect(await client.put('/test', { a: 1 })).toEqual({ ok: 'put' });
    expect(await client.patch('/test', { a: 1 })).toEqual({ ok: 'patch' });
    expect(await client.delete('/test')).toEqual({ ok: 'delete' });

    const handler = instance.interceptors.response.handlers[0];
    expect(handler.fulfilled({ data: 123 })).toEqual({ data: 123 });

    // 403 Forbidden
    await expect(
      handler.rejected({
        response: { status: 403, data: {} },
        config: { url: '/x' },
      })
    ).rejects.toThrow('No tienes permisos');

    // Error with errors array, message, error, detail
    await expect(
      handler.rejected({
        response: { status: 400, data: { errors: [{ msg: 'Campo invalido' }] } },
        config: {},
      })
    ).rejects.toThrow('Campo invalido');

    await expect(
      handler.rejected({
        response: { status: 400, data: { message: 'Error de negocio' } },
        config: {},
      })
    ).rejects.toThrow('Error de negocio');

    await expect(
      handler.rejected({
        response: { status: 400, data: { error: 'Bad Request' } },
        config: {},
      })
    ).rejects.toThrow('Bad Request');

    await expect(
      handler.rejected({
        response: { status: 400, data: { detail: 'Detalle backend' } },
        config: {},
      })
    ).rejects.toThrow('Detalle backend');

    // Network error (request without response)
    await expect(
      handler.rejected({
        request: {},
        config: {},
      })
    ).rejects.toThrow('Error de conexión');

    // Generic error
    await expect(
      handler.rejected({
        message: 'Fallo desconocido',
      })
    ).rejects.toThrow('Fallo desconocido');

    // 401 refresh flow failed
    vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Refresh fail'));
    await expect(
      handler.rejected({
        response: { status: 401, data: {} },
        config: { url: '/protected' },
      })
    ).rejects.toThrow('Tu sesión ha expirado');
  });
});
