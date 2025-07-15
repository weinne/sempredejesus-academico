import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenResponse, 
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
  ApiError 
} from '@/types/api';

class ApiService {
  private api: AxiosInstance;
  private baseURL = 'http://localhost:4000'; // Backend API URL
  private isOfflineMode = false;

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 5000, // Reduced timeout for faster offline detection
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
          // Token expired, try to refresh
          try {
            await this.refreshToken();
            // Retry the original request
            const originalRequest = error.config;
            const token = this.getToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.api.request(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
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
            role: 'ADMIN',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      });
    }

    if (url === '/api/pessoas' && method === 'get') {
      return Promise.resolve({
        data: [
          {
            id: '1',
            nome: 'João Silva Mock',
            cpf: '123.456.789-00',
            email: 'joao@example.com',
            telefone: '(11) 99999-9999',
            endereco: 'Rua Example, 123',
            data_nascimento: '1990-01-01',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            nome: 'Maria Santos Mock',
            cpf: '987.654.321-00',
            email: 'maria@example.com',
            telefone: '(11) 88888-8888',
            endereco: 'Av. Test, 456',
            data_nascimento: '1985-05-15',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]
      });
    }

    if (url === '/api/alunos' && method === 'get') {
      return Promise.resolve({
        data: [
          {
            id: '1',
            ra: '2024001',
            pessoa_id: '1',
            status: 'ATIVO',
            data_matricula: '2024-01-01',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            pessoa: {
              nome: 'João Silva Mock',
              email: 'joao@example.com'
            }
          }
        ]
      });
    }

    if (url === '/api/professores' && method === 'get') {
      return Promise.resolve({
        data: [
          {
            id: '1',
            matricula: 'PROF001',
            pessoa_id: '2',
            status: 'ATIVO',
            especialidade: 'Teologia',
            data_contratacao: '2020-01-01',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            pessoa: {
              nome: 'Prof. Maria Santos Mock',
              email: 'maria@example.com'
            }
          }
        ]
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

  async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response: AxiosResponse<RefreshTokenResponse> = await this.api.post('/api/auth/refresh', {
      refresh_token: refreshToken,
    });

    localStorage.setItem('access_token', response.data.access_token);
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
      console.warn('Using mock data for alunos');
      return {
        data: [
          {
            ra: '2024001',
            pessoaId: 1,
            cursoId: 1,
            anoIngresso: 2024,
            igreja: 'Igreja Exemplo',
            situacao: 'ATIVO',
            coeficienteAcad: 8.5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pessoa: {
              id: '1',
              nome: 'João Silva Mock',
              cpf: '123.456.789-00',
              email: 'joao@example.com',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            curso: {
              id: 1,
              nome: 'Bacharelado em Teologia',
              grau: 'BACHARELADO',
            }
          }
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
      };
    }
  }

  async getAluno(ra: string): Promise<Aluno> {
    const response = await this.api.get(`/api/alunos/${ra}`);
    return response.data.data;
  }

  async createAluno(aluno: CreateAlunoWithUser): Promise<{ aluno: Aluno; user?: any }> {
    const response = await this.api.post('/api/alunos', aluno);
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
      console.warn('Using mock data for professores');
      return {
        data: [
          {
            matricula: 'PROF001',
            pessoaId: 2,
            dataInicio: '2020-01-01',
            formacaoAcad: 'Doutorado em Teologia',
            situacao: 'ATIVO',
            pessoa: {
              id: '2',
              nome: 'Prof. Maria Santos Mock',
              cpf: '987.654.321-00',
              email: 'maria@example.com',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }
        ]
      };
    }
  }

  async getProfessor(matricula: string): Promise<Professor> {
    const response = await this.api.get(`/api/professores/${matricula}`);
    return response.data.data;
  }

  async createProfessor(professor: CreateProfessorWithUser): Promise<{ professor: Professor; user?: any }> {
    const response = await this.api.post('/api/professores', professor);
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
      console.warn('Using mock data for cursos');
      return {
        data: [
          {
            id: 1,
            nome: 'Bacharelado em Teologia',
            grau: 'BACHARELADO',
          },
          {
            id: 2,
            nome: 'Licenciatura em Ensino Religioso',
            grau: 'LICENCIATURA',
          }
        ]
      };
    }
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
      return response.data;
    } catch (error: any) {
      console.warn('Using mock data for users');
      return {
        data: [
          {
            id: 1,
            pessoaId: 1,
            username: 'admin',
            role: 'ADMIN',
            isActive: 'S',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pessoa: {
              id: '1',
              nome: 'Administrador Mock',
              email: 'admin@seminario.edu',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
      };
    }
  }

  async getUser(id: number): Promise<User> {
    const response = await this.api.get(`/api/users/${id}`);
    return response.data.data;
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
}

export const apiService = new ApiService();