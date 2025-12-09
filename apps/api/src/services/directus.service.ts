import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { config, logger } from '@seminario/shared-config';
import { createError } from '../middleware/error.middleware';

export interface DirectusAlunoCandidate {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  cellphone?: string | null;
  cpf?: string | null;
  birthDate?: string | null;
  gender?: 'M' | 'F' | 'O' | null;
  church?: string | null;
  denomination?: string | null;
  city?: string | null;
  state?: string | null;
  schedulingDate?: string | null;
  schedulingTime?: string | null;
  status?: string | null;
  course?: {
    id?: string;
    slug?: string | null;
    title?: string | null;
  } | null;
  createdAt?: string | null;
}

export interface DirectusProfessorCandidate {
  id: string;
  name: string;
  position?: string | null;
  bio?: string | null;
  category?: string | null;
  status?: string | null;
  qualifications?: string | null;
  photoUrl?: string | null;
}

type CacheKey = 'submissions' | 'professors';
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class DirectusService {
  private client: AxiosInstance;
  private token: string | null = null;
  private tokenExpiresAt = 0;
  private cache = new Map<CacheKey, CacheEntry<any>>();
  private readonly cacheTtl = 1000 * 60 * 5; // 5 minutes

  constructor() {
    const baseURL = config.integrations.directus.url?.replace(/\/$/, '') || '';
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  private ensureIntegrationReady() {
    const { url, email, password } = config.integrations.directus;
    if (!url || !email || !password) {
      throw createError('Integração com Directus não está configurada.', 503);
    }
  }

  private async authenticate() {
    this.ensureIntegrationReady();
    const { email, password } = config.integrations.directus;
    const response = await axios.post(
      `${config.integrations.directus.url.replace(/\/$/, '')}/auth/login`,
      { email, password },
    );
    const data = response.data?.data;
    if (!data?.access_token) {
      throw createError('Não foi possível autenticar no Directus.', 502);
    }
    this.token = data.access_token;
    const expiresInSeconds = data.expires ?? 900;
    this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
    this.client.defaults.headers.common.Authorization = `Bearer ${this.token}`;
  }

  private async ensureToken() {
    if (!this.token || Date.now() >= this.tokenExpiresAt - 60000) {
      await this.authenticate();
    }
  }

  private async request<T>(configRequest: AxiosRequestConfig, retry = true): Promise<T> {
    await this.ensureToken();
    try {
      const response = await this.client.request<T>(configRequest);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 401 && retry) {
        this.token = null;
        return this.request<T>(configRequest, false);
      }
      logger.error('Erro ao comunicar com o Directus', {
        url: configRequest.url,
        status: err.response?.status,
        message: err.message,
      });
      throw createError('Falha ao consultar dados no Directus', 502);
    }
  }

  private getFromCache<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data as T;
    }
    return null;
  }

  private setCache<T>(key: CacheKey, data: T) {
    this.cache.set(key, { data, expiresAt: Date.now() + this.cacheTtl });
  }

  private buildAssetUrl(fileId?: string | null) {
    if (!fileId) return null;
    const base = config.integrations.directus.url?.replace(/\/$/, '') || '';
    return `${base}/assets/${fileId}`;
  }

  private extractPreferredTranslation(translations: any[]): any | null {
    if (!Array.isArray(translations)) {
      return null;
    }
    const preferredCodes = ['pt-br', 'pt_BR', 'pt', 'pt-BR'];
    for (const code of preferredCodes) {
      const found = translations.find((t) => {
        if (!t) return false;
        if (typeof t.languages_id === 'string') {
          return t.languages_id.toLowerCase() === code.toLowerCase();
        }
        if (t.languages_id && typeof t.languages_id === 'object' && t.languages_id.code) {
          return t.languages_id.code.toLowerCase() === code.toLowerCase();
        }
        return false;
      });
      if (found) {
        return found;
      }
    }
    return translations[0] || null;
  }

  private mapGender(value?: string | null): 'M' | 'F' | 'O' | null {
    if (!value) return null;
    const normalized = value.toLowerCase();
    if (normalized.startsWith('m')) return 'M';
    if (normalized.startsWith('f')) return 'F';
    return 'O';
  }

  async getAlunoCandidates(force = false): Promise<DirectusAlunoCandidate[]> {
    this.ensureIntegrationReady();
    if (!force) {
      const cached = this.getFromCache<DirectusAlunoCandidate[]>('submissions');
      if (cached) {
        return cached;
      }
    }

    const response = await this.request<{ data: any[] }>({
      method: 'get',
      url: '/items/submissions',
      params: {
        limit: 200,
        sort: '-date_created',
        fields: '*.*,course.*,course.translations.*,course.translations.languages_id.*',
        'filter[status][_neq]': 'archived',
      },
    });

    const mapped = (response.data || []).map((submission) => {
      const translation = this.extractPreferredTranslation(submission?.course?.translations || []);
      return {
        id: submission.id?.toString?.() || String(submission.id),
        name: submission.name || 'Sem nome',
        email: submission.email || submission.contact_email || null,
        phone: submission.telephone || null,
        cellphone: submission.cellphone || null,
        cpf: submission.cpf ? String(submission.cpf).replace(/\D/g, '') : null,
        birthDate: submission.birth_date || null,
        gender: this.mapGender(submission.gender),
        church: submission.church || null,
        denomination: submission.denomination || null,
        city: submission.city || submission.church_city || null,
        state: submission.uf || submission.church_uf || null,
        schedulingDate: submission.scheduling_date || null,
        schedulingTime: submission.scheduling_time || null,
        status: submission.status || null,
        createdAt: submission.date_created || null,
        course: submission.course
          ? {
              id: submission.course.id?.toString?.() || submission.course.id,
              slug: submission.course.slug || null,
              title: translation?.title || translation?.name || submission.course.slug || null,
            }
          : null,
      } satisfies DirectusAlunoCandidate;
    });

    this.setCache('submissions', mapped);
    return mapped;
  }

  async getProfessorCandidates(force = false): Promise<DirectusProfessorCandidate[]> {
    this.ensureIntegrationReady();
    if (!force) {
      const cached = this.getFromCache<DirectusProfessorCandidate[]>('professors');
      if (cached) {
        return cached;
      }
    }

    const response = await this.request<{ data: any[] }>({
      method: 'get',
      url: '/items/team_members',
      params: {
        limit: 200,
        sort: 'order',
        fields: '*.*,photo.*,translations.*,translations.languages_id.*',
        'filter[category][_eq]': 'professor',
        'filter[status][_neq]': 'archived',
      },
    });

    const mapped = (response.data || []).map((member) => {
      const translation = this.extractPreferredTranslation(member?.translations || []);
      const qualifications = Array.isArray(member.qualifications)
        ? member.qualifications.map((item: any) => item?.text).filter(Boolean).join(', ')
        : typeof member.qualifications === 'string'
          ? member.qualifications
          : null;

      return {
        id: member.id?.toString?.() || String(member.id),
        name: translation?.name || member.name || 'Sem nome',
        position: translation?.position || null,
        bio: translation?.bio || null,
        category: member.category || null,
        status: member.status || null,
        qualifications,
        photoUrl: this.buildAssetUrl(member.photo?.id || member.photo),
      } satisfies DirectusProfessorCandidate;
    });

    this.setCache('professors', mapped);
    return mapped;
  }
}

export const directusService = new DirectusService();
