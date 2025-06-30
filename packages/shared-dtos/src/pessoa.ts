import { z } from 'zod';

export const EnderecoSchema = z.object({
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
});

export const PessoaSchema = z.object({
  id: z.number().int().positive(),
  nomeCompleto: z.string().min(2).max(120),
  sexo: z.enum(['M', 'F', 'O']),
  email: z.string().email().max(120).optional(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional(),
  dataNasc: z.string().date().optional(),
  telefone: z.string().max(20).optional(),
  endereco: EnderecoSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreatePessoaSchema = PessoaSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdatePessoaSchema = CreatePessoaSchema.partial();

export type Endereco = z.infer<typeof EnderecoSchema>;
export type Pessoa = z.infer<typeof PessoaSchema>;
export type CreatePessoa = z.infer<typeof CreatePessoaSchema>;
export type UpdatePessoa = z.infer<typeof UpdatePessoaSchema>; 