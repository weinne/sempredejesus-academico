import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { LoginRequest } from '@/types/api';
import { apiService } from '@/services/api';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const bootstrapSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
});

type BootstrapFormData = z.infer<typeof bootstrapSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  
  // Detectar ambiente de desenvolvimento
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerBootstrap,
    handleSubmit: handleBootstrapSubmit,
    formState: { errors: bootstrapErrors },
    reset: resetBootstrap,
  } = useForm<BootstrapFormData>({
    resolver: zodResolver(bootstrapSchema),
  });

  // Função para copiar email e preencher o formulário
  const fillCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    toast({
      title: "Credenciais preenchidas",
      description: `Email: ${email}`,
    });
  };

  // (Redirect check moved below to keep hook order consistent)

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      await login(data as LoginRequest);
    } catch (error) {
      // Error handling is done in the AuthProvider
    } finally {
      setIsSubmitting(false);
    }
  };

  // (Loading UI moved below to keep hook order consistent)

  // Check if admin exists on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await apiService.adminExists();
        if (mounted) {
          setAdminExists(result.exists);
        }
      } catch (e) {
        // If failed, assume admin exists to show login
        if (mounted) setAdminExists(true);
      } finally {
        if (mounted) setCheckingAdmin(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Ensure all hooks run before conditional returns to avoid hook-order mismatch
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const onCreateAdmin = async (data: BootstrapFormData) => {
    try {
      setIsSubmitting(true);
      await apiService.bootstrapAdmin({ nome: data.nome, email: data.email, password: data.password });
      toast({ title: 'Administrador criado', description: 'Efetuando login...' });
      await login({ email: data.email, password: data.password } as LoginRequest);
      resetBootstrap();
    } catch (error: any) {
      toast({ title: 'Falha ao criar administrador', description: error?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAdmin || adminExists === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If no admin exists, show bootstrap admin screen
  if (adminExists === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema Acadêmico
            </h1>
            <p className="text-gray-600">
              Seminário Presbiteriano de Jesus
            </p>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Configurar Administrador Inicial</CardTitle>
              <CardDescription>
                Cadastre o primeiro administrador para iniciar o uso do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBootstrapSubmit(onCreateAdmin)} className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome completo
                  </label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    {...registerBootstrap('nome')}
                    className={bootstrapErrors.nome ? 'border-red-500' : ''}
                  />
                  {bootstrapErrors.nome && (
                    <p className="mt-1 text-sm text-red-600">{bootstrapErrors.nome.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@exemplo.com"
                    {...registerBootstrap('email')}
                    className={bootstrapErrors.email ? 'border-red-500' : ''}
                  />
                  {bootstrapErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{bootstrapErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Crie uma senha segura"
                    {...registerBootstrap('password')}
                    className={bootstrapErrors.password ? 'border-red-500' : ''}
                  />
                  {bootstrapErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{bootstrapErrors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    'Criar Administrador'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema Acadêmico
          </h1>
          <p className="text-gray-600">
            Seminário Presbiteriano de Jesus
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Entrar no Sistema</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar o portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Credenciais de teste - apenas em desenvolvimento */}
            {isDevelopment && (
              <div className="mt-6 border-t pt-6">
                <div className="text-sm text-gray-600">
                  <p className="mb-2 font-medium">🧪 Usuários de teste (desenvolvimento):</p>
                  <div className="space-y-2 text-xs bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => fillCredentials('admin@seminario.edu', 'admin123')}
                        className="text-left p-2 rounded hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                      >
                        <p className="font-semibold text-blue-700 mb-1">ADMIN</p>
                        <p className="text-gray-700">admin@seminario.edu</p>
                        <p className="text-gray-500">admin123</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillCredentials('secretaria@seminario.edu', 'test123')}
                        className="text-left p-2 rounded hover:bg-green-50 transition-colors border border-transparent hover:border-green-200"
                      >
                        <p className="font-semibold text-green-700 mb-1">SECRETARIA</p>
                        <p className="text-gray-700">secretaria@seminario.edu</p>
                        <p className="text-gray-500">test123</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillCredentials('professor@seminario.edu', 'test123')}
                        className="text-left p-2 rounded hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-200"
                      >
                        <p className="font-semibold text-purple-700 mb-1">PROFESSOR</p>
                        <p className="text-gray-700">professor@seminario.edu</p>
                        <p className="text-gray-500">test123</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillCredentials('aluno@seminario.edu', 'test123')}
                        className="text-left p-2 rounded hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-200"
                      >
                        <p className="font-semibold text-orange-700 mb-1">ALUNO</p>
                        <p className="text-gray-700">aluno@seminario.edu</p>
                        <p className="text-gray-500">test123</p>
                      </button>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-gray-500 text-center">
                        💡 <strong>Dica:</strong> Clique em qualquer usuário acima para preencher o formulário
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}