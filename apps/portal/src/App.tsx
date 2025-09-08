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
import AlunosPage from '@/pages/alunos';
import AlunoNewPage from '@/pages/alunos/new';
import AlunoDetailPage from '@/pages/alunos/[id]';
import AlunoEditPage from '@/pages/alunos/edit/[ra]';
import ProfessoresPage from '@/pages/professores';
import ProfessorEditPage from '@/pages/professores/edit/[matricula]';
import ProfessorViewPage from '@/pages/professores/view/[matricula]';
import CursosPage from '@/pages/cursos';
import CursoNewPage from '@/pages/cursos/new';
import CursoEditPage from '@/pages/cursos/edit/[id]';
import CursoViewPage from '@/pages/cursos/view/[id]';
import TurmasPage from '@/pages/turmas';
import TurmaDetailPage from '@/pages/turmas/[id]';
import TurmaNewPage from '@/pages/turmas/new';
import TurmaEditPage from '@/pages/turmas/edit/[id]';
import RelatoriosPage from '@/pages/relatorios';
import AvaliacoesPage from '@/pages/avaliacoes';
import AulasPage from '@/pages/aulas';
import AulaViewPage from '@/pages/aulas/view/[id]';
import AulaEditPage from '@/pages/aulas/edit/[id]';
import DisciplinasPage from '@/pages/disciplinas';
import DisciplinaNewPage from '@/pages/disciplinas/new';
import DisciplinaEditPage from '@/pages/disciplinas/edit/[id]';
import DisciplinaViewPage from '@/pages/disciplinas/view/[id]';
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
            <Route path="/users" element={<ProtectedRoute roles={[Role.ADMIN]}><UsersPage /></ProtectedRoute>} />
            <Route path="/users/new" element={<ProtectedRoute roles={[Role.ADMIN]}><UserNewPage /></ProtectedRoute>} />
            <Route path="/users/edit/:id" element={<ProtectedRoute roles={[Role.ADMIN]}><UserEditPage /></ProtectedRoute>} />
            <Route path="/users/view/:id" element={<ProtectedRoute roles={[Role.ADMIN]}><UserViewPage /></ProtectedRoute>} />
            <Route path="/pessoas" element={<PessoasPage />} />
            <Route path="/pessoas/edit/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><PessoaEditPage /></ProtectedRoute>} />
            <Route path="/alunos" element={<AlunosPage />} />
            <Route path="/alunos/new" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><AlunoNewPage /></ProtectedRoute>} />
            <Route path="/alunos/:ra" element={<AlunoDetailPage />} />
            <Route path="/alunos/edit/:ra" element={<AlunoEditPage />} />
            <Route path="/professores" element={<ProfessoresPage />} />
            <Route path="/professores/edit/:matricula" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><ProfessorEditPage /></ProtectedRoute>} />
            <Route path="/professores/view/:matricula" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><ProfessorViewPage /></ProtectedRoute>} />
            <Route path="/cursos" element={<CursosPage />} />
            <Route path="/cursos/new" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><CursoNewPage /></ProtectedRoute>} />
            <Route path="/cursos/edit/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><CursoEditPage /></ProtectedRoute>} />
            <Route path="/cursos/view/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><CursoViewPage /></ProtectedRoute>} />
            <Route path="/turmas" element={<TurmasPage />} />
            <Route path="/turmas/:id" element={<TurmaDetailPage />} />
            <Route path="/turmas/view/:id" element={<TurmaDetailPage />} />
            <Route path="/turmas/new" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><TurmaNewPage /></ProtectedRoute>} />
            <Route path="/turmas/edit/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><TurmaEditPage /></ProtectedRoute>} />
            <Route path="/disciplinas" element={<DisciplinasPage />} />
            <Route path="/disciplinas/new" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><DisciplinaNewPage /></ProtectedRoute>} />
            <Route path="/disciplinas/edit/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><DisciplinaEditPage /></ProtectedRoute>} />
            <Route path="/disciplinas/view/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA]}><DisciplinaViewPage /></ProtectedRoute>} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/avaliacoes" element={<AvaliacoesPage />} />
            <Route path="/aulas" element={<AulasPage />} />
            <Route path="/aulas/view/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]}><AulaViewPage /></ProtectedRoute>} />
            <Route path="/aulas/edit/:id" element={<ProtectedRoute roles={[Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]}><AulaEditPage /></ProtectedRoute>} />
            <Route path="/presencas" element={<PresencasPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
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
