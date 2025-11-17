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
  roles?: Role[];
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
  sexo?: 'M' | 'F' | 'O';
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
  turnoId?: number;
  coorteId?: number;
  periodoId: number;
  anoIngresso: number;
  igreja?: string;
  situacao: 'ATIVO' | 'TRANCADO' | 'CONCLUIDO' | 'CANCELADO';
  coeficienteAcad?: number;
  createdAt: string;
  updatedAt: string;
  pessoa?: Pessoa;
  curso?: Curso;
  turno?: Turno;
  coorte?: Coorte;
  periodo?: Periodo;
}

export interface CreateAluno {
  ra?: string;
  pessoaId?: number; // optional when providing inline pessoa
  cursoId: number;
  turnoId?: number;
  coorteId?: number;
  periodoId: number;
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
  pessoaId?: number;
  dataInicio: string;
  formacaoAcad?: string;
  situacao: 'ATIVO' | 'INATIVO';
}

export interface CreateProfessorWithUser extends CreateProfessor {
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

export interface Curso {
  id: number;
  nome: string;
  grau: string;
  disciplinas?: Disciplina[];
  periodos?: Periodo[];
  totalPeriodos?: number;
  totalDisciplinas?: number;
  disciplinasAtivas?: number;
  cargaHorariaTotal?: number;
}

export interface Turno {
  id: number;
  nome: string; // Diurno, Vespertino, Noturno
}

export interface Curriculo {
  id: number;
  cursoId: number;
  turnoId: number;
  versao: string;
  vigenteDe?: string;
  vigenteAte?: string;
  ativo: boolean;
  curso?: Curso;
  turno?: Turno;
}

export interface Coorte {
  id: number;
  cursoId: number;
  turnoId: number;
  curriculoId: number;
  anoIngresso: number;
  rotulo: string;
  ativo: boolean;
  curso?: Curso;
  turno?: Turno;
  curriculo?: Curriculo;
}

export interface CreateCurso {
  nome: string;
  grau: string;
}

export interface CreateTurno {
  nome: string;
}

export interface CreateCurriculo {
  cursoId: number;
  turnoId: number;
  versao: string;
  vigenteDe?: string;
  vigenteAte?: string;
  ativo?: boolean;
}

export interface CreateCoorte {
  cursoId: number;
  turnoId: number;
  curriculoId: number;
  anoIngresso: number;
  rotulo: string;
  ativo?: boolean;
}

export interface Periodo {
  id: number;
  curriculoId: number;
  numero: number;
  nome?: string | null;
  descricao?: string | null;
  dataInicio?: string;
  dataFim?: string;
  totalDisciplinas?: number;
  totalAlunos?: number;
  curso?: Curso;
  curriculo?: Curriculo;
  turno?: Turno;
  disciplinas?: Array<Disciplina & { ordem?: number; obrigatoria?: boolean }>;
}

export interface CreatePeriodo {
  curriculoId: number;
  numero: number;
  nome?: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface UpdatePeriodo extends Partial<CreatePeriodo> {}

export interface DisciplinaPeriodo {
  periodoId: number;
  ordem?: number;
  obrigatoria: boolean;
  periodo?: {
    id: number;
    numero?: number | null;
    nome?: string | null;
    curriculoId?: number;
  };
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
  objetivos?: string;
  conteudoProgramatico?: string;
  instrumentosEAvaliacao?: string;
  ativo: boolean;
  periodos?: DisciplinaPeriodo[];
  curso?: Curso;
}

// Semestre removido do modelo de frontend

export interface Turma {
  id: number;
  disciplinaId: number;
  professorId: string;
  coorteId?: number;
  sala?: string;
  horario?: string;
  secao?: string;
  ementa?: string | null;
  bibliografia?: string | null;
  objetivos?: string | null;
  conteudoProgramatico?: string | null;
  instrumentosEAvaliacao?: string | null;
  disciplina?: Disciplina;
  professor?: Professor;
  coorte?: Coorte;
  inscritos?: TurmaInscrito[];
  totalInscritos?: number;
}

export interface CreateTurma {
  disciplinaId: number;
  professorId: string;
  coorteId?: number;
  sala?: string;
  horario?: string;
  secao?: string;
  ementa?: string | null;
  bibliografia?: string | null;
  objetivos?: string | null;
  conteudoProgramatico?: string | null;
  instrumentosEAvaliacao?: string | null;
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

export interface CreateTurmaInscricao {
  alunoId: string;
  status?: TurmaInscrito['status'];
}

export interface BulkTurmaInscricao {
  alunoIds?: string[];
  coorteId?: number;
  status?: TurmaInscrito['status'];
}

export interface UpdateTurmaInscricao {
  status?: TurmaInscrito['status'];
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
  horaInicio?: string | null; // HH:mm
  horaFim?: string | null; // HH:mm
  topico?: string | null;
  materialUrl?: string | null;
  observacao?: string | null;
}

export interface CreateAula extends Omit<Aula, 'id'> {}

export interface AulasBatch {
  turmaId: number;
  diaDaSemana: number; // 0=Dom, 6=Sab
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFim: string; // HH:mm
  pularFeriados?: boolean;
  dryRun?: boolean;
}

export interface AulasBatchResponse {
  totalGeradas: number;
  existentesIgnoradas?: number;
  datas?: string[];
  criadas?: Aula[];
}

export interface LancarFrequenciaInput {
  inscricaoId: number;
  presente: boolean;
  justificativa?: string;
}

export interface FrequenciaUpsertItem {
  aulaId: number;
  inscricaoId: number;
  presente: boolean;
  justificativa?: string | null;
}

export interface FrequenciaBulkUpsert {
  itens: FrequenciaUpsertItem[];
}

export interface EstudanteAula {
  inscricaoId: number;
  alunoId: string;
  ra: string;
  nomeCompleto: string;
  presente: boolean;
  justificativa?: string;
}

export interface EstudanteAvaliacao {
  inscricaoId: number;
  alunoId: string;
  ra: string;
  nomeCompleto: string;
  media: number | null;
  nota: number | null;
  obs?: string;
}

export interface ValidacaoPesos {
  totalWeight: number;
  isValid: boolean;
  difference: number;
  message: string;
}

export interface AlertaFrequencia {
  inscricaoId: number;
  alunoId: string;
  ra: string;
  nomeCompleto: string;
  totalAulas: number;
  ausencias: number;
  percentualFaltas: number;
  percentualFrequencia: number;
  nivel: 'warning' | 'critical';
  mensagem: string;
}

export interface AlertasFrequencia {
  turmaId: number;
  totalAulas: number;
  alertas: AlertaFrequencia[];
}

export interface CalendarioItem {
  id: number;
  evento: string;
  inicio: string; // YYYY-MM-DD
  termino: string; // YYYY-MM-DD
  obs?: string;
  periodoId?: number;
}

export interface CreateCalendarioItem extends Omit<CalendarioItem, 'id'> {}

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}
