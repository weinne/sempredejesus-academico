/**
 * Utilitários para manipulação de datas no formato brasileiro (dd/mm/yyyy)
 * e conversão para formato ISO (yyyy-mm-dd) usado pelo backend
 */

import { format, parse, isValid, parseISO } from 'date-fns';

/**
 * Formato brasileiro de data (dd/mm/yyyy)
 */
export const BR_DATE_FORMAT = 'dd/MM/yyyy';

/**
 * Formato ISO de data (yyyy-mm-dd) usado pelo backend
 */
export const ISO_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Converte uma data (ISO, Date object ou null) para formato brasileiro (dd/mm/yyyy)
 * @param date - Data em formato ISO (yyyy-mm-dd), Date object, ou null/undefined
 * @returns String no formato brasileiro (dd/mm/yyyy) ou string vazia se inválida
 */
export function formatDateToBR(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se já está no formato ISO (yyyy-mm-dd)
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        dateObj = parseISO(date);
      } else {
        // Tenta parsear como ISO completo ou outros formatos
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, BR_DATE_FORMAT);
  } catch {
    return '';
  }
}

/**
 * Converte uma data no formato brasileiro (dd/mm/yyyy) para formato ISO (yyyy-mm-dd)
 * @param brDate - Data no formato brasileiro (dd/mm/yyyy)
 * @returns String no formato ISO (yyyy-mm-dd) ou null se inválida
 */
export function parseDateFromBR(brDate: string): string | null {
  if (!brDate || !brDate.trim()) {
    return null;
  }
  
  try {
    // Remove espaços e valida formato básico
    const cleaned = brDate.trim();
    
    // Valida formato dd/mm/yyyy ou dd/mm/yy
    if (!/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(cleaned)) {
      return null;
    }
    
    const parsed = parse(cleaned, BR_DATE_FORMAT, new Date());
    
    if (!isValid(parsed)) {
      return null;
    }
    
    return format(parsed, ISO_DATE_FORMAT);
  } catch {
    return null;
  }
}

/**
 * Formata uma data para o input HTML5 (formato ISO yyyy-mm-dd)
 * Melhora a função formatDateForInput existente
 * @param date - Data em formato ISO, Date object, ou null/undefined
 * @returns String no formato ISO (yyyy-mm-dd) ou string vazia se inválida
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se já está no formato ISO (yyyy-mm-dd), retorna direto
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      // Se tem 'T' (datetime ISO), pega só a parte da data
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      
      // Tenta parsear
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, ISO_DATE_FORMAT);
  } catch {
    return '';
  }
}

/**
 * Valida se uma string está no formato brasileiro de data (dd/mm/yyyy)
 * @param date - String a validar
 * @returns true se está no formato válido, false caso contrário
 */
export function isValidBRDate(date: string): boolean {
  if (!date || !date.trim()) {
    return false;
  }
  
  const parsed = parseDateFromBR(date);
  return parsed !== null;
}

/**
 * Converte uma data ISO para Date object, retornando null se inválida
 * @param isoDate - Data em formato ISO (yyyy-mm-dd)
 * @returns Date object ou null se inválida
 */
export function parseISODate(isoDate: string | null | undefined): Date | null {
  if (!isoDate) return null;
  
  try {
    const date = parseISO(isoDate);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

