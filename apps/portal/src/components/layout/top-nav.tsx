import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  ChevronDown,
  BookOpen,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopNavProps {
  title?: string;
  showBreadcrumb?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export function TopNav({ 
  title, 
  showBreadcrumb = false, 
  onMenuClick,
  className = '' 
}: TopNavProps) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'SECRETARIA': return 'Secretaria';
      case 'PROFESSOR': return 'Professor';
      case 'ALUNO': return 'Aluno';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700';
      case 'SECRETARIA': return 'bg-blue-100 text-blue-700';
      case 'PROFESSOR': return 'bg-green-100 text-green-700';
      case 'ALUNO': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <header className={cn(
      'bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="h-9 w-9 hover:bg-slate-100"
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            
            <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-slate-900">Sistema Acadêmico</span>
                <p className="text-xs text-slate-500">Seminário Presbiteriano</p>
              </div>
            </Link>

            {title && (
              <>
                <div className="h-4 w-px bg-slate-200" />
                <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Quick actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="h-9 w-9 hover:bg-slate-100"
                title="Dashboard"
              >
                <Home className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-slate-100 relative"
                title="Notificações"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
              </Button>
            </div>

            {/* User menu */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 h-9 px-3 hover:bg-slate-100"
              >
                <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="h-3 w-3 text-slate-600" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-slate-900">
                    {user?.pessoa?.nome || user?.username}
                  </div>
                  <div className="text-xs text-slate-500">
                    {user?.role && getRoleDisplayName(user.role)}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200/60 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">
                          {user?.pessoa?.nome || user?.username}
                        </div>
                        <div className="text-sm text-slate-500">
                          {user?.pessoa?.email || user?.username}
                        </div>
                        <Badge className={cn('text-xs mt-1', getRoleBadgeColor(user?.role || ''))}>
                          {user?.role && getRoleDisplayName(user.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      to="/meu-portal"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      Meu Portal
                    </Link>
                    <Link
                      to="/meu-portal#alterar-senha"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Alterar Senha
                    </Link>
                  </div>
                  
                  <div className="border-t border-slate-100 py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
