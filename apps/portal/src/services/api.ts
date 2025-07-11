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

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
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
    const response: AxiosResponse<Pessoa[]> = await this.api.get('/api/pessoas');
    return response.data;
  }

  async getPessoa(id: string): Promise<Pessoa> {
    const response: AxiosResponse<Pessoa> = await this.api.get(`/api/pessoas/${id}`);
    return response.data;
  }

  async createPessoa(pessoa: Omit<Pessoa, 'id' | 'created_at' | 'updated_at'>): Promise<Pessoa> {
    const response: AxiosResponse<Pessoa> = await this.api.post('/api/pessoas', pessoa);
    return response.data;
  }

  async updatePessoa(id: string, pessoa: Partial<Pessoa>): Promise<Pessoa> {
    const response: AxiosResponse<Pessoa> = await this.api.patch(`/api/pessoas/${id}`, pessoa);
    return response.data;
  }

  async deletePessoa(id: string): Promise<void> {
    await this.api.delete(`/api/pessoas/${id}`);
  }

  // Alunos CRUD
  async getAlunos(): Promise<Aluno[]> {
    const response: AxiosResponse<Aluno[]> = await this.api.get('/api/alunos');
    return response.data;
  }

  async getAluno(ra: string): Promise<Aluno> {
    const response: AxiosResponse<Aluno> = await this.api.get(`/api/alunos/${ra}`);
    return response.data;
  }

  // Professores CRUD
  async getProfessores(): Promise<Professor[]> {
    const response: AxiosResponse<Professor[]> = await this.api.get('/api/professores');
    return response.data;
  }

  // Cursos CRUD
  async getCursos(): Promise<Curso[]> {
    const response: AxiosResponse<Curso[]> = await this.api.get('/api/cursos');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();