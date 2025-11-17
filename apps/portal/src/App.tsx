import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Role } from '@/types/api';
import AppLayout from '@/components/layout/app-layout';

// Pages
import LoginPage from '@/pages/login';
import DashboardPage from '@/pages/dashboard';
import PessoasPage from '@/pages/pessoas';
import PessoaEditPage from '@/pages/pessoas/edit/[id]';
import PessoaNewPage from '@/pages/pessoas/new';
import AlunosPage from '@/pages/alunos';
import AlunoNewPage from '@/pages/alunos/new';
import AlunoDetailPage from '@/pages/alunos/[id]';
import AlunoEditPage from '@/pages/alunos/edit/[ra]';
import ProfessoresPage from '@/pages/professores';
import ProfessorNewPage from '@/pages/professores/new';
import ProfessorEditPage from '@/pages/professores/edit/[matricula]';
import ProfessorViewPage from '@/pages/professores/view/[matricula]';
import CursosPage from '@/pages/cursos';
import CursoNewPage from '@/pages/cursos/new';
import CursoEditPage from '@/pages/cursos/edit/[id]';
import CursoViewPage from '@/pages/cursos/view/[id]';
import CursoWizardPage from '@/pages/cursos/wizard';
import TurmasPage from '@/pages/turmas';
import TurmaDetailPage from '@/pages/turmas/[id]';
import TurmaNewPage from '@/pages/turmas/new';
import TurmaEditPage from '@/pages/turmas/edit/[id]';
import TurmaInscricoesPage from '@/pages/turmas/inscricoes/[id]';
import TurmaPrintPage from '@/pages/turmas/print/[id]';
import RelatoriosPage from '@/pages/relatorios';
import AvaliacoesPage from '@/pages/avaliacoes';
import AulasPage from '@/pages/aulas';
import AulasListPage from '@/pages/aulas/list';
import AulaNewPage from '@/pages/aulas/new';
import AulasBatchPage from '@/pages/aulas/batch';
import AulaViewPage from '@/pages/aulas/view/[id]';
import AulaEditPage from '@/pages/aulas/edit/[id]';
import FrequenciaPage from '@/pages/frequencia';
import DisciplinasPage from '@/pages/disciplinas';
import DisciplinaNewPage from '@/pages/disciplinas/new';
import DisciplinaEditPage from '@/pages/disciplinas/edit/[id]';
import DisciplinaViewPage from '@/pages/disciplinas/view/[id]';
import CurriculosPage from '@/pages/curriculos';
import CurriculoNewPage from '@/pages/curriculos/new';
import CurriculoEditPage from '@/pages/curriculos/edit/[id]';
import CurriculoDetailPage from '@/pages/curriculos/view/[id]';
import CoortesPage from '@/pages/coortes';
import CoorteDetailPage from '@/pages/coortes/view/[id]';
import CoorteNewPage from '@/pages/coortes/new';
import TurnosPage from '@/pages/turnos';
import TurnoNewPage from '@/pages/turnos/new';
import TurnoEditPage from '@/pages/turnos/edit/[id]';
import TurnoDetailPage from '@/pages/turnos/view/[id]';
import PeriodosPage from '@/pages/periodos';
import PeriodoNewPage from '@/pages/periodos/new';
import PeriodoEditPage from '@/pages/periodos/edit/[id]';
import PeriodoViewPage from '@/pages/periodos/view/[id]';
import CalendarioPage from '@/pages/calendario';
import UsersPage from '@/pages/users';
import UserNewPage from '@/pages/users/new';
import UserEditPage from '@/pages/users/edit/[id]';
import UserViewPage from '@/pages/users/view/[id]';
import MeuPortalPage from '@/pages/meu-portal';
import ConfigPage from '@/pages/config';
import PresencasPage from '@/pages/presencas';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes without layout (print pages) */}
          <Route path="/turmas/:id/print" element={<ProtectedRoute permission={{ action: 'view', resource: 'turmas' }}><TurmaPrintPage /></ProtectedRoute>} />

          {/* Protected routes within layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<ProtectedRoute permission={{ action: 'view', resource: 'pessoas' }} roles={[Role.ADMIN]}><UsersPage /></ProtectedRoute>} />
            <Route path="/users/new" element={<ProtectedRoute permission={{ action: 'create', resource: 'pessoas' }} roles={[Role.ADMIN]}><UserNewPage /></ProtectedRoute>} />
            <Route path="/users/edit/:id" element={<ProtectedRoute permission={{ action: 'edit', resource: 'pessoas' }} roles={[Role.ADMIN]}><UserEditPage /></ProtectedRoute>} />
            <Route path="/users/view/:id" element={<ProtectedRoute permission={{ action: 'view', resource: 'pessoas' }} roles={[Role.ADMIN]}><UserViewPage /></ProtectedRoute>} />
            <Route path="/pessoas" element={<PessoasPage />} />
            <Route path="/pessoas/new" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><PessoaNewPage /></ProtectedRoute>} />
            <Route path="/pessoas/edit/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><PessoaEditPage /></ProtectedRoute>} />
            <Route path="/alunos" element={<ProtectedRoute permission={{ action: 'view', resource: 'alunos' }}><AlunosPage /></ProtectedRoute>} />
            <Route path="/alunos/new" element={<ProtectedRoute permission={{ action: 'create', resource: 'alunos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><AlunoNewPage /></ProtectedRoute>} />
            <Route path="/alunos/:ra" element={<ProtectedRoute permission={{ action: 'view', resource: 'alunos' }}><AlunoDetailPage /></ProtectedRoute>} />
            <Route path="/alunos/edit/:ra" element={<ProtectedRoute permission={{ action: 'edit', resource: 'alunos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><AlunoEditPage /></ProtectedRoute>} />
            <Route path="/professores" element={<ProtectedRoute permission={{ action: 'view', resource: 'professores' }}><ProfessoresPage /></ProtectedRoute>} />
            <Route path="/professores/new" element={<ProtectedRoute permission={{ action: 'create', resource: 'professores' }} roles={[Role.ADMIN, Role.SECRETARIA]}><ProfessorNewPage /></ProtectedRoute>} />
            <Route path="/professores/edit/:matricula" element={<ProtectedRoute permission={{ action: 'edit', resource: 'professores' }} roles={[Role.ADMIN, Role.SECRETARIA]}><ProfessorEditPage /></ProtectedRoute>} />
            <Route path="/professores/view/:matricula" element={<ProtectedRoute permission={{ action: 'view', resource: 'professores' }} roles={[Role.ADMIN, Role.SECRETARIA]}><ProfessorViewPage /></ProtectedRoute>} />
            <Route path="/cursos" element={<ProtectedRoute permission={{ action: 'view', resource: 'cursos' }}><CursosPage /></ProtectedRoute>} />
            <Route path="/cursos/new" element={<ProtectedRoute permission={{ action: 'create', resource: 'cursos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CursoNewPage /></ProtectedRoute>} />
            <Route path="/cursos/wizard" element={<ProtectedRoute permission={{ action: 'create', resource: 'cursos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CursoWizardPage /></ProtectedRoute>} />
            <Route path="/cursos/edit/:id" element={<ProtectedRoute permission={{ action: 'edit', resource: 'cursos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CursoEditPage /></ProtectedRoute>} />
            <Route path="/cursos/view/:id" element={<ProtectedRoute permission={{ action: 'view', resource: 'cursos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CursoViewPage /></ProtectedRoute>} />
            <Route path="/periodos" element={<ProtectedRoute permission={{ action: 'view', resource: 'periodos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><PeriodosPage /></ProtectedRoute>} />
            <Route path="/periodos/new" element={<ProtectedRoute permission={{ action: 'create', resource: 'periodos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><PeriodoNewPage /></ProtectedRoute>} />
            <Route path="/periodos/edit/:id" element={<ProtectedRoute permission={{ action: 'edit', resource: 'periodos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><PeriodoEditPage /></ProtectedRoute>} />
            <Route path="/periodos/view/:id" element={<ProtectedRoute permission={{ action: 'view', resource: 'periodos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><PeriodoViewPage /></ProtectedRoute>} />
            <Route path="/turmas" element={<ProtectedRoute permission={{ action: 'view', resource: 'turmas' }}><TurmasPage /></ProtectedRoute>} />
            <Route path="/turmas/:id" element={<ProtectedRoute permission={{ action: 'view', resource: 'turmas' }}><TurmaDetailPage /></ProtectedRoute>} />
            <Route path="/turmas/view/:id" element={<ProtectedRoute permission={{ action: 'view', resource: 'turmas' }}><TurmaDetailPage /></ProtectedRoute>} />
            <Route path="/turmas/new" element={<ProtectedRoute permission={{ action: 'create', resource: 'turmas' }} roles={[Role.ADMIN, Role.SECRETARIA]}><TurmaNewPage /></ProtectedRoute>} />
            <Route path="/turmas/edit/:id" element={<ProtectedRoute permission={{ action: 'edit', resource: 'turmas' }} roles={[Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]}><TurmaEditPage /></ProtectedRoute>} />
            <Route path="/turmas/inscricoes/:id" element={<ProtectedRoute permission={{ action: 'edit', resource: 'turmas' }} roles={[Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]}><TurmaInscricoesPage /></ProtectedRoute>} />
            <Route path="/disciplinas" element={<ProtectedRoute permission={{ action: 'view', resource: 'disciplinas' }}><DisciplinasPage /></ProtectedRoute>} />
            <Route path="/disciplinas/new" element={<ProtectedRoute permission={{ action: 'create', resource: 'disciplinas' }} roles={[Role.ADMIN, Role.SECRETARIA]}><DisciplinaNewPage /></ProtectedRoute>} />
            <Route path="/disciplinas/edit/:id" element={<ProtectedRoute permission={{ action: 'edit', resource: 'disciplinas' }} roles={[Role.ADMIN, Role.SECRETARIA]}><DisciplinaEditPage /></ProtectedRoute>} />
            <Route path="/disciplinas/view/:id" element={<ProtectedRoute permission={{ action: 'view', resource: 'disciplinas' }}><DisciplinaViewPage /></ProtectedRoute>} />
            <Route path="/curriculos" element={<ProtectedRoute permission={{ action: 'view', resource: 'periodos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CurriculosPage /></ProtectedRoute>} />
            <Route path="/curriculos/new" element={<ProtectedRoute permission={{ action: 'create', resource: 'periodos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CurriculoNewPage /></ProtectedRoute>} />
            <Route path="/curriculos/edit/:id" element={<ProtectedRoute permission={{ action: 'edit', resource: 'periodos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CurriculoEditPage /></ProtectedRoute>} />
            <Route path="/curriculos/view/:id" element={<ProtectedRoute permission={{ action: 'view', resource: 'periodos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CurriculoDetailPage /></ProtectedRoute>} />
            <Route path="/coortes" element={<ProtectedRoute permission={{ action: 'view', resource: 'coortes' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CoortesPage /></ProtectedRoute>} />
            <Route path="/coortes/new" element={<ProtectedRoute permission={{ action: 'create', resource: 'coortes' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CoorteNewPage /></ProtectedRoute>} />
            <Route path="/coortes/view/:id" element={<ProtectedRoute permission={{ action: 'view', resource: 'coortes' }} roles={[Role.ADMIN, Role.SECRETARIA]}><CoorteDetailPage /></ProtectedRoute>} />
            <Route path="/turnos" element={<ProtectedRoute permission={{ action: 'view', resource: 'turnos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><TurnosPage /></ProtectedRoute>} />
            <Route path="/turnos/new" element={<ProtectedRoute permission={{ action: 'create', resource: 'turnos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><TurnoNewPage /></ProtectedRoute>} />
            <Route path="/turnos/edit/:id" element={<ProtectedRoute permission={{ action: 'edit', resource: 'turnos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><TurnoEditPage /></ProtectedRoute>} />
            <Route path="/turnos/view/:id" element={<ProtectedRoute permission={{ action: 'view', resource: 'turnos' }} roles={[Role.ADMIN, Role.SECRETARIA]}><TurnoDetailPage /></ProtectedRoute>} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/avaliacoes" element={<AvaliacoesPage />} />
            <Route path="/aulas" element={<AulasPage />} />
            <Route path="/aulas/list" element={<AulasListPage />} />
            <Route path="/aulas/new" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]}><AulaNewPage /></ProtectedRoute>} />
            <Route path="/aulas/batch" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]}><AulasBatchPage /></ProtectedRoute>} />
            <Route path="/aulas/view/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]}><AulaViewPage /></ProtectedRoute>} />
            <Route path="/aulas/edit/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]}><AulaEditPage /></ProtectedRoute>} />
            <Route path="/frequencia" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]}><FrequenciaPage /></ProtectedRoute>} />
            <Route path="/presencas" element={<PresencasPage />} />
            <Route path="/calendario" element={<ProtectedRoute permission={{ action: 'view', resource: 'periodos' }}><CalendarioPage /></ProtectedRoute>} />
            <Route path="/meu-portal" element={<MeuPortalPage />} />
            <Route path="/config" element={<ConfigPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App; 
