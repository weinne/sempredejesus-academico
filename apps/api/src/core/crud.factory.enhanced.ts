import { Request, Response } from 'express';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { AnyZodObject } from 'zod';
import bcrypt from 'bcrypt';

interface EnhancedCrudOptions {
  table: any;
  createSchema?: AnyZodObject;
  updateSchema?: AnyZodObject;
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

    let query = db.select().from(this.options.table);

    // Add joins if specified
    if (this.options.joinTables) {
      for (const join of this.options.joinTables) {
        query = query.leftJoin(join.table, join.on);
      }
    }

    // Add search if specified
    if (search && this.options.searchFields) {
      const searchConditions = this.options.searchFields.map(field =>
        like(this.options.table[field], `%${search}%`)
      );
      query = query.where(or(...searchConditions));
    }

    // Add ordering
    const orderField = this.options.table[sortBy as string] || this.options.table.id;
    const orderDirection = sortOrder === 'desc' ? desc : asc;
    query = query.orderBy(orderDirection(orderField));

    // Add pagination
    const data = await query.limit(limitNum).offset(offset);

    // Get total count for pagination
    let countQuery = db.select({ count: this.options.table.id }).from(this.options.table);
    if (search && this.options.searchFields) {
      const searchConditions = this.options.searchFields.map(field =>
        like(this.options.table[field], `%${search}%`)
      );
      countQuery = countQuery.where(or(...searchConditions));
    }
    
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
    
    let query = db.select().from(this.options.table);

    // Add joins if specified
    if (this.options.joinTables) {
      for (const join of this.options.joinTables) {
        query = query.leftJoin(join.table, join.on);
      }
    }

    const result = await query
      .where(eq(this.options.table.id || this.options.table[Object.keys(this.options.table)[0]], id))
      .limit(1);

    if (result.length === 0) {
      throw createError('Resource not found', 404);
    }

    res.json({
      success: true,
      data: result[0],
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
      Object.entries(req.body).filter(([_, value]) => value !== undefined)
    );

    // Hash password fields if specified
    if (this.options.passwordFields) {
      for (const field of this.options.passwordFields) {
        if (updateData[field]) {
          updateData[field.replace('password', 'passwordHash')] = await bcrypt.hash(updateData[field], 12);
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
      .where(eq(this.options.table.id || this.options.table[Object.keys(this.options.table)[0]], id))
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
      .where(eq(this.options.table.id || this.options.table[Object.keys(this.options.table)[0]], id))
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

    // Get current user
    const user = await db
      .select()
      .from(this.options.table)
      .where(eq(this.options.table.id, id))
      .limit(1);

    if (user.length === 0) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user[0].passwordHash);
    if (!isValidPassword) {
      throw createError('Current password is incorrect', 400);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    const result = await db
      .update(this.options.table)
      .set({ passwordHash: newPasswordHash })
      .where(eq(this.options.table.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: { id: result[0].id },
    });
  });
}