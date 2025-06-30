import { JwtPayload } from '@seminario/shared-dtos';

export class AuthTestHelper {
  static createMockJwtPayload(overrides: Partial<JwtPayload> = {}): JwtPayload {
    return {
      sub: 'test-user-123',
      role: 'ALUNO',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
      ...overrides,
    };
  }

  static createMockUser(role: 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'ALUNO' = 'ALUNO') {
    return {
      id: 'test-user-123',
      nome: 'Usuário Teste',
      email: 'teste@seminario.edu',
      role,
    };
  }

  static createExpiredToken(): JwtPayload {
    return this.createMockJwtPayload({
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    });
  }

  static createAdminUser() {
    return this.createMockUser('ADMIN');
  }

  static createSecretariaUser() {
    return this.createMockUser('SECRETARIA');
  }

  static createProfessorUser() {
    return this.createMockUser('PROFESSOR');
  }

  static createAlunoUser() {
    return this.createMockUser('ALUNO');
  }
} 