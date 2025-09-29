import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard } from '@/components/ui/stats-card';
import { ArrowLeft, User, Shield, Mail, Phone, Key, CheckCircle, XCircle, Clock, ArrowRight, Users, Settings } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function MeuPortalPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<{ nome?: string; email?: string; telefone?: string }>(
    {
      defaultValues: {
        nome: user?.pessoa?.nome || '',
        email: user?.pessoa?.email || '',
        telefone: user?.pessoa?.telefone || '',
      }
    }
  );

  const { register: registerPwd, handleSubmit: handleSubmitPwd, reset: resetPwd, formState: { errors: errorsPwd, isSubmitting: isSubmittingPwd } } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  const onSubmitProfile = async (data: { nome?: string; email?: string; telefone?: string }) => {
    try {
      const updated = await apiService.updateMyProfile({ nome: data.nome, email: data.email, telefone: data.telefone } as any);
      toast({ title: 'Perfil atualizado', description: 'Suas informações foram atualizadas com sucesso.' });
      reset({ nome: updated.nome, email: updated.email, telefone: updated.telefone });
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar perfil', description: e.message || 'Tente novamente mais tarde', variant: 'destructive' });
    }
  };

  const onSubmitPassword = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({ title: 'Senhas não conferem', description: 'A confirmação deve ser igual à nova senha', variant: 'destructive' });
      return;
    }
    try {
      await apiService.changeMyPassword(data);
      toast({ title: 'Senha alterada', description: 'Sua senha foi alterada com sucesso.' });
      resetPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      toast({ title: 'Erro ao alterar senha', description: e.message || 'Tente novamente mais tarde', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Portal</h1>
              <p className="text-sm text-gray-600">Informações pessoais e acadêmicas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        badge="Meu Portal"
        title={`Bem-vindo, ${user?.pessoa?.nome || 'Usuário'}!`}
        description="Gerencie suas informações pessoais, altere sua senha e visualize seus dados acadêmicos."
        stats={[
          { value: user?.role || 'N/A', label: 'Perfil' },
          { value: user?.pessoa?.email ? 'Sim' : 'Não', label: 'Email' },
          { value: user?.pessoa?.telefone ? 'Sim' : 'Não', label: 'Telefone' },
          { value: 'Ativo', label: 'Status' }
        ]}
        actionLink={{
          href: '/dashboard',
          label: 'Ver dashboard'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatCard
            title="Perfil"
            value={user?.role || 'N/A'}
            icon={User}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Email"
            value={user?.pessoa?.email ? 'Sim' : 'Não'}
            icon={Mail}
            iconColor={user?.pessoa?.email ? 'text-green-600' : 'text-red-600'}
          />
          <StatCard
            title="Telefone"
            value={user?.pessoa?.telefone ? 'Sim' : 'Não'}
            icon={Phone}
            iconColor={user?.pessoa?.telefone ? 'text-green-600' : 'text-red-600'}
          />
          <StatCard
            title="Status"
            value="Ativo"
            icon={CheckCircle}
            iconColor="text-green-600"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Veja e atualize suas informações básicas</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <Input {...register('nome')} defaultValue={user?.pessoa?.nome || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <Input type="email" {...register('email')} defaultValue={user?.pessoa?.email || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <Input {...register('telefone')} defaultValue={user?.pessoa?.telefone || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Perfil</label>
                  <p className="mt-2 text-sm text-gray-900">{user?.role}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={isSubmitting}>Salvar alterações</Button>
                <Button type="button" variant="outline" onClick={() => reset()}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="h-6" />

        <Card id="alterar-senha">
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Atualize sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPwd(onSubmitPassword)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Senha Atual</label>
                  <Input type="password" {...registerPwd('currentPassword', { required: true })} />
                  {errorsPwd.currentPassword && <p className="text-sm text-red-600 mt-1">Obrigatório</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                  <Input type="password" {...registerPwd('newPassword', { required: true, minLength: 6 })} />
                  {errorsPwd.newPassword && <p className="text-sm text-red-600 mt-1">Mínimo 6 caracteres</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                  <Input type="password" {...registerPwd('confirmPassword', { required: true })} />
                  {errorsPwd.confirmPassword && <p className="text-sm text-red-600 mt-1">Obrigatório</p>}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={isSubmittingPwd}>Alterar Senha</Button>
                <Button type="button" variant="outline" onClick={() => resetPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}