import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Role, LoginRequest } from '@/types/api';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Load last user from storage and then refresh from API (/api/me) to keep data up-to-date
    const init = async () => {
      try {
        let cached = apiService.getCurrentUser();
        if (cached) setUser(cached);

        // Only attempt to load fresh profile if we have a token
        const hasToken = !!localStorage.getItem('access_token');
        if (!hasToken) {
          return;
        }

        const fresh = await apiService.getMyProfile();
        setUser(fresh);
        localStorage.setItem('user', JSON.stringify(fresh));
      } catch (error) {
        const cached = apiService.getCurrentUser();
        if (cached) return; // stay with cached if API not available
        console.warn('Error loading current user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);
      // After tokens are stored, fetch full profile so UI has pessoa.nome/username immediately
      const profile = await apiService.getMyProfile();
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${profile.pessoa?.nome || profile.username}!`,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
      setUser(null);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro no logout",
        description: error.message || "Erro ao fazer logout",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const userRoles = user.roles && user.roles.length ? user.roles : [user.role];
    return userRoles.some(r => allowedRoles.includes(r));
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    isLoading,
    login,
    logout,
    hasRole,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}