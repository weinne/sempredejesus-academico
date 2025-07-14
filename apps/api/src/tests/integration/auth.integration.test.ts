import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/test-app';
import { createTestUser, cleanupTestData } from '../helpers/test-data';

describe('Authentication Integration Tests', () => {
  let app: Express;
  let testUserId: string;
  
  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    testUserId = await createTestUser({
      email: 'test@seminario.edu',
      password: 'TestPassword123!',
      role: 'ADMIN',
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@seminario.edu',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: expect.any(String),
            email: 'test@seminario.edu',
            role: 'ADMIN',
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // Verify JWT format
      const { accessToken } = response.body.data;
      expect(accessToken.split('.')).toHaveLength(3);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@seminario.edu',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('inválid'),
      });
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@seminario.edu',
          password: 'TestPassword123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@seminario.edu',
          // password missing
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
          }),
        ]),
      });
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('email'),
          }),
        ]),
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@seminario.edu',
          password: 'TestPassword123!',
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // New tokens should be different from original
      expect(response.body.data.accessToken).not.toBe(refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid.refresh.token',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it('should validate required refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          // refreshToken missing
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation error',
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@seminario.edu',
          password: 'TestPassword123!',
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
      });
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Token'),
      });
    });

    it('should reject blacklisted token after logout', async () => {
      // First logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use same token again
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('revogado'),
      });
    });
  });

  describe('Protected Routes Authentication', () => {
    let accessToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@seminario.edu',
          password: 'TestPassword123!',
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/pessoas')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });
    });

    it('should reject protected route without token', async () => {
      const response = await request(app)
        .get('/api/pessoas')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Token'),
      });
    });

    it('should reject protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/pessoas')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('inválido'),
      });
    });

    it('should reject protected route with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/pessoas')
        .set('Authorization', 'NotBearer token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Formato'),
      });
    });
  });

  describe('Role-Based Access Control', () => {
    let adminToken: string;
    let professorToken: string;

    beforeEach(async () => {
      // Create admin user
      await createTestUser({
        email: 'admin@seminario.edu',
        password: 'AdminPassword123!',
        role: 'ADMIN',
      });

      // Create professor user
      await createTestUser({
        email: 'professor@seminario.edu',
        password: 'ProfessorPassword123!',
        role: 'PROFESSOR',
      });

      // Login as admin
      const adminResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@seminario.edu',
          password: 'AdminPassword123!',
        });
      adminToken = adminResponse.body.data.accessToken;

      // Login as professor
      const professorResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'professor@seminario.edu',
          password: 'ProfessorPassword123!',
        });
      professorToken = professorResponse.body.data.accessToken;
    });

    it('should allow admin to access admin-only endpoints', async () => {
      const response = await request(app)
        .post('/api/pessoas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Test Person',
          email: 'person@test.com',
          cpf: '12345678901',
          telefone: '11999999999',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          nome: 'Test Person',
        }),
      });
    });

    it('should reject professor from admin-only endpoints', async () => {
      const response = await request(app)
        .post('/api/pessoas')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          nome: 'Test Person',
          email: 'person@test.com',
          cpf: '12345678901',
          telefone: '11999999999',
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Acesso negado'),
      });
    });

    it('should allow both admin and professor to access shared endpoints', async () => {
      // Admin access
      const adminResponse = await request(app)
        .get('/api/pessoas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminResponse.body.success).toBe(true);

      // Professor access
      const professorResponse = await request(app)
        .get('/api/pessoas')
        .set('Authorization', `Bearer ${professorToken}`)
        .expect(200);

      expect(professorResponse.body.success).toBe(true);
    });
  });
}); 