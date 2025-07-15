export enum Role {
  ADMIN = 'ADMIN',
  SECRETARIA = 'SECRETARIA',
  PROFESSOR = 'PROFESSOR',
  ALUNO = 'ALUNO'
}

export interface User {
  id: number;
  pessoaId: number;
  username: string;
  role: Role;
  isActive: 'S' | 'N';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  pessoa?: Pessoa;
}

export interface CreateUser {
  pessoaId: number;
  username: string;
  password: string;
  role: Role;
  isActive?: 'S' | 'N';
}

export interface UpdateUser {
  username?: string;
  password?: string;
  role?: Role;
  isActive?: 'S' | 'N';
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface Pessoa {
  id: string;
  nome: string;
  sexo?: 'M' | 'F';
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  data_nascimento?: string;
  created_at: string;
  updated_at: string;
}

export interface Aluno {
  id: string;
  ra: string;
  pessoa_id: string;
  curso_id?: string;
  status: 'ATIVO' | 'INATIVO' | 'TRANCADO' | 'FORMADO';
  data_matricula: string;
  created_at: string;
  updated_at: string;
  pessoa?: Pessoa;
}

export interface Professor {
  id: string;
  matricula: string;
  pessoa_id: string;
  especialidade?: string;
  status: 'ATIVO' | 'INATIVO';
  data_contratacao: string;
  created_at: string;
  updated_at: string;
  pessoa?: Pessoa;
}

export interface Curso {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  grau: 'BACHARELADO' | 'LICENCIATURA' | 'ESPECIALIZACAO' | 'MESTRADO';
  duracao_semestres: number;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}