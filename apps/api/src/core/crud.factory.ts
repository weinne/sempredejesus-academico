import { Request, Response } from 'express';
import { SQL, eq, and, or, like, ilike, gte, lte, sql } from 'drizzle-orm';
import { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { Pagination, Filter } from '@seminario/shared-dtos';
import { AnyZodObject } from 'zod';

interface CrudOptions {
  table: any; // More flexible typing for Drizzle tables
  createSchema?: AnyZodObject;
  updateSchema?: AnyZodObject;
  searchFields?: string[];
  allowedFilters?: string[];
  defaultLimit?: number;
  maxLimit?: number;
}

export class CrudFactory {
  constructor(private options: CrudOptions) {}

  // GET /resource - List with pagination and filtering
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      this.options.maxLimit || 100,
      Math.max(1, parseInt(req.query.limit as string) || this.options.defaultLimit || 10)
    );
    const offset = (page - 1) * limit;

    const searchTerm = req.query.search as string;
    const filters = this.parseFilters(req.query.filter as string);

    // Build where conditions
    const whereConditions: SQL[] = [];

    // Add search conditions
    if (searchTerm && this.options.searchFields) {
      const searchConditions: SQL[] = [];
      
      for (const field of this.options.searchFields) {
        if (this.options.table[field]) {
          searchConditions.push(ilike(this.options.table[field], `%${searchTerm}%`));
        }
      }
      
      if (searchConditions.length > 0) {
        const orCondition = or(...searchConditions);
        if (orCondition) {
          whereConditions.push(orCondition);
        }
      }
    }

    // Add filter conditions
    if (filters.length > 0) {
      whereConditions.push(...filters);
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Execute queries
    let dataQuery = db.select().from(this.options.table);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(this.options.table);
    
    if (whereClause) {
      dataQuery = dataQuery.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }
    
    const [data, totalResult] = await Promise.all([
      dataQuery.limit(limit).offset(offset),
      countQuery,
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  });

  // GET /resource/:id - Get by ID
  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const primaryKey = this.getPrimaryKey();
    
    if (!this.options.table[primaryKey]) {
      throw createError('Invalid primary key', 500);
    }
    
    const result = await db
      .select()
      .from(this.options.table)
      .where(eq(this.options.table[primaryKey], id))
      .limit(1);

    if (result.length === 0) {
      throw createError('Resource not found', 404);
    }

    res.json({
      success: true,
      data: result[0],
    });
  });

  // POST /resource - Create new resource
  create = asyncHandler(async (req: Request, res: Response) => {
    if (this.options.createSchema) {
      req.body = this.options.createSchema.parse(req.body);
    }

    const result = await db
      .insert(this.options.table)
      .values(req.body)
      .returning();

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: result[0],
    });
  });

  // PATCH /resource/:id - Update resource
  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const primaryKey = this.getPrimaryKey();

    if (this.options.updateSchema) {
      req.body = this.options.updateSchema.parse(req.body);
    }

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      throw createError('No valid fields to update', 400);
    }

    if (!this.options.table[primaryKey]) {
      throw createError('Invalid primary key', 500);
    }

    const result = await db
      .update(this.options.table)
      .set(updateData)
      .where(eq(this.options.table[primaryKey], id))
      .returning();

    if (result.length === 0) {
      throw createError('Resource not found', 404);
    }

    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: result[0],
    });
  });

  // DELETE /resource/:id - Delete resource
  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const primaryKey = this.getPrimaryKey();

    if (!this.options.table[primaryKey]) {
      throw createError('Invalid primary key', 500);
    }

    const result = await db
      .delete(this.options.table)
      .where(eq(this.options.table[primaryKey], id))
      .returning();

    if (result.length === 0) {
      throw createError('Resource not found', 404);
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully',
      data: result[0],
    });
  });

  private getPrimaryKey(): string {
    // Simple heuristic to find primary key - assumes 'id' or first field
    const columns = Object.keys(this.options.table);
    return columns.includes('id') ? 'id' : columns[0];
  }

  private parseFilters(filterString?: string): SQL[] {
    if (!filterString || !this.options.allowedFilters) return [];

    const filters: SQL[] = [];
    const filterParts = filterString.split(',');

    for (const part of filterParts) {
      const [field, operator, value] = part.split(':');
      
      if (!field || !operator || value === undefined) continue;
      if (!this.options.allowedFilters.includes(field)) continue;

      const column = this.options.table[field];
      if (!column) continue;

      switch (operator) {
        case 'eq':
          filters.push(eq(column, value));
          break;
        case 'like':
          filters.push(like(column, `%${value}%`));
          break;
        case 'gte':
          filters.push(gte(column, value));
          break;
        case 'lte':
          filters.push(lte(column, value));
          break;
        default:
          // Skip unknown operators
          break;
      }
    }

    return filters;
  }
} 