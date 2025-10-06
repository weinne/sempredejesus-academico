import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenResponse, 
  AdminExistsResponse,
  BootstrapAdminRequest,
  BootstrapAdminResponse,
  User, 
  CreateUser,
  UpdateUser,
  ChangePassword,
  Pessoa, 
  Aluno, 
  CreateAluno,
  CreateAlunoWithUser,
  Professor, 
  CreateProfessor,
  CreateProfessorWithUser,
  Curso,
  CreateCurso,
  Periodo,
  CreatePeriodo,
  UpdatePeriodo,
  Disciplina,
  Turma,
  CreateTurma,
  Role,
  ApiError 
} from '@/types/api';

class ApiService {
  private api: AxiosInstance;
  private baseURL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) || (typeof window !== 'undefined' ? window.location.origin : ''); // Prefer env, fallback to same-origin
  private isOfflineMode = false;
  private refreshCall: Promise<void> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 5000, // Reduced timeout for faster offline detection
      withCredentials: true, // allow cookies for refresh token in production
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Check if it's a network error (backend offline)
        if (error.code === 'ECONNREFUSED' || 
            error.code === 'ERR_NETWORK' || 
            error.code === 'NETWORK_ERROR' ||
            !error.response || 
            error.message?.includes('Network Error') ||
            error.message?.includes('timeout')) {
          this.isOfflineMode = true;
          if (!this.isOfflineMode) {
            console.warn('🚨 Backend offline - using mock data for development');
          }
          // Return mock data for development
          return this.handleOfflineMode(error.config);
        }

        if (error.response?.status === 401) {
          const originalRequest: any = error.config || {};
          const url: string = originalRequest?.url || '';

          // Do not attempt refresh loops for auth endpoints themselves
          if (url.includes('/api/auth/refresh') || url.includes('/api/auth/login') || url.includes('/api/auth/logout')) {
            this.clearTokens();
            return Promise.reject(this.handleError(error));
          }

          // Prevent multiple refresh attempts for the same request
          if (originalRequest._retry) {
            this.clearTokens();
            return Promise.reject(this.handleError(error));
          }
          originalRequest._retry = true;

          try {
            // Debounce concurrent refresh calls
            if (!this.refreshCall) {
              this.refreshCall = this.refreshToken().finally(() => {
                this.refreshCall = null;
              });
            }

            await this.refreshCall;

            // Retry the original request with updated token
            const token = this.getToken();
            if (token) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.api.request(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and propagate error
            this.clearTokens();
            return Promise.reject(this.handleError(refreshError));
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleOfflineMode(config: any): Promise<any> {
    // Mock responses for development when backend is offline
    const url = config.url;
    const method = config.method?.toLowerCase();

    console.warn('🚨 Backend offline - using mock data for development');

    if (url === '/api/auth/login' && method === 'post') {
      return Promise.resolve({
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: '1',
            email: 'admin@seminario.edu',
            nome: 'Administrador Mock',
            role: Role.ADMIN,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      });
    }

    if (url === '/api/pessoas' && method === 'get') {
      return Promise.resolve({
        data: []
      });
    }

    if (url === '/api/alunos' && method === 'get') {
      return Promise.resolve({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      });
    }

    if (url === '/api/professores' && method === 'get') {
      return Promise.resolve({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      });
    }

    if (url === '/api/cursos' && method === 'get') {
      return Promise.resolve({
        data: [
          {
            id: '1',
            nome: 'Bacharelado em Teologia Mock',
            codigo: 'TEOL001',
            descricao: 'Curso completo de Teologia',
            grau: 'BACHARELADO',
            duracao_semestres: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]
      });
    }

    if (url === '/api/disciplinas' && method === 'get') {
      return Promise.resolve({
        data: [
          {
            id: 1,
            cursoId: 1,
            periodoId: 1,
            codigo: 'TSI001',
            nome: 'Teologia Sistemática I',
            creditos: 4,
            cargaHoraria: 60,
            ementa: 'Introdução à Teologia Sistemática',
            bibliografia: 'Bibliografia básica de Teologia',
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 2,
            cursoId: 1,
            periodoId: 1,
            codigo: 'TSI002',
            nome: 'Teologia Sistemática II',
            creditos: 4,
            cargaHoraria: 60,
            ementa: 'Aprofundamento em Teologia Sistemática',
            bibliografia: 'Bibliografia avançada de Teologia',
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
      });
    }

    if (url === '/api/periodos' && method === 'get') {
      return Promise.resolve({
        data: [
          {
            id: 1,
            cursoId: 1,
            numero: 1,
            nome: 'Período 1',
            descricao: null,
            totalDisciplinas: 2,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    }

    if (url?.includes('/api/pessoas') && method === 'post') {
      const newPessoa = {
        id: Date.now().toString(),
        ...config.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve({ data: newPessoa });
    }

    if (url?.includes('/api/pessoas') && method === 'patch') {
      const updatedPessoa = {
        id: url.split('/').pop(),
        ...config.data,
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve({ data: updatedPessoa });
    }

    if (url?.includes('/api/pessoas') && method === 'delete') {
      return Promise.resolve({ data: null });
    }

    if (url?.includes('/api/disciplinas') && method === 'post') {
      const newDisciplina = {
        id: Date.now(),
        ...config.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve({ data: newDisciplina });
    }

    if (url?.includes('/api/disciplinas') && method === 'patch') {
      const updatedDisciplina = {
        id: parseInt(url.split('/').pop() || '0'),
        ...config.data,
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve({ data: updatedDisciplina });
    }

    if (url?.includes('/api/disciplinas') && method === 'delete') {
      return Promise.resolve({ data: null });
    }

    // For other endpoints, return empty success response
    return Promise.resolve({ data: [] });
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Erro no servidor',
        statusCode: error.response.status,
        details: error.response.data,
      };
    } else if (error.request) {
      return {
        message: 'Erro de conexão com o servidor',
        statusCode: 0,
      };
    } else {
      return {
        message: error.message || 'Erro desconhecido',
      };
    }
  }

  // Token management
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post('/api/auth/login', credentials);
    
    // Map backend response structure to frontend expected structure
    const backendData = response.data.data; // Backend returns: { success, message, data: { accessToken, refreshToken, user } }
    const mappedResponse: LoginResponse = {
      access_token: backendData.accessToken,
      refresh_token: backendData.refreshToken,
      user: backendData.user
    };
    
    this.setTokens(mappedResponse.access_token, mappedResponse.refresh_token);
    localStorage.setItem('user', JSON.stringify(mappedResponse.user));
    return mappedResponse;
  }

  async adminExists(): Promise<AdminExistsResponse> {
    const response = await this.api.get('/api/auth/admin-exists');
    // Backend returns { success, data: { exists: boolean } }
    return response.data.data as AdminExistsResponse;
  }

  async bootstrapAdmin(payload: BootstrapAdminRequest): Promise<BootstrapAdminResponse> {
    const response = await this.api.post('/api/auth/bootstrap-admin', payload);
    // Backend returns { success, data: { id, username } }
    return response.data.data as BootstrapAdminResponse;
  }

  async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    // Attempt refresh whether token exists locally or only as cookie
    const payload = refreshToken ? { refreshToken } : {};
    const response = await this.api.post('/api/auth/refresh', payload);
    const data = response?.data?.data || {};
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refresh_token', data.refreshToken);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      this.clearTokens();
    }
  }

  // User methods
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || userStr === 'undefined' || userStr === 'null') {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.warn('Error parsing user from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('user');
      return null;
    }
  }

  // Self (me) endpoints
  async getMyProfile(): Promise<User> {
    const response = await this.api.get('/api/me');
    const row = response.data.data || {};
    const main = row.users ? row.users : row;
    const pessoa = row.pessoas || row.pessoa || null;
    const base: User = {
      id: Number(main.id),
      pessoaId: Number(main.pessoaId),
      username: main.username,
      role: main.role,
      isActive: (main.isActive as 'S' | 'N') || 'S',
      lastLogin: main.lastLogin || undefined,
      createdAt: main.createdAt,
      updatedAt: main.updatedAt,
    } as User;
    if (pessoa) {
      base.pessoa = {
        id: pessoa.id?.toString?.() || '',
        nome: pessoa.nomeCompleto || pessoa.nome || '',
        sexo: pessoa.sexo,
        cpf: pessoa.cpf || '',
        email: pessoa.email || '',
        telefone: pessoa.telefone || '',
        endereco: typeof pessoa.endereco === 'object' ? JSON.stringify(pessoa.endereco) : pessoa.endereco || '',
        data_nascimento: pessoa.dataNasc || pessoa.data_nascimento || '',
        created_at: pessoa.createdAt || '',
        updated_at: pessoa.updatedAt || '',
      };
    }
    return base;
  }

  async updateMyProfile(pessoa: Partial<Pessoa>): Promise<Pessoa> {
    // Map frontend Pessoa to backend UpdatePessoa fields
    const backendData: any = {};
    if (pessoa.nome) backendData.nomeCompleto = pessoa.nome;
    if (pessoa.email) backendData.email = pessoa.email;
    if (pessoa.telefone) backendData.telefone = pessoa.telefone;
    if (pessoa.cpf) backendData.cpf = pessoa.cpf;
    if (pessoa.data_nascimento) backendData.dataNasc = pessoa.data_nascimento;
    const response = await this.api.patch('/api/me/profile', backendData);
    const updated = response.data.data;
    return {
      id: updated.id.toString(),
      nome: updated.nomeCompleto,
      sexo: updated.sexo,
      cpf: updated.cpf || '',
      email: updated.email || '',
      telefone: updated.telefone || '',
      endereco: typeof updated.endereco === 'object' ? JSON.stringify(updated.endereco) : updated.endereco || '',
      data_nascimento: updated.dataNasc || '',
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    };
  }

  async changeMyPassword(payloads: ChangePassword): Promise<void> {
    await this.api.patch('/api/me/change-password', payloads);
  }

  // Pessoas CRUD
  getPessoas = async (): Promise<Pessoa[]> => {
    try {
      const response = await this.api.get('/api/pessoas');
      
      // Map backend response structure and field names
      return response.data.data.map((pessoa: any) => ({
        id: pessoa.id.toString(),
        nome: pessoa.nomeCompleto,
        sexo: pessoa.sexo,
        cpf: pessoa.cpf || '',
        email: pessoa.email || '',
        telefone: pessoa.telefone || '',
        endereco: typeof pessoa.endereco === 'object' 
          ? JSON.stringify(pessoa.endereco) 
          : pessoa.endereco || '',
        data_nascimento: pessoa.dataNasc || '',
        created_at: pessoa.createdAt,
        updated_at: pessoa.updatedAt,
      }));
    } catch (error) {
      if (this.isOfflineMode) {
        return this.handleOfflineMode('/api/pessoas');
      }
      throw this.handleError(error);
    }
  }

  getPessoa = async (id: string): Promise<Pessoa> => {
    const response: AxiosResponse<Pessoa> = await this.api.get(`/api/pessoas/${id}`);
    return response.data;
  }

  createPessoa = async (pessoa: Omit<Pessoa, 'id' | 'created_at' | 'updated_at'>): Promise<Pessoa> => {
    try {
      // Map frontend fields to backend expected structure
      const backendData: any = {
        nomeCompleto: pessoa.nome,
        sexo: pessoa.sexo,
      };

      // Only include optional fields if they have values
      if (pessoa.email && pessoa.email.trim()) {
        backendData.email = pessoa.email;
      }
      
      if (pessoa.cpf && pessoa.cpf.trim()) {
        backendData.cpf = pessoa.cpf;
      }
      
      if (pessoa.data_nascimento && pessoa.data_nascimento.trim()) {
        backendData.dataNasc = pessoa.data_nascimento;
      }
      
      if (pessoa.telefone && pessoa.telefone.trim()) {
        backendData.telefone = pessoa.telefone;
      }
      
      if (pessoa.endereco && pessoa.endereco.trim()) {
        backendData.endereco = {
          logradouro: pessoa.endereco,
          numero: '',
          complemento: '',
          bairro: '',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: ''
        };
      }
      
      const response = await this.api.post('/api/pessoas', backendData);
      
      // Map response back to frontend structure
      const created = response.data.data;
      return {
        id: created.id.toString(),
        nome: created.nomeCompleto,
        sexo: created.sexo,
        cpf: created.cpf || '',
        email: created.email || '',
        telefone: created.telefone || '',
        endereco: typeof created.endereco === 'object' 
          ? JSON.stringify(created.endereco) 
          : created.endereco || '',
        data_nascimento: created.dataNasc || '',
        created_at: created.createdAt,
        updated_at: created.updatedAt,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  updatePessoa = async (id: string, pessoa: Partial<Pessoa>): Promise<Pessoa> => {
    try {
      // Map frontend fields to backend expected structure, similar to createPessoa
      const backendData: any = {};

      // Only include fields that have values
      if (pessoa.nome && pessoa.nome.trim()) {
        backendData.nomeCompleto = pessoa.nome;
      }
      
      if (pessoa.sexo) {
        backendData.sexo = pessoa.sexo;
      }
      
      if (pessoa.email && pessoa.email.trim()) {
        backendData.email = pessoa.email;
      }
      
      if (pessoa.cpf && pessoa.cpf.trim()) {
        backendData.cpf = pessoa.cpf;
      }
      
      if (pessoa.data_nascimento && pessoa.data_nascimento.trim()) {
        backendData.dataNasc = pessoa.data_nascimento;
      }
      
      if (pessoa.telefone && pessoa.telefone.trim()) {
        backendData.telefone = pessoa.telefone;
      }
      
      if (pessoa.endereco && pessoa.endereco.trim() && pessoa.endereco !== 'null') {
        backendData.endereco = {
          logradouro: pessoa.endereco,
          numero: '',
          complemento: '',
          bairro: '',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: ''
        };
      }

      const response = await this.api.patch(`/api/pessoas/${id}`, backendData);
      
      // Map response back to frontend structure
      const updated = response.data.data;
      return {
        id: updated.id.toString(),
        nome: updated.nomeCompleto,
        sexo: updated.sexo,
        cpf: updated.cpf || '',
        email: updated.email || '',
        telefone: updated.telefone || '',
        endereco: typeof updated.endereco === 'object' 
          ? JSON.stringify(updated.endereco) 
          : updated.endereco || '',
        data_nascimento: updated.dataNasc || '',
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  deletePessoa = async (id: string): Promise<void> => {
    try {
      await this.api.delete(`/api/pessoas/${id}`);
    } catch (error: any) {
      console.warn('Mock delete pessoa - no action needed');
      // Mock delete always succeeds
    }
  }

  // Alunos CRUD
  async getAlunos(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc' 
  }): Promise<{ data: Aluno[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await this.api.get(`/api/alunos?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.warn('API offline - showing empty alunos list');
      return {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  }

  async getAluno(ra: string): Promise<Aluno> {
    const response = await this.api.get(`/api/alunos/${ra}`);
    const aluno = response.data.data || response.data;
    return {
      ...aluno,
      periodoId: typeof aluno.periodoId === 'number' ? aluno.periodoId : Number(aluno.periodoId ?? 0),
      periodo: aluno.periodo
        ? {
            ...aluno.periodo,
            numero: Number(aluno.periodo.numero ?? aluno.periodoId ?? 0),
          }
        : undefined,
    } as Aluno;
  }

  // === Sprint 8: Avaliações ===
  async getAvaliacoes(params?: { turmaId?: number; disciplinaId?: number; professorId?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc'|'desc' }) {
    const response = await this.api.get(`/api/avaliacoes`, { params });
    const payload = response.data;
    const data = Array.isArray(payload.data) ? payload.data : (payload.data?.data || payload.data || []);
    const pagination = payload.pagination || payload.data?.pagination;
    return { data: data as import('@/types/api').Avaliacao[], pagination };
  }

  async createAvaliacao(payload: import('@/types/api').CreateAvaliacao) {
    const response = await this.api.post(`/api/avaliacoes`, payload);
    return response.data.data as import('@/types/api').Avaliacao;
  }

  async lancarNotas(avaliacaoId: number, notas: import('@/types/api').LancarNotaInput[]) {
    await this.api.post(`/api/avaliacoes/${avaliacaoId}/notas`, { notas });
  }

  // === Sprint 8: Aulas & Frequência ===
  async getAulas(params?: { turmaId?: number; disciplinaId?: number; professorId?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc'|'desc' }) {
    const response = await this.api.get(`/api/aulas`, { params });
    // Support both array and { data, pagination }
    const payload = response.data;
    const data = Array.isArray(payload.data) ? payload.data : (payload.data?.data || payload.data || []);
    const pagination = payload.pagination || payload.data?.pagination;
    return { data: data as import('@/types/api').Aula[], pagination };
  }

  async createAula(payload: import('@/types/api').CreateAula) {
    const response = await this.api.post(`/api/aulas`, payload);
    return response.data.data as import('@/types/api').Aula;
  }

  async lancarFrequencias(aulaId: number, frequencias: import('@/types/api').LancarFrequenciaInput[]) {
    await this.api.post(`/api/aulas/${aulaId}/frequencias`, { frequencias });
  }

  async getEstudantesAula(aulaId: number) {
    const response = await this.api.get(`/api/aulas/${aulaId}/estudantes`);
    return response.data.data as import('@/types/api').EstudanteAula[];
  }

  // Enhanced evaluations endpoints
  async getEstudantesAvaliacao(avaliacaoId: number) {
    const response = await this.api.get(`/api/avaliacoes/${avaliacaoId}/estudantes`);
    return response.data.data as import('@/types/api').EstudanteAvaliacao[];
  }

  async validarPesosAvaliacao(turmaId: number) {
    const response = await this.api.get(`/api/avaliacoes/turma/${turmaId}/pesos`);
    return response.data.data as import('@/types/api').ValidacaoPesos;
  }

  async getAlertasFrequencia(turmaId: number) {
    const response = await this.api.get(`/api/aulas/turma/${turmaId}/alertas-frequencia`);
    return response.data.data as import('@/types/api').AlertasFrequencia;
  }

  // Aulas - single
  async getAula(id: number) {
    const response = await this.api.get(`/api/aulas/${id}`);
    return response.data.data as import('@/types/api').Aula;
  }

  async updateAula(id: number, data: Partial<import('@/types/api').CreateAula>) {
    const response = await this.api.patch(`/api/aulas/${id}`, data);
    return response.data.data as import('@/types/api').Aula;
  }

  // === Sprint 8: Calendário ===
  async getCalendario() {
    const response = await this.api.get(`/api/calendario`);
    return response.data.data as import('@/types/api').CalendarioItem[];
  }

  async createCalendario(item: import('@/types/api').CreateCalendarioItem) {
    const response = await this.api.post(`/api/calendario`, item);
    return response.data.data as import('@/types/api').CalendarioItem;
  }

  async updateCalendario(id: number, data: Partial<import('@/types/api').CreateCalendarioItem>) {
    const response = await this.api.patch(`/api/calendario/${id}`, data);
    return response.data.data as import('@/types/api').CalendarioItem;
  }

  async deleteCalendario(id: number) {
    await this.api.delete(`/api/calendario/${id}`);
  }

  // === Sprint 8: Relatórios ===
  async reportHistorico(alunoId: string) {
    const response = await this.api.get(`/api/reports/historico`, { params: { alunoId } });
    return response.data.data as any[];
  }

  async reportFrequencia(turmaId: number, startDate?: string, endDate?: string) {
    const response = await this.api.get(`/api/reports/frequencia`, { params: { turmaId, startDate, endDate } });
    return response.data.data as any[];
  }

  async reportDesempenho(disciplinaId: number) {
    const response = await this.api.get(`/api/reports/desempenho`, { params: { disciplinaId } });
    return response.data.data as { turmas: number; alunos: number; mediaGeral: number | null };
  }

  async createAluno(aluno: CreateAlunoWithUser): Promise<{ aluno: Aluno; user?: any }> {
    // Map inline pessoa fields (frontend shape) to backend expected shape if provided
    const payload: any = { ...aluno };
    if (!payload.pessoaId && aluno.pessoa) {
      const p = aluno.pessoa;
      payload.pessoa = {
        nomeCompleto: p.nome,
        sexo: p.sexo,
        email: p.email,
        cpf: p.cpf,
        dataNasc: p.data_nascimento,
        telefone: p.telefone,
        endereco: p.endereco
          ? {
              logradouro: p.endereco,
              numero: '',
              complemento: '',
              bairro: '',
              cidade: 'São Paulo',
              estado: 'SP',
              cep: ''
            }
          : undefined,
      };
    }
    const response = await this.api.post('/api/alunos', payload);
    return response.data.data;
  }

  async updateAluno(ra: string, aluno: Partial<CreateAluno>): Promise<Aluno> {
    const response = await this.api.patch(`/api/alunos/${ra}`, aluno);
    return response.data.data;
  }

  async deleteAluno(ra: string): Promise<void> {
    await this.api.delete(`/api/alunos/${ra}`);
  }

  // Professores CRUD
  async getProfessores(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc' 
  }): Promise<{ data: Professor[]; pagination?: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await this.api.get(`/api/professores?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.warn('API offline - showing empty professores list');
      return {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  }

  async getProfessor(matricula: string): Promise<Professor> {
    const response = await this.api.get(`/api/professores/${matricula}`);
    return response.data.data;
  }

  async createProfessor(professor: CreateProfessorWithUser): Promise<{ professor: Professor; user?: any }> {
    const payload: any = { ...professor };
    // If backend requires pessoaId, create pessoa first when missing
    if (!payload.pessoaId && professor.pessoa) {
      const p = professor.pessoa as any;
      // Reuse createPessoa mapping logic
      const createdPessoa = await this.createPessoa({
        nome: p.nome,
        sexo: p.sexo,
        email: p.email,
        cpf: p.cpf,
        data_nascimento: p.data_nascimento,
        telefone: p.telefone,
        endereco: p.endereco,
      });
      payload.pessoaId = Number(createdPessoa.id);
      delete payload.pessoa;
    }
    const response = await this.api.post('/api/professores', payload);
    return response.data.data;
  }

  async updateProfessor(matricula: string, professor: Partial<CreateProfessor>): Promise<Professor> {
    const response = await this.api.patch(`/api/professores/${matricula}`, professor);
    return response.data.data;
  }

  async deleteProfessor(matricula: string): Promise<void> {
    await this.api.delete(`/api/professores/${matricula}`);
  }

  // Cursos CRUD
  async getCursos(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc' 
  }): Promise<{ data: Curso[]; pagination?: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await this.api.get(`/api/cursos?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.warn('API offline - showing empty cursos list');
      return {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  }

  async getCurso(id: number): Promise<Curso> {
    const response = await this.api.get(`/api/cursos/${id}`);
    const curso = response.data.data as Curso & { periodos?: any[] };
    if (curso?.periodos) {
      curso.periodos = curso.periodos.map((periodo: any) => ({
        ...periodo,
        totalDisciplinas:
          typeof periodo.totalDisciplinas === 'number'
            ? periodo.totalDisciplinas
            : Number(periodo.totalDisciplinas ?? 0),
      }));
    }
    return curso;
  }

  async createCurso(curso: CreateCurso): Promise<Curso> {
    const response = await this.api.post('/api/cursos', curso);
    return response.data.data;
  }

  async updateCurso(id: number, curso: Partial<CreateCurso>): Promise<Curso> {
    const response = await this.api.patch(`/api/cursos/${id}`, curso);
    return response.data.data;
  }

  async deleteCurso(id: number): Promise<void> {
    await this.api.delete(`/api/cursos/${id}`);
  }

  // Turnos CRUD
  async getTurnos(): Promise<import('@/types/api').Turno[]> {
    const response = await this.api.get(`/api/turnos`);
    return response.data.data as import('@/types/api').Turno[];
  }

  async createTurno(payload: { nome: string }): Promise<import('@/types/api').Turno> {
    const response = await this.api.post(`/api/turnos`, payload);
    return response.data.data as import('@/types/api').Turno;
  }

  async updateTurno(id: number, payload: Partial<{ nome: string }>): Promise<import('@/types/api').Turno> {
    const response = await this.api.patch(`/api/turnos/${id}`, payload);
    return response.data.data as import('@/types/api').Turno;
  }

  async deleteTurno(id: number): Promise<void> {
    await this.api.delete(`/api/turnos/${id}`);
  }

  // Curriculos CRUD
  async getCurriculos(params?: {
    cursoId?: number;
    turnoId?: number;
    ativo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<import('@/types/api').Curriculo[]> {
    const queryParams = new URLSearchParams();
    if (params?.cursoId) queryParams.append('cursoId', params.cursoId.toString());
    if (params?.turnoId) queryParams.append('turnoId', params.turnoId.toString());
    if (typeof params?.ativo === 'boolean') queryParams.append('ativo', params.ativo ? 'true' : 'false');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const queryString = queryParams.toString();
    const response = await this.api.get(`/api/curriculos${queryString ? `?${queryString}` : ''}`);
    const payload = response.data;
    const rawData = Array.isArray(payload?.data) ? payload.data : payload?.data?.data ?? payload?.data ?? payload ?? [];
    return rawData as import('@/types/api').Curriculo[];
  }

  async createCurriculo(payload: Partial<import('@/types/api').Curriculo>): Promise<import('@/types/api').Curriculo> {
    const response = await this.api.post(`/api/curriculos`, payload);
    return response.data.data as import('@/types/api').Curriculo;
    }

  async updateCurriculo(id: number, payload: Partial<import('@/types/api').Curriculo>): Promise<import('@/types/api').Curriculo> {
    const response = await this.api.patch(`/api/curriculos/${id}`, payload);
    return response.data.data as import('@/types/api').Curriculo;
  }

  async deleteCurriculo(id: number): Promise<void> {
    await this.api.delete(`/api/curriculos/${id}`);
  }

  // Coortes CRUD
  async getCoortes(): Promise<import('@/types/api').Coorte[]> {
    const response = await this.api.get(`/api/coortes`);
    return response.data.data as import('@/types/api').Coorte[];
  }

  async createCoorte(payload: Partial<import('@/types/api').Coorte>): Promise<import('@/types/api').Coorte> {
    const response = await this.api.post(`/api/coortes`, payload);
    return response.data.data as import('@/types/api').Coorte;
  }

  async updateCoorte(id: number, payload: Partial<import('@/types/api').Coorte>): Promise<import('@/types/api').Coorte> {
    const response = await this.api.patch(`/api/coortes/${id}`, payload);
    return response.data.data as import('@/types/api').Coorte;
  }

  async deleteCoorte(id: number): Promise<void> {
    await this.api.delete(`/api/coortes/${id}`);
  }

  // Periodos CRUD
  async getPeriodos(params?: {
    cursoId?: number;
    turnoId?: number;
    curriculoId?: number;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Periodo[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.cursoId) queryParams.append('cursoId', params.cursoId.toString());
    if (params?.turnoId) queryParams.append('turnoId', params.turnoId.toString());
    if (params?.curriculoId) queryParams.append('curriculoId', params.curriculoId.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const response = await this.api.get(`/api/periodos${queryString ? `?${queryString}` : ''}`);
    const payload = response.data;
    const rawData = Array.isArray(payload.data) ? payload.data : payload.data?.data || [];
    const data = (rawData as any[]).map((periodo) => ({
      ...periodo,
      totalDisciplinas:
        typeof periodo.totalDisciplinas === 'number'
          ? periodo.totalDisciplinas
          : Number(periodo.totalDisciplinas ?? 0),
      totalAlunos:
        typeof periodo.totalAlunos === 'number'
          ? periodo.totalAlunos
          : Number(periodo.totalAlunos ?? 0),
    })) as Periodo[];

    return {
      data,
      pagination: payload.pagination || payload.data?.pagination,
    };
  }

  async getPeriodo(id: number): Promise<Periodo> {
    const response = await this.api.get(`/api/periodos/${id}`);
    const periodo = response.data.data || response.data;
    return {
      ...periodo,
      totalDisciplinas:
        typeof periodo.totalDisciplinas === 'number'
          ? periodo.totalDisciplinas
          : Number(periodo.totalDisciplinas ?? 0),
      totalAlunos:
        typeof periodo.totalAlunos === 'number'
          ? periodo.totalAlunos
          : Number(periodo.totalAlunos ?? 0),
    } as Periodo;
  }

  async createPeriodo(payload: CreatePeriodo): Promise<Periodo> {
    const response = await this.api.post('/api/periodos', payload);
    return response.data.data as Periodo;
  }

  async updatePeriodo(id: number, payload: UpdatePeriodo): Promise<Periodo> {
    const response = await this.api.patch(`/api/periodos/${id}`, payload);
    return response.data.data as Periodo;
  }

  async deletePeriodo(id: number): Promise<void> {
    await this.api.delete(`/api/periodos/${id}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.api.get('/health');
    return response.data;
  }

  // Users CRUD
  async getUsers(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc' 
  }): Promise<{ data: User[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await this.api.get(`/api/users?${queryParams.toString()}`);
      const rows = response.data.data || [];
      const mapped: User[] = rows.map((row: any) => {
        // Support both flat and joined shapes
        const main = row.users ? row.users : row; // drizzle join returns { users, pessoas }
        const pessoa = row.pessoas || row.pessoa || null;
        const base: User = {
          id: Number(main.id),
          pessoaId: Number(main.pessoaId),
          username: main.username,
          role: main.role,
          isActive: (main.isActive as 'S' | 'N') || 'S',
          lastLogin: main.lastLogin || undefined,
          createdAt: main.createdAt,
          updatedAt: main.updatedAt,
        } as User;
        if (pessoa) {
          base.pessoa = {
            id: pessoa.id?.toString?.() || '',
            nome: pessoa.nomeCompleto || pessoa.nome || '',
            sexo: pessoa.sexo,
            cpf: pessoa.cpf || '',
            email: pessoa.email || '',
            telefone: pessoa.telefone || '',
            endereco: typeof pessoa.endereco === 'object' ? JSON.stringify(pessoa.endereco) : pessoa.endereco || '',
            data_nascimento: pessoa.dataNasc || pessoa.data_nascimento || '',
            created_at: pessoa.createdAt || '',
            updated_at: pessoa.updatedAt || '',
          };
        }
        return base;
      });
      return { data: mapped, pagination: response.data.pagination };
    } catch (error: any) {
      console.warn('API offline - showing empty users list');
      return {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  }

  async getUser(id: number): Promise<User> {
    const response = await this.api.get(`/api/users/${id}`);
    const row = response.data.data || {};
    const main = row.users ? row.users : row;
    const pessoa = row.pessoas || row.pessoa || null;
    const base: User = {
      id: Number(main.id),
      pessoaId: Number(main.pessoaId),
      username: main.username,
      role: main.role,
      isActive: (main.isActive as 'S' | 'N') || 'S',
      lastLogin: main.lastLogin || undefined,
      createdAt: main.createdAt,
      updatedAt: main.updatedAt,
    } as User;
    if (pessoa) {
      base.pessoa = {
        id: pessoa.id?.toString?.() || '',
        nome: pessoa.nomeCompleto || pessoa.nome || '',
        sexo: pessoa.sexo,
        cpf: pessoa.cpf || '',
        email: pessoa.email || '',
        telefone: pessoa.telefone || '',
        endereco: typeof pessoa.endereco === 'object' ? JSON.stringify(pessoa.endereco) : pessoa.endereco || '',
        data_nascimento: pessoa.dataNasc || pessoa.data_nascimento || '',
        created_at: pessoa.createdAt || '',
        updated_at: pessoa.updatedAt || '',
      };
    }
    return base;
  }

  async createUser(user: CreateUser): Promise<User> {
    const response = await this.api.post('/api/users', user);
    return response.data.data;
  }

  async updateUser(id: number, user: UpdateUser): Promise<User> {
    const response = await this.api.patch(`/api/users/${id}`, user);
    return response.data.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/api/users/${id}`);
  }

  async changePassword(id: number, passwords: ChangePassword): Promise<void> {
    await this.api.patch(`/api/users/${id}/change-password`, passwords);
  }

  // Disciplinas CRUD
  async getDisciplinas(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc'; 
    cursoId?: number; 
    periodoId?: number; 
    curriculoId?: number; 
  }): Promise<{ data: Disciplina[]; pagination?: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params?.cursoId) queryParams.append('cursoId', params.cursoId.toString());
      if (params?.periodoId) queryParams.append('periodoId', params.periodoId.toString());
      if (params?.curriculoId) queryParams.append('curriculoId', params.curriculoId.toString());

      const queryString = queryParams.toString();
      const response = await this.api.get(`/api/disciplinas${queryString ? `?${queryString}` : ''}`);
      const payload = response.data;
      const rawData = Array.isArray(payload.data) ? payload.data : payload.data?.data || [];
      const data = (rawData as any[]).map((disciplina) => ({
        ...disciplina,
        periodoId: typeof disciplina.periodoId === 'number' ? disciplina.periodoId : Number(disciplina.periodoId ?? 0),
        periodo: disciplina.periodo
          ? {
              ...disciplina.periodo,
              numero: Number(disciplina.periodo.numero ?? disciplina.periodoId ?? 0),
            }
          : undefined,
      })) as Disciplina[];

      return {
        data,
        pagination: payload.pagination || payload.data?.pagination,
      };
    } catch (error: any) {
      console.warn('API offline - showing empty disciplinas list');
      return {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  }

  async getDisciplina(id: number): Promise<Disciplina> {
    const response = await this.api.get(`/api/disciplinas/${id}`);
    const disciplina = response.data.data || response.data;
    return {
      ...disciplina,
      periodoId: typeof disciplina.periodoId === 'number' ? disciplina.periodoId : Number(disciplina.periodoId ?? 0),
      periodo: disciplina.periodo
        ? {
            ...disciplina.periodo,
            numero: Number(disciplina.periodo.numero ?? disciplina.periodoId ?? 0),
          }
        : undefined,
    } as Disciplina;
  }

  async createDisciplina(disciplina: Omit<Disciplina, 'id'>): Promise<Disciplina> {
    const response = await this.api.post('/api/disciplinas', disciplina);
    const created = response.data.data || response.data;
    return {
      ...created,
      periodoId: typeof created.periodoId === 'number' ? created.periodoId : Number(created.periodoId ?? 0),
      periodo: created.periodo
        ? {
            ...created.periodo,
            numero: Number(created.periodo.numero ?? created.periodoId ?? 0),
          }
        : undefined,
    } as Disciplina;
  }

  async updateDisciplina(id: number, disciplina: Partial<Omit<Disciplina, 'id'>>): Promise<Disciplina> {
    const response = await this.api.patch(`/api/disciplinas/${id}`, disciplina);
    const updated = response.data.data || response.data;
    return {
      ...updated,
      periodoId: typeof updated.periodoId === 'number' ? updated.periodoId : Number(updated.periodoId ?? 0),
      periodo: updated.periodo
        ? {
            ...updated.periodo,
            numero: Number(updated.periodo.numero ?? updated.periodoId ?? 0),
          }
        : undefined,
    } as Disciplina;
  }

  async deleteDisciplina(id: number): Promise<void> {
    await this.api.delete(`/api/disciplinas/${id}`);
  }

  // Turmas CRUD
  async getTurmas(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc' 
  }): Promise<{ data: Turma[]; pagination?: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await this.api.get(`/api/turmas?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.warn('API offline - showing empty turmas list');
      return {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  }

  async getTurma(id: number): Promise<Turma> {
    const response = await this.api.get(`/api/turmas/${id}`);
    return response.data.data;
  }

  async createTurma(turma: CreateTurma): Promise<Turma> {
    const response = await this.api.post('/api/turmas', turma);
    return response.data.data;
  }

  async updateTurma(id: number, turma: Partial<CreateTurma>): Promise<Turma> {
    const response = await this.api.patch(`/api/turmas/${id}`, turma);
    return response.data.data;
  }

  async deleteTurma(id: number): Promise<void> {
    await this.api.delete(`/api/turmas/${id}`);
  }

  // Semestres removidos
}

export const apiService = new ApiService();
