import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import { dailyVolumeSchema, type DailyVolume } from '../schemas/daily-volume-schema';
import { successRateSchema, type SuccessRate } from '../schemas/success-rate-schema';
import {
  automationLevelSchema,
  type AutomationLevel,
} from '../schemas/automation-level-schema';
import {
  registrationGrowthSchema,
  type RegistrationGrowth,
} from '../schemas/registration-growth-schema';
import {
  populationPyramidSchema,
  type PopulationPyramid,
} from '../schemas/population-pyramid-schema';

/**
 * Servicio de LECTURA de la analítica del dashboard (Reporting & Analytics API).
 *
 * El prefijo (`/api/v1/reporting`) sale de `API_PATHS.reporting`. Las rutas se
 * resuelven contra el proxy (`/api/proxy`), que inyecta el Bearer. Todos los
 * endpoints son GET SIN parámetros ni filtros: devuelven la métrica completa
 * envuelta en `DashboardResponse<T>` (metadatos de presentación + serie `data`).
 */
export const dashboardService = {
  /**
   * GET /operations/daily-volume — volumen diario de casos (serie temporal por
   * día). Devuelve el envoltorio con `data: DailyVolumeItem[]`.
   */
  async getDailyVolume(): Promise<DailyVolume> {
    const data = await apiClient.get(`${API_PATHS.reporting}/operations/daily-volume`);
    return parseApiResponse(dailyVolumeSchema, data, 'el volumen diario de casos');
  },

  /**
   * GET /operations/success-rate — distribución de casos por estado final del
   * pipeline (tasa de éxito). Devuelve el envoltorio con `data: SuccessRateItem[]`.
   */
  async getSuccessRate(): Promise<SuccessRate> {
    const data = await apiClient.get(`${API_PATHS.reporting}/operations/success-rate`);
    return parseApiResponse(successRateSchema, data, 'la tasa de éxito');
  },

  /**
   * GET /operations/automation-level — distribución de casos por veredicto de
   * triaje (nivel de automatización). Devuelve el envoltorio con
   * `data: AutomationLevelItem[]`.
   */
  async getAutomationLevel(): Promise<AutomationLevel> {
    const data = await apiClient.get(
      `${API_PATHS.reporting}/operations/automation-level`
    );
    return parseApiResponse(
      automationLevelSchema,
      data,
      'el nivel de automatización'
    );
  },

  /**
   * GET /demographics/registration-growth — altas de beneficiarios nuevos por
   * mes (crecimiento del padrón). Devuelve el envoltorio con
   * `data: RegistrationGrowthItem[]`.
   */
  async getRegistrationGrowth(): Promise<RegistrationGrowth> {
    const data = await apiClient.get(
      `${API_PATHS.reporting}/demographics/registration-growth`
    );
    return parseApiResponse(
      registrationGrowthSchema,
      data,
      'el crecimiento de registros'
    );
  },

  /**
   * GET /demographics/population-pyramid — distribución de beneficiarios por
   * grupo etario y sexo (pirámide poblacional). Devuelve el envoltorio con
   * `data: PopulationPyramidItem[]`.
   */
  async getPopulationPyramid(): Promise<PopulationPyramid> {
    const data = await apiClient.get(
      `${API_PATHS.reporting}/demographics/population-pyramid`
    );
    return parseApiResponse(
      populationPyramidSchema,
      data,
      'la pirámide poblacional'
    );
  },
};
