import { type FieldErrors } from 'react-hook-form';
import { useToast } from './use-toast';
import { scrollToField } from '@/lib/form-utils';

/**
 * Mapeamento de caminhos de campo para rótulos amigáveis
 */
export const defaultFieldLabels: Record<string, string> = {
  'cursoId': 'Curso',
  'periodoId': 'Período',
  'turnoId': 'Turno',
  'coorteId': 'Coorte',
  'curriculoId': 'Currículo',
  'disciplinaId': 'Disciplina',
  'pessoaId': 'Pessoa',
  'pessoa.nome': 'Nome completo',
  'pessoa.cpf': 'CPF',
  'pessoa.email': 'Email',
  'pessoa.telefone': 'Telefone',
  'pessoa.sexo': 'Sexo',
  'nome': 'Nome',
  'cpf': 'CPF',
  'email': 'Email',
  'telefone': 'Telefone',
  'username': 'Username',
  'password': 'Senha',
  'codigo': 'Código',
  'creditos': 'Créditos',
  'cargaHoraria': 'Carga horária',
};

interface ErrorInfo {
  pathKey: string;
  message: string;
}

/**
 * Hook para gerenciar erros de formulário de forma padronizada
 */
export const useFormErrors = (fieldLabels: Record<string, string> = {}) => {
  const { toast } = useToast();
  const labels = { ...defaultFieldLabels, ...fieldLabels };

  /**
   * Encontra o primeiro erro em um objeto de erros do react-hook-form
   */
  const getFirstError = <T extends Record<string, any>>(errs: FieldErrors<T>): ErrorInfo | null => {
    for (const key of Object.keys(errs)) {
      const err: any = errs[key];
      if (!err) continue;
      
      if (typeof err.message === 'string' && err.message) {
        return { pathKey: key, message: err.message };
      }
      
      if (err.types) {
        const first = Object.values(err.types)[0];
        if (typeof first === 'string') {
          return { pathKey: key, message: first };
        }
      }
      
      if (typeof err === 'object' && !err.message) {
        const nested = getFirstError(err);
        if (nested) {
          return { pathKey: `${key}.${nested.pathKey}`, message: nested.message };
        }
      }
    }
    return null;
  };

  /**
   * Exibe toast com o erro e rola/foca no campo
   */
  const handleFormError = <T extends Record<string, any>>(errs: FieldErrors<T>) => {
    const first = getFirstError(errs);
    const msg = first?.message || 'Verifique os campos obrigatórios.';
    const label = first?.pathKey && labels[first.pathKey] ? ` (${labels[first.pathKey]})` : '';
    
    toast({
      title: 'Formulário incompleto',
      description: `${msg}${label}`,
      variant: 'destructive',
    });

    if (first?.pathKey) {
      scrollToField(first.pathKey);
    }
  };

  return {
    getFirstError,
    handleFormError,
  };
};

