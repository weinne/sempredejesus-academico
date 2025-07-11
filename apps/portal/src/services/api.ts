import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenResponse, 
  User, 
  Pessoa, 
  Aluno, 
  Professor, 
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
          console.warn('🚨 Backend offline - using mock data for development');
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
    const response: AxiosResponse<LoginResponse> = await this.api.post('/api/auth/login', credentials);
    this.setTokens(response.data.access_token, response.data.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
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
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Pessoas CRUD
  async getPessoas(): Promise<Pessoa[]> {
    try {
      const response: AxiosResponse<Pessoa[]> = await this.api.get('/api/pessoas');
      return response.data;
    } catch (error: any) {
      // If backend is offline, return mock data
      console.warn('Using mock data for pessoas');
      return [
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
      ];
    }
  }

  async getPessoa(id: string): Promise<Pessoa> {
    const response: AxiosResponse<Pessoa> = await this.api.get(`/api/pessoas/${id}`);
    return response.data;
  }

  async createPessoa(pessoa: Omit<Pessoa, 'id' | 'created_at' | 'updated_at'>): Promise<Pessoa> {
    try {
      const response: AxiosResponse<Pessoa> = await this.api.post('/api/pessoas', pessoa);
      return response.data;
    } catch (error: any) {
      console.warn('Using mock data for create pessoa');
      return {
        id: Date.now().toString(),
        ...pessoa,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  async updatePessoa(id: string, pessoa: Partial<Pessoa>): Promise<Pessoa> {
    try {
      const response: AxiosResponse<Pessoa> = await this.api.patch(`/api/pessoas/${id}`, pessoa);
      return response.data;
    } catch (error: any) {
      console.warn('Using mock data for update pessoa');
      return {
        id,
        nome: '',
        cpf: '',
        email: '',
        created_at: new Date().toISOString(),
        ...pessoa,
        updated_at: new Date().toISOString(),
      } as Pessoa;
    }
  }

  async deletePessoa(id: string): Promise<void> {
    try {
      await this.api.delete(`/api/pessoas/${id}`);
    } catch (error: any) {
      console.warn('Mock delete pessoa - no action needed');
      // Mock delete always succeeds
    }
  }

  // Alunos CRUD
  async getAlunos(): Promise<Aluno[]> {
    try {
      const response: AxiosResponse<Aluno[]> = await this.api.get('/api/alunos');
      return response.data;
    } catch (error: any) {
      console.warn('Using mock data for alunos');
      return [
        {
          id: '1',
          ra: '2024001',
          pessoa_id: '1',
          status: 'ATIVO',
          data_matricula: '2024-01-01',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pessoa: {
            id: '1',
            nome: 'João Silva Mock',
            cpf: '123.456.789-00',
            email: 'joao@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      ];
    }
  }

  async getAluno(ra: string): Promise<Aluno> {
    const response: AxiosResponse<Aluno> = await this.api.get(`/api/alunos/${ra}`);
    return response.data;
  }

  // Professores CRUD
  async getProfessores(): Promise<Professor[]> {
    try {
      const response: AxiosResponse<Professor[]> = await this.api.get('/api/professores');
      return response.data;
    } catch (error: any) {
      console.warn('Using mock data for professores');
      return [
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
            id: '2',
            nome: 'Prof. Maria Santos Mock',
            cpf: '987.654.321-00',
            email: 'maria@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      ];
    }
  }

  // Cursos CRUD
  async getCursos(): Promise<Curso[]> {
    try {
      const response: AxiosResponse<Curso[]> = await this.api.get('/api/cursos');
      return response.data;
    } catch (error: any) {
      console.warn('Using mock data for cursos');
      return [
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
      ];
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();