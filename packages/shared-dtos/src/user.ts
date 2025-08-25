import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number().int().positive(),
  pessoaId: z.number().int().positive(),
  username: z.string().min(3).max(50),
  passwordHash: z.string().max(255),
  role: z.enum(['ADMIN', 'SECRETARIA', 'PROFESSOR', 'ALUNO']),
  isActive: z.enum(['S', 'N']).default('S'),
  lastLogin: z.string().datetime().optional(),
  passwordResetToken: z.string().max(255).optional(),
  passwordResetExpires: z.string().datetime().optional(),
  refreshToken: z.string().max(500).optional(),
  refreshTokenExpires: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateUserSchema = z.object({
  pessoaId: z.number().int().positive(),
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  role: z.enum(['ADMIN', 'SECRETARIA', 'PROFESSOR', 'ALUNO']),
  isActive: z.enum(['S', 'N']).default('S'),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(['ADMIN', 'SECRETARIA', 'PROFESSOR', 'ALUNO']).optional(),
  isActive: z.enum(['S', 'N']).optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(6).max(100),
  confirmPassword: z.string().min(6).max(100),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

export const UserWithPessoaSchema = UserSchema.extend({
  pessoa: z.object({
    id: z.number(),
    nomeCompleto: z.string(),
    email: z.string().optional(),
    cpf: z.string().optional(),
    telefone: z.string().optional(),
  }),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type UserWithPessoa = z.infer<typeof UserWithPessoaSchema>;