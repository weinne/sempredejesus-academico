import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../../../middleware/validation.middleware';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    
    mockNext = vi.fn() as any;
    
    vi.clearAllMocks();
  });

  describe('validateBody', () => {
    it('should pass validation with valid body', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().min(0),
      });

      const middleware = validateBody(schema);

      mockRequest.body = {
        name: 'João Silva',
        email: 'joao@example.com',
        age: 25,
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid body with validation errors', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().min(0),
      });

      const middleware = validateBody(schema);

      mockRequest.body = {
        name: '', // Invalid: empty string
        email: 'invalid-email', // Invalid: not an email
        age: -5, // Invalid: negative number
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'age',
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing required fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      const middleware = validateBody(schema);

      mockRequest.body = {
        name: 'João Silva',
        // email missing
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle nested object validation', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          contact: z.object({
            email: z.string().email(),
            phone: z.string(),
          }),
        }),
      });

      const middleware = validateBody(schema);

      mockRequest.body = {
        user: {
          name: 'João Silva',
          contact: {
            email: 'joao@example.com',
            phone: '11999999999',
          },
        },
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle array validation', () => {
      const schema = z.object({
        tags: z.array(z.string()),
        numbers: z.array(z.number()),
      });

      const middleware = validateBody(schema);

      mockRequest.body = {
        tags: ['tag1', 'tag2', 'tag3'],
        numbers: [1, 2, 3, 4, 5],
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle optional fields', () => {
      const schema = z.object({
        name: z.string(),
        description: z.string().optional(),
        tags: z.array(z.string()).default([]),
      });

      const middleware = validateBody(schema);

      mockRequest.body = {
        name: 'Test Item',
        // description is optional
        // tags will use default
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('validateParams', () => {
    it('should pass validation with valid params', () => {
      const schema = z.object({
        id: z.string().uuid(),
        type: z.enum(['user', 'admin']),
      });

      const middleware = validateParams(schema);

      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'user',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid params', () => {
      const schema = z.object({
        id: z.string().uuid(),
        type: z.enum(['user', 'admin']),
      });

      const middleware = validateParams(schema);

      mockRequest.params = {
        id: 'invalid-uuid',
        type: 'invalid-type',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid parameters',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'type',
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle numeric ID validation', () => {
      const schema = z.object({
        id: z.string().transform(val => parseInt(val)).pipe(z.number().positive()),
      });

      const middleware = validateParams(schema);

      mockRequest.params = {
        id: '123',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('validateQuery', () => {
    it('should pass validation with valid query parameters', () => {
      const schema = z.object({
        page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default('1'),
        limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).default('10'),
        search: z.string().optional(),
      });

      const middleware = validateQuery(schema);

      mockRequest.query = {
        page: '2',
        limit: '20',
        search: 'test query',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid query parameters', () => {
      const schema = z.object({
        page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)),
        limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)),
      });

      const middleware = validateQuery(schema);

      mockRequest.query = {
        page: '0', // Invalid: less than 1
        limit: '200', // Invalid: greater than 100
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid query parameters',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'page',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'limit',
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle boolean query parameters', () => {
      const schema = z.object({
        active: z.string().transform(val => val === 'true').pipe(z.boolean()),
        verified: z.string().transform(val => val === 'true').pipe(z.boolean()).default('false'),
      });

      const middleware = validateQuery(schema);

      mockRequest.query = {
        active: 'true',
        // verified will use default
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle array query parameters', () => {
      const schema = z.object({
        tags: z.string().transform(val => val.split(',')).pipe(z.array(z.string())).optional(),
        ids: z.string().transform(val => val.split(',').map(id => parseInt(id))).pipe(z.array(z.number())).optional(),
      });

      const middleware = validateQuery(schema);

      mockRequest.query = {
        tags: 'tag1,tag2,tag3',
        ids: '1,2,3,4',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should use default values for missing query parameters', () => {
      const schema = z.object({
        page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default('1'),
        limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).default('10'),
      });

      const middleware = validateQuery(schema);

      mockRequest.query = {}; // No query parameters provided

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Error Formatting', () => {
    it('should format validation errors consistently', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const middleware = validateBody(schema);

      mockRequest.body = {
        email: 'invalid-email',
        age: 15,
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      });
    });
  });
}); 