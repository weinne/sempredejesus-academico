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
  ra: string;
  pessoaId: number;
  cursoId: number;
  anoIngresso: number;
  igreja?: string;
  situacao: 'ATIVO' | 'TRANCADO' | 'CONCLUIDO' | 'CANCELADO';
  coeficienteAcad?: number;
  createdAt: string;
  updatedAt: string;
  pessoa?: Pessoa;
  curso?: Curso;
}

export interface CreateAluno {
  ra: string;
  pessoaId: number;
  cursoId: number;
  anoIngresso: number;
  igreja?: string;
  situacao: 'ATIVO' | 'TRANCADO' | 'CONCLUIDO' | 'CANCELADO';
  coeficienteAcad?: number;
}

export interface CreateAlunoWithUser extends CreateAluno {
  createUser?: boolean;
  username?: string;
  password?: string;
}

export interface Professor {
  matricula: string;
  pessoaId: number;
  dataInicio: string;
  formacaoAcad?: string;
  situacao: 'ATIVO' | 'INATIVO';
  pessoa?: Pessoa;
}

export interface CreateProfessor {
  matricula: string;
  pessoaId: number;
  dataInicio: string;
  formacaoAcad?: string;
  situacao: 'ATIVO' | 'INATIVO';
}

export interface CreateProfessorWithUser extends CreateProfessor {
  createUser?: boolean;
  username?: string;
  password?: string;
}

export interface Curso {
  id: number;
  nome: string;
  grau: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}