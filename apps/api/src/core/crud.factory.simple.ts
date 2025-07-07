import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { AnyZodObject } from 'zod';

interface SimpleCrudOptions {
  table: any;
  createSchema?: AnyZodObject;
  updateSchema?: AnyZodObject;
}

export class SimpleCrudFactory {
  constructor(private options: SimpleCrudOptions) {}

  // GET /resource - List all (simplified)
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const data = await db.select().from(this.options.table).limit(50); // Simple limit

    res.json({
      success: true,
      data,
      message: `Found ${data.length} records`,
    });
  });

  // GET /resource/:id - Get by ID
  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    const result = await db
      .select()
      .from(this.options.table)
      .where(eq(this.options.table.id, id))
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
    const id = parseInt(req.params.id);

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

    const result = await db
      .update(this.options.table)
      .set(updateData)
      .where(eq(this.options.table.id, id))
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
    const id = parseInt(req.params.id);

    const result = await db
      .delete(this.options.table)
      .where(eq(this.options.table.id, id))
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
} 