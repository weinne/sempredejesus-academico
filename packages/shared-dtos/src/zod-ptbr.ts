import { z } from 'zod';

/**
 * Mapa de erros do Zod em Português Brasileiro
 * Usado para substituir as mensagens padrão em inglês
 */
export const ptBrErrorMap: z.ZodErrorMap = (issue, ctx) => {
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

    case z.ZodIssueCode.invalid_literal:
      message = `Valor inválido: esperado ${JSON.stringify(issue.expected)}`;
      break;

    case z.ZodIssueCode.unrecognized_keys:
      message = `Chave(s) não reconhecida(s) no objeto: ${issue.keys.map((k) => `'${k}'`).join(', ')}`;
      break;

    case z.ZodIssueCode.invalid_union:
      message = 'Valor inválido';
      break;

    case z.ZodIssueCode.invalid_union_discriminator:
      message = `Valor de discriminador inválido. Esperado ${issue.options.map((o) => (typeof o === 'symbol' ? String(o) : `'${o}'`)).join(' | ')}`;
      break;

    case z.ZodIssueCode.invalid_enum_value:
      message = `Valor inválido. Esperado ${issue.options.map((o) => `'${o}'`).join(' | ')}, recebido '${issue.received}'`;
      break;

    case z.ZodIssueCode.invalid_arguments:
      message = 'Argumentos de função inválidos';
      break;

    case z.ZodIssueCode.invalid_return_type:
      message = 'Tipo de retorno de função inválido';
      break;

    case z.ZodIssueCode.invalid_date:
      message = 'Data inválida';
      break;

    case z.ZodIssueCode.invalid_string:
      if (typeof issue.validation === 'object') {
        if ('startsWith' in issue.validation) {
          message = `Deve começar com "${issue.validation.startsWith}"`;
        } else if ('endsWith' in issue.validation) {
          message = `Deve terminar com "${issue.validation.endsWith}"`;
        } else {
          message = 'String inválida';
        }
      } else {
        switch (issue.validation) {
          case 'email':
            message = 'Email inválido';
            break;
          case 'url':
            message = 'URL inválida';
            break;
          case 'uuid':
            message = 'UUID inválido';
            break;
          case 'cuid':
            message = 'CUID inválido';
            break;
          case 'regex':
            message = 'Formato inválido';
            break;
          case 'datetime':
            message = 'Data/hora inválida';
            break;
          default:
            message = 'String inválida';
        }
      }
      break;

    case z.ZodIssueCode.too_small:
      if (issue.type === 'array') {
        message = issue.exact
          ? `Array deve ter exatamente ${issue.minimum} elemento(s)`
          : `Array deve ter ${issue.inclusive ? 'pelo menos' : 'mais de'} ${issue.minimum} elemento(s)`;
      } else if (issue.type === 'string') {
        message = issue.exact
          ? `String deve ter exatamente ${issue.minimum} caractere(s)`
          : `String deve ter ${issue.inclusive ? 'pelo menos' : 'mais de'} ${issue.minimum} caractere(s)`;
      } else if (issue.type === 'number') {
        message = issue.exact
          ? `Número deve ser exatamente ${issue.minimum}`
          : `Número deve ser ${issue.inclusive ? 'maior ou igual a' : 'maior que'} ${issue.minimum}`;
      } else if (issue.type === 'date') {
        message = issue.exact
          ? `Data deve ser exatamente ${new Date(issue.minimum as number).toLocaleDateString('pt-BR')}`
          : `Data deve ser ${issue.inclusive ? 'maior ou igual a' : 'maior que'} ${new Date(issue.minimum as number).toLocaleDateString('pt-BR')}`;
      } else {
        message = 'Valor muito pequeno';
      }
      break;

    case z.ZodIssueCode.too_big:
      if (issue.type === 'array') {
        message = issue.exact
          ? `Array deve ter exatamente ${issue.maximum} elemento(s)`
          : `Array deve ter ${issue.inclusive ? 'no máximo' : 'menos de'} ${issue.maximum} elemento(s)`;
      } else if (issue.type === 'string') {
        message = issue.exact
          ? `String deve ter exatamente ${issue.maximum} caractere(s)`
          : `String deve ter ${issue.inclusive ? 'no máximo' : 'menos de'} ${issue.maximum} caractere(s)`;
      } else if (issue.type === 'number') {
        message = issue.exact
          ? `Número deve ser exatamente ${issue.maximum}`
          : `Número deve ser ${issue.inclusive ? 'menor ou igual a' : 'menor que'} ${issue.maximum}`;
      } else if (issue.type === 'date') {
        message = issue.exact
          ? `Data deve ser exatamente ${new Date(issue.maximum as number).toLocaleDateString('pt-BR')}`
          : `Data deve ser ${issue.inclusive ? 'menor ou igual a' : 'menor que'} ${new Date(issue.maximum as number).toLocaleDateString('pt-BR')}`;
      } else {
        message = 'Valor muito grande';
      }
      break;

    case z.ZodIssueCode.custom:
      message = ctx.defaultError;
      break;

    case z.ZodIssueCode.invalid_intersection_types:
      message = 'Tipos de interseção não puderam ser mesclados';
      break;

    case z.ZodIssueCode.not_multiple_of:
      message = `Número deve ser múltiplo de ${issue.multipleOf}`;
      break;

    case z.ZodIssueCode.not_finite:
      message = 'Número deve ser finito';
      break;

    default:
      message = ctx.defaultError;
  }

  return { message };
};

