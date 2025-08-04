import request from 'supertest';

export class ApiTestHelper {
  constructor(private app: any) {}

  async login(email: string, password: string) {
    const response = await request(this.app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    return response.body.accessToken;
  }

  async authenticatedRequest(token: string, method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string): Promise<any> {
    return request(this.app)
      [method](path)
      .set('Authorization', `Bearer ${token}`);
  }

  async createTestUser(userData: any): Promise<any> {
    return request(this.app)
      .post('/api/pessoas')
      .send(userData);
  }

  async cleanupTestData() {
    // Helper para limpar dados de teste
    // Será implementado conforme necessário
  }
}

export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  if (field) {
    expect(response.body.errors).toContain(field);
  }
};

export const expectUnauthorized = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
};

export const expectForbidden = (response: any) => {
  expect(response.status).toBe(403);
  expect(response.body.success).toBe(false);
}; 