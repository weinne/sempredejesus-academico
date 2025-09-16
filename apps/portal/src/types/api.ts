export enum Role {
  ADMIN = 'ADMIN',
  SECRETARIA = 'SECRETARIA',
  PROFESSOR = 'PROFESSOR',
  ALUNO = 'ALUNO'
}

export interface User {
  id: number;
  pessoaId: number;
  username: string;
  role: Role;
  isActive: 'S' | 'N';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  pessoa?: Pessoa;
}

export interface CreateUser {
  pessoaId: number;
  username: string;
  password: string;
  role: Role;
  isActive?: 'S' | 'N';
}

export interface UpdateUser {
  username?: string;
  password?: string;
  role?: Role;
  isActive?: 'S' | 'N';
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email?: string;
  identifier?: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface AdminExistsResponse {
  exists: boolean;
}

export interface BootstrapAdminRequest {
  nome: string;
  email: string;
  password: string;
}

export interface BootstrapAdminResponse {
  id: number;
  username: string;
}

export interface Pessoa {
  id: string;
  nome: string;
  sexo?: 'M' | 'F';
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  data_nascimento?: string;
  created_at: string;
  updated_at: string;
}

export interface Aluno {
  ra: string;
  pessoaId: number;
  cursoId: number;
  anoIngresso: number;
  igreja?: string;
  situacao: 'ATIVO' | 'TRANCADO' | 'CONCLUIDO' | 'CANCELADO';
  coeficienteAcad?: number;
  createdAt: string;
  updatedAt: string;
  pessoa?: Pessoa;
  curso?: Curso;
}

export interface CreateAluno {
  ra?: string;
  pessoaId?: number; // optional when providing inline pessoa
  cursoId: number;
  anoIngresso: number;
  igreja?: string;
  situacao: 'ATIVO' | 'TRANCADO' | 'CONCLUIDO' | 'CANCELADO';
  coeficienteAcad?: number;
}

export interface CreateAlunoWithUser extends CreateAluno {
  // Inline pessoa creation (alternative to pessoaId)
  pessoa?: {
    nome: string;
    sexo?: 'M' | 'F' | 'O';
    cpf?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    data_nascimento?: string;
  };

  createUser?: boolean;
  username?: string;
  password?: string;
}

export interface Professor {
  matricula: string;
  pessoaId: number;
  dataInicio: string;
  formacaoAcad?: string;
  situacao: 'ATIVO' | 'INATIVO';
  pessoa?: Pessoa;
}

export interface CreateProfessor {
  matricula: string;
  pessoaId: number;
  dataInicio: string;
  formacaoAcad?: string;
  situacao: 'ATIVO' | 'INATIVO';
}

export interface CreateProfessorWithUser extends CreateProfessor {
  createUser?: boolean;
  username?: string;
  password?: string;
}

export interface Curso {
  id: number;
  nome: string;
  grau: string;
  disciplinas?: Disciplina[];
  totalDisciplinas?: number;
  disciplinasAtivas?: number;
  cargaHorariaTotal?: number;
}

export interface CreateCurso {
  nome: string;
  grau: string;
}

export interface Disciplina {
  id: number;
  cursoId: number;
  codigo: string;
  nome: string;
  creditos: number;
  cargaHoraria: number;
  ementa?: string;
  bibliografia?: string;
  ativo: boolean;
}

export interface Semestre {
  id: number;
  ano: number;
  periodo: number;
  dataInicio: string;
  dataFim: string;
  ativo: boolean;
}

export interface Turma {
  id: number;
  disciplinaId: number;
  professorId: string;
  semestreId: number;
  sala?: string;
  horario?: string;
  secao?: string;
  disciplina?: Disciplina;
  professor?: Professor;
  semestre?: Semestre;
  inscritos?: TurmaInscrito[];
  totalInscritos?: number;
}

export interface CreateTurma {
  disciplinaId: number;
  professorId: string;
  semestreId: number;
  sala?: string;
  horario?: string;
  secao?: string;
}

export interface TurmaInscrito {
  id: number;
  turmaId: number;
  alunoId: string;
  media?: number;
  frequencia?: number;
  status: 'MATRICULADO' | 'CANCELADO' | 'APROVADO' | 'REPROVADO';
  aluno?: Aluno;
}

// Sprint 8: Avaliações, Aulas, Calendário, Relatórios
export interface Avaliacao {
  id: number;
  turmaId: number;
  data: string; // YYYY-MM-DD
  tipo: 'PROVA' | 'TRABALHO' | 'PARTICIPACAO' | 'OUTRO';
  codigo: string;
  descricao: string;
  peso: number;
  arquivoUrl?: string | null;
}

export interface CreateAvaliacao extends Omit<Avaliacao, 'id'> {}

export interface LancarNotaInput {
  alunoId: string; // RA
  nota: number; // 0..10
  obs?: string;
}

export interface Aula {
  id: number;
  turmaId: number;
  data: string; // YYYY-MM-DD
  topico?: string;
  materialUrl?: string;
  observacao?: string;
}

export interface CreateAula extends Omit<Aula, 'id'> {}

export interface LancarFrequenciaInput {
  inscricaoId: number;
  presente: boolean;
  justificativa?: string;
}

export interface EstudanteAula {
  inscricaoId: number;
  alunoId: string;
  ra: string;
  nomeCompleto: string;
  presente: boolean;
  justificativa?: string;
}

export interface CalendarioItem {
  id: number;
  semestreId: number;
  evento: string;
  inicio: string; // YYYY-MM-DD
  termino: string; // YYYY-MM-DD
  obs?: string;
}

export interface CreateCalendarioItem extends Omit<CalendarioItem, 'id'> {}

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}
