import { Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';

type Action = 'view' | 'create' | 'edit' | 'delete';
type Resource =
  | 'alunos'
  | 'professores'
  | 'pessoas'
  | 'cursos'
  | 'disciplinas'
  | 'periodos'
  | 'coortes'
  | 'turnos'
  | 'turmas';

type Capabilities = Partial<Record<Resource, Partial<Record<Action, boolean>>>>;

const roleCapabilities: Record<Role, Capabilities> = {
  [Role.ADMIN]: {
    alunos: { view: true, create: true, edit: true, delete: true },
    professores: { view: true, create: true, edit: true, delete: true },
    pessoas: { view: true, create: true, edit: true, delete: true },
    cursos: { view: true, create: true, edit: true, delete: true },
    disciplinas: { view: true, create: true, edit: true, delete: true },
    periodos: { view: true, create: true, edit: true, delete: true },
    coortes: { view: true, create: true, edit: true, delete: true },
    turnos: { view: true, create: true, edit: true, delete: true },
    turmas: { view: true, create: true, edit: true, delete: true },
  },
  [Role.SECRETARIA]: {
    alunos: { view: true, create: true, edit: true, delete: false },
    professores: { view: true, create: true, edit: true, delete: false },
    pessoas: { view: true, create: true, edit: true, delete: false },
    cursos: { view: true, create: true, edit: true, delete: false },
    disciplinas: { view: true, create: true, edit: true, delete: false },
    periodos: { view: true, create: true, edit: true, delete: false },
    coortes: { view: true, create: true, edit: true, delete: false },
    turnos: { view: true, create: true, edit: true, delete: false },
    turmas: { view: true, create: true, edit: true, delete: false },
  },
  [Role.PROFESSOR]: {
    turmas: { view: true, edit: true },
    alunos: { view: true },
    disciplinas: { view: true },
  },
  [Role.ALUNO]: {
    alunos: { view: true },
    disciplinas: { view: true },
    turmas: { view: true },
  },
};

export function can(action: Action, resource: Resource, role: Role | null | undefined): boolean {
  if (!role) return false;
  const res = roleCapabilities[role]?.[resource];
  return !!res?.[action];
}

export function allActions(resource: Resource, role: Role | null | undefined) {
  return {
    view: can('view', resource, role),
    create: can('create', resource, role),
    edit: can('edit', resource, role),
    delete: can('delete', resource, role),
  } as Record<Action, boolean>;
}

export function useCan(action: Action, resource: Resource): boolean {
  const { user } = useAuth();
  return can(action, resource, user?.role);
}

export type { Action, Resource };


