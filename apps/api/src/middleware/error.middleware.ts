import { Request, Response, NextFunction } from 'express';
import { logger } from '@seminario/shared-config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Interface para erros do PostgreSQL
interface PostgresError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  constraint?: string;
  column?: string;
  table?: string;
  schema?: string;
  severity?: string;
  position?: string;
}

/**
 * Extrai informações detalhadas de erros do PostgreSQL
 * Suporta erros diretos do PostgreSQL e erros envolvidos pelo Drizzle ORM
 */
function extractPostgresErrorDetails(error: unknown): Partial<PostgresError> {
  if (!error || typeof error !== 'object') {
    return {};
  }

  // Tentar acessar propriedades diretamente
  const pgError = error as PostgresError;
  
  // Verificar se o erro tem propriedades do PostgreSQL diretamente
  if (pgError.code || pgError.detail) {
    return {
      code: pgError.code,
      detail: pgError.detail,
      hint: pgError.hint,
      constraint: pgError.constraint,
      column: pgError.column,
      table: pgError.table,
      schema: pgError.schema,
      severity: pgError.severity,
      position: pgError.position,
    };
  }

  // Verificar se o erro está dentro de uma propriedade 'cause' (comum em alguns wrappers)
  if ('cause' in pgError && pgError.cause && typeof pgError.cause === 'object') {
    const cause = pgError.cause as PostgresError;
    if (cause.code || cause.detail) {
      return {
        code: cause.code,
        detail: cause.detail,
        hint: cause.hint,
        constraint: cause.constraint,
        column: cause.column,
        table: cause.table,
        schema: cause.schema,
        severity: cause.severity,
        position: cause.position,
      };
    }
  }

  // Verificar se a mensagem contém informações sobre erro do PostgreSQL
  const message = pgError.message || '';
  if (message.includes('Failed query') || message.includes('duplicate key') || message.includes('violates')) {
    // Tentar extrair código de erro da mensagem se disponível
    return {
      detail: message,
    };
  }

  return {};
}

/**
 * Converte código de erro PostgreSQL em mensagem amigável
 */
function getPostgresErrorMessage(code: string | undefined, detail: string | undefined): string {
  if (!code) return detail || 'Erro no banco de dados';
  
  const errorMessages: Record<string, string> = {
    '23505': detail || 'Registro duplicado. Este valor já existe no sistema.',
    '23503': detail || 'Violação de chave estrangeira. O registro referenciado não existe.',
    '23502': detail || 'Campo obrigatório não preenchido.',
    '23514': detail || 'Violação de constraint de verificação.',
    '42P01': 'Tabela não encontrada.',
    '42703': 'Coluna não encontrada.',
    '28P01': 'Falha na autenticação do banco de dados.',
    '3D000': 'Banco de dados não encontrado.',
    'ECONNREFUSED': 'Conexão recusada. Verifique se o banco de dados está rodando.',
  };
  
  return errorMessages[code] || detail || 'Erro no banco de dados';
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Extrair detalhes de erros do PostgreSQL
  const pgDetails = extractPostgresErrorDetails(error);
  const hasPostgresError = !!pgDetails.code;

  // Se for erro do PostgreSQL, melhorar a mensagem
  if (hasPostgresError) {
    const pgMessage = getPostgresErrorMessage(pgDetails.code, pgDetails.detail);
    
    // Log detalhado do erro PostgreSQL
    logger.error('PostgreSQL error occurred:', {
      statusCode,
      message: error.message,
      postgresCode: pgDetails.code,
      detail: pgDetails.detail,
      hint: pgDetails.hint,
      constraint: pgDetails.constraint,
      column: pgDetails.column,
      table: pgDetails.table,
      schema: pgDetails.schema,
      severity: pgDetails.severity,
      position: pgDetails.position,
      stack: error.stack,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    // Usar mensagem amigável se disponível, senão usar a original
    if (pgMessage !== 'Erro no banco de dados') {
      message = pgMessage;
    }
    
    // Se for erro de constraint conhecido, usar status 400 (Bad Request)
    if (pgDetails.code && ['23505', '23503', '23502', '23514'].includes(pgDetails.code)) {
      const finalStatusCode = statusCode === 500 ? 400 : statusCode;
      return res.status(finalStatusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
          postgresCode: pgDetails.code,
          detail: pgDetails.detail,
          constraint: pgDetails.constraint,
        }),
      });
    }
  } else {
    // Log padrão para outros erros
    logger.error('Error occurred:', {
      statusCode,
      message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
  }

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && !isDevelopment ? 'Internal Server Error' : message,
    ...(isDevelopment && { 
      stack: error.stack,
      ...(hasPostgresError && {
        postgresCode: pgDetails.code,
        detail: pgDetails.detail,
        constraint: pgDetails.constraint,
      }),
    }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};

// Helper to create operational errors
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 