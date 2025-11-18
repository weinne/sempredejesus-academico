import { z } from 'zod';

/**
 * Mapa de erros do Zod em Português Brasileiro
 * Usado para substituir as mensagens padrão em inglês
 * Atualizado para Zod 4.x
 * 
 * Nota: Zod 4 mudou a API do error map, mas a funcionalidade ainda funciona em runtime
 */
// @ts-expect-error - Zod 4 mudou a assinatura do error map, mas funciona em runtime
export const ptBrErrorMap: z.ZodErrorMap = (issue: any, _ctx: any) => {
  let message: string;

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') {
        message = 'Campo obrigatório';
      } else if (issue.received === 'null') {
        message = 'Campo não pode ser nulo';
      } else {
        message = `Esperado ${issue.expected}, recebido ${issue.received}`;
      }
      break;

    case z.ZodIssueCode.unrecognized_keys:
      message = `Chave(s) não reconhecida(s) no objeto: ${(issue.keys || []).map((k: string) => `'${k}'`).join(', ')}`;
      break;

    case z.ZodIssueCode.invalid_union:
      message = 'Valor inválido';
      break;

    case z.ZodIssueCode.invalid_format:
      if (issue.format === 'email') {
        message = 'Email inválido';
      } else if (issue.format === 'url') {
        message = 'URL inválida';
      } else if (issue.format === 'uuid') {
        message = 'UUID inválido';
      } else {
        message = `Formato inválido: ${issue.format || 'desconhecido'}`;
      }
      break;

    case z.ZodIssueCode.too_small:
      const minType = (issue as any).type || 'valor';
      if (minType === 'array') {
        message = issue.exact
          ? `Array deve ter exatamente ${issue.minimum} elemento(s)`
          : `Array deve ter ${issue.inclusive ? 'pelo menos' : 'mais de'} ${issue.minimum} elemento(s)`;
      } else if (minType === 'string') {
        message = issue.exact
          ? `String deve ter exatamente ${issue.minimum} caractere(s)`
          : `String deve ter ${issue.inclusive ? 'pelo menos' : 'mais de'} ${issue.minimum} caractere(s)`;
      } else if (minType === 'number') {
        message = issue.exact
          ? `Número deve ser exatamente ${issue.minimum}`
          : `Número deve ser ${issue.inclusive ? 'maior ou igual a' : 'maior que'} ${issue.minimum}`;
      } else if (minType === 'date') {
        message = issue.exact
          ? `Data deve ser exatamente ${new Date(issue.minimum as number).toLocaleDateString('pt-BR')}`
          : `Data deve ser ${issue.inclusive ? 'maior ou igual a' : 'maior que'} ${new Date(issue.minimum as number).toLocaleDateString('pt-BR')}`;
      } else {
        message = 'Valor muito pequeno';
      }
      break;

    case z.ZodIssueCode.too_big:
      const maxType = (issue as any).type || 'valor';
      if (maxType === 'array') {
        message = issue.exact
          ? `Array deve ter exatamente ${issue.maximum} elemento(s)`
          : `Array deve ter ${issue.inclusive ? 'no máximo' : 'menos de'} ${issue.maximum} elemento(s)`;
      } else if (maxType === 'string') {
        message = issue.exact
          ? `String deve ter exatamente ${issue.maximum} caractere(s)`
          : `String deve ter ${issue.inclusive ? 'no máximo' : 'menos de'} ${issue.maximum} caractere(s)`;
      } else if (maxType === 'number') {
        message = issue.exact
          ? `Número deve ser exatamente ${issue.maximum}`
          : `Número deve ser ${issue.inclusive ? 'menor ou igual a' : 'menor que'} ${issue.maximum}`;
      } else if (maxType === 'date') {
        message = issue.exact
          ? `Data deve ser exatamente ${new Date(issue.maximum as number).toLocaleDateString('pt-BR')}`
          : `Data deve ser ${issue.inclusive ? 'menor ou igual a' : 'menor que'} ${new Date(issue.maximum as number).toLocaleDateString('pt-BR')}`;
      } else {
        message = 'Valor muito grande';
      }
      break;

    case z.ZodIssueCode.custom:
      message = _ctx?.defaultError || 'Valor inválido';
      break;

    case z.ZodIssueCode.not_multiple_of:
      message = `Número deve ser múltiplo de ${(issue as any).multipleOf || issue.multipleOf}`;
      break;

    default:
      message = _ctx?.defaultError || 'Valor inválido';
  }

  return { message };
};
