import { Request, Response } from 'express';
import { eq, or, like, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { ZodObject } from 'zod';
import bcrypt from 'bcryptjs';

interface EnhancedCrudOptions {
  table: any;
  primaryKey?: string; // Campo da chave primária (padrão: 'id')
  createSchema?: ZodObject<any>;
  updateSchema?: ZodObject<any>;
  joinTables?: {
    table: any;
    on: any;
    select?: any;
  }[];
  searchFields?: string[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  passwordFields?: string[];
}

export class EnhancedCrudFactory {
  constructor(private options: EnhancedCrudOptions) {}

  // GET /resource - List all with optional search and pagination
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    let query: any;
    
    // Build select query; when using joins, rely on Drizzle's default field ordering
    if (this.options.joinTables) {
      query = db.select().from(this.options.table);
      for (const join of this.options.joinTables) {
        query = query.leftJoin(join.table, join.on);
      }
    } else {
      query = db.select().from(this.options.table);
    }

    // Add search if specified
    if (search && this.options.searchFields) {
      const searchConditions = this.options.searchFields.map(field =>
        like(this.options.table[field], `%${search}%`)
      );
      query = query.where(or(...searchConditions));
    }

    // Add ordering (skip when joins are present due to drizzle bug with orderSelectedFields)
    const primaryKeyField = this.options.primaryKey || 'id';
    if (!this.options.joinTables) {
      const orderField = this.options.table[sortBy as string] || this.options.table[primaryKeyField];
      const orderDirection = sortOrder === 'desc' ? desc : asc;
      query = query.orderBy(orderDirection(orderField));
    }

    // Add pagination
    const data = await query.limit(limitNum).offset(offset);

    // Get total count for pagination
    const countQuery = search && this.options.searchFields
      ? (() => {
          const searchConditions = this.options.searchFields!.map(field =>
        like(this.options.table[field], `%${search}%`)
      );
          return db.select({ count: this.options.table[primaryKeyField] }).from(this.options.table).where(or(...searchConditions));
        })()
      : db.select({ count: this.options.table[primaryKeyField] }).from(this.options.table);
    
    const countResult = await countQuery;
    const total = countResult.length;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
      message: `Found ${data.length} records`,
    });
  });

  // GET /resource/:id - Get by ID with joins
  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = this.parseId(req.params.id);
    
    let query: any;
    
    // Build select query with explicit field selection when using joins
    if (this.options.joinTables) {
      // Create explicit select for main table fields
      const mainTableFields: any = {};
      const tableColumns = Object.keys(this.options.table);
      
      // Add all fields from main table
      for (const column of tableColumns) {
        if (this.options.table[column]) {
          mainTableFields[column] = this.options.table[column];
        }
      }
      
      query = db.select(mainTableFields).from(this.options.table);
      
      // Add joins
      for (const join of this.options.joinTables) {
        query = query.leftJoin(join.table, join.on);
      }
    } else {
      query = db.select().from(this.options.table);
    }

    const [result] = await query
      .where(eq(this.options.table[this.options.primaryKey || 'id'], id))
      .limit(1);

    if (!result) {
      throw createError('Resource not found', 404);
    }

    res.json({
      success: true,
      data: result,
    });
  });

  // POST /resource - Create new resource with password hashing
  create = asyncHandler(async (req: Request, res: Response) => {
    if (this.options.createSchema) {
      req.body = this.options.createSchema.parse(req.body);
    }

    // Hash password fields if specified
    const insertData = { ...req.body };
    if (this.options.passwordFields) {
      for (const field of this.options.passwordFields) {
        if (insertData[field]) {
          insertData[field.replace('password', 'passwordHash')] = await bcrypt.hash(insertData[field], 12);
          delete insertData[field];
        }
      }
    }

    const result = await db
      .insert(this.options.table)
      .values(insertData)
      .returning();

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: result[0],
    });
  });

  // PATCH /resource/:id - Update resource
  update = asyncHandler(async (req: Request, res: Response) => {
    const id = this.parseId(req.params.id);

    if (this.options.updateSchema) {
      req.body = this.options.updateSchema.parse(req.body);
    }

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([key, value]) => value !== undefined)
    );

    // Hash password fields if specified
    if (this.options.passwordFields) {
      for (const field of this.options.passwordFields) {
        if (updateData[field] && typeof updateData[field] === 'string') {
          updateData[field.replace('password', 'passwordHash')] = await bcrypt.hash(updateData[field] as string, 12);
          delete updateData[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw createError('No valid fields to update', 400);
    }

    const result = await db
      .update(this.options.table)
      .set(updateData)
      .where(eq(this.options.table[this.options.primaryKey || 'id'], id))
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
    const id = this.parseId(req.params.id);

    const result = await db
      .delete(this.options.table)
      .where(eq(this.options.table[this.options.primaryKey || 'id'], id))
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

  // Helper method to parse ID (handles both string and numeric IDs)
  private parseId(id: string): any {
    // If ID looks like a number, parse it as integer
    if (/^\d+$/.test(id)) {
      return parseInt(id);
    }
    // Otherwise return as string (for cases like RA, matricula)
    return id;
  }

  // Custom method for password change
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const id = this.parseId(req.params.id);
    const { currentPassword, newPassword } = req.body;
    const requester = (req as any).user || {};
    const isAdmin = requester?.role === 'ADMIN';

    // Get current user
    const user = await db
      .select()
      .from(this.options.table)
      .where(eq(this.options.table[this.options.primaryKey || 'id'], id))
      .limit(1);

    if (user.length === 0) {
      throw createError('User not found', 404);
    }

    // Enforce ownership: non-admin can only change own password
    if (!isAdmin && requester?.id?.toString?.() !== String(user[0].id)) {
      throw createError('Forbidden - You can only change your own password', 403);
    }

    // Admin override: ADMIN may change password without current password for non-admin targets
    const targetRole = (user[0] as any).role;
    const canBypassCurrent = isAdmin && targetRole !== 'ADMIN' && String(requester?.id) !== String(user[0].id);

    if (!canBypassCurrent) {
      // Require and verify current password
      if (!currentPassword || typeof currentPassword !== 'string') {
        throw createError('Current password is required', 400);
      }
      const isValidPassword = await bcrypt.compare(currentPassword, (user[0] as any).passwordHash);
      if (!isValidPassword) {
        throw createError('Current password is incorrect', 400);
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    const result = await db
      .update(this.options.table)
      .set({ passwordHash: newPasswordHash })
      .where(eq(this.options.table[this.options.primaryKey || 'id'], id))
      .returning();

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: { [this.options.primaryKey || 'id']: result[0][this.options.primaryKey || 'id'] },
    });
  });
}