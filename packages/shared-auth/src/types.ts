export enum UserRole {
  ADMIN = 'ADMIN',
  SECRETARIA = 'SECRETARIA', 
  PROFESSOR = 'PROFESSOR',
  ALUNO = 'ALUNO'
}

export interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  pessoaId: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  pessoaId: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  user: Omit<User, 'senha'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
} 