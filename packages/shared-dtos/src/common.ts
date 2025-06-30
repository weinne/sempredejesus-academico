import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const FilterSchema = z.object({
  filter: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const StringIdParamSchema = z.object({
  id: z.string().min(1),
});

export const ResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown().optional(),
});

export const PaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.unknown()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type Pagination = z.infer<typeof PaginationSchema>;
export type Filter = z.infer<typeof FilterSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type StringIdParam = z.infer<typeof StringIdParamSchema>;
export type Response = z.infer<typeof ResponseSchema>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>; 