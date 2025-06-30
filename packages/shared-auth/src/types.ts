export interface JwtPayload {
  sub: string;
  role: 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'ALUNO';
  exp: number;
  iat: number;
}

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'ALUNO';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
} 