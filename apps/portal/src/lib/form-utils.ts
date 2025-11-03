/**
 * Utilitários para formulários
 * Extraídos e padronizados a partir do formulário de Alunos
 */

/**
 * Remove todos os caracteres não-numéricos de uma string
 */
export const onlyDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Aplica máscara de CPF (xxx.xxx.xxx-xx)
 */
export const maskCPF = (digits: string): string => {
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
};

/**
 * Aplica máscara de telefone brasileiro
 * (xx) xxxx-xxxx ou (xx) xxxxx-xxxx
 */
export const maskPhone = (digits: string): string => {
  const d = digits.slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
};

/**
 * Converte valor para number ou undefined (útil para setValueAs em selects)
 * Evita NaN quando o campo está vazio
 */
export const numberOrUndefined = (value: unknown): number | undefined => {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

/**
 * Rola a página até o campo com data-field especificado e tenta focar nele
 */
export const scrollToField = (dataField: string): void => {
  const el = document.querySelector(`[data-field="${dataField}"]`) as HTMLElement | null;
  if (el) {
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in el && typeof (el as any).focus === 'function') {
        (el as any).focus();
      }
    }, 50);
  }
};

