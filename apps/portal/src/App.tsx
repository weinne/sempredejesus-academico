import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Role } from '@/types/api';

// Pages
import LoginPage from '@/pages/login';
import DashboardPage from '@/pages/dashboard';
import PessoasPage from '@/pages/pessoas';
import AlunosPage from '@/pages/alunos';
import AlunoDetailPage from '@/pages/alunos/[id]';
import AlunoEditPage from '@/pages/alunos/edit/[ra]';
import ProfessoresPage from '@/pages/professores';
import CursosPage from '@/pages/cursos';
import TurmasPage from '@/pages/turmas';
import TurmaDetailPage from '@/pages/turmas/[id]';
import RelatoriosPage from '@/pages/relatorios';
import AvaliacoesPage from '@/pages/avaliacoes';
import AulasPage from '@/pages/aulas';
import CalendarioPage from '@/pages/calendario';
import UsersPage from '@/pages/users';
import MeuPortalPage from '@/pages/meu-portal';
import ConfigPage from '@/pages/config';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={[Role.ADMIN]}><UsersPage /></ProtectedRoute>} />
          <Route path="/pessoas" element={<ProtectedRoute><PessoasPage /></ProtectedRoute>} />
          <Route path="/alunos" element={<ProtectedRoute><AlunosPage /></ProtectedRoute>} />
          <Route path="/alunos/:ra" element={<ProtectedRoute><AlunoDetailPage /></ProtectedRoute>} />
          <Route path="/alunos/edit/:ra" element={<ProtectedRoute><AlunoEditPage /></ProtectedRoute>} />
          <Route path="/professores" element={<ProtectedRoute><ProfessoresPage /></ProtectedRoute>} />
          <Route path="/cursos" element={<ProtectedRoute><CursosPage /></ProtectedRoute>} />
          <Route path="/turmas" element={<ProtectedRoute><TurmasPage /></ProtectedRoute>} />
          <Route path="/turmas/:id" element={<ProtectedRoute><TurmaDetailPage /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
          <Route path="/avaliacoes" element={<ProtectedRoute><AvaliacoesPage /></ProtectedRoute>} />
          <Route path="/aulas" element={<ProtectedRoute><AulasPage /></ProtectedRoute>} />
          <Route path="/calendario" element={<ProtectedRoute><CalendarioPage /></ProtectedRoute>} />
          <Route path="/meu-portal" element={<ProtectedRoute><MeuPortalPage /></ProtectedRoute>} />
          <Route path="/config" element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App; 
