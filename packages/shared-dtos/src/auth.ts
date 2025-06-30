import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().default(false),
});

export const JwtPayloadSchema = z.object({
  sub: z.string(),
  role: z.enum(['ADMIN', 'SECRETARIA', 'PROFESSOR', 'ALUNO']),
  exp: z.number(),
  iat: z.number(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    nome: z.string(),
    email: z.string(),
    role: z.enum(['ADMIN', 'SECRETARIA', 'PROFESSOR', 'ALUNO']),
  }),
});

export const UserInfoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string(),
  role: z.enum(['ADMIN', 'SECRETARIA', 'PROFESSOR', 'ALUNO']),
});

export type Login = z.infer<typeof LoginSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type UserInfo = z.infer<typeof UserInfoSchema>; 