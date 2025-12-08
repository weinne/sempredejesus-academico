import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { ApiError, ChangePassword, Role, User } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/auth-provider';

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
    const formatPasswordError = (error: any): string => {
      const apiError = error as ApiError;
      const validationErrors = apiError?.details?.errors;
      const translateField = (field?: string) => {
        if (!field) return '';
        const labels: Record<string, string> = {
          currentPassword: 'Senha atual',
          newPassword: 'Nova senha',
          confirmPassword: 'Confirmação da senha',
        };
        return labels[field] || field;
      };
      const translateMessage = (message?: string) => {
        if (!message) return 'Dados inválidos.';
        const normalized = message.toLowerCase();
        if (normalized.includes('>=6')) {
          return 'Precisa ter pelo menos 6 caracteres.';
        }
        if (normalized.includes('required')) {
          return 'Campo obrigatório.';
        }
        if (normalized.includes('do not match') || normalized.includes("don't match")) {
          return 'As senhas não conferem.';
        }
        return message;
      };

      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors
          .map((item: any) => {
            const label = translateField(item.field);
            const friendlyMessage = translateMessage(item.message);
            return label ? `${label}: ${friendlyMessage}` : friendlyMessage;
          })
          .join(' | ');
      }
      return apiError?.message || 'Erro ao alterar senha';
    };
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiService.getUser(Number(id)),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<User>) => apiService.updateUser(Number(id), payload as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast({ title: 'Usuário atualizado', description: 'Usuário atualizado com sucesso!' });
      navigate('/users');
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar usuário', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePassword) =>
      apiService.changePassword(Number(id), payload),
    onSuccess: () => toast({ title: 'Senha alterada', description: 'Senha alterada com sucesso!' }),
    onError: (error: any) => toast({ title: 'Erro ao alterar senha', description: formatPasswordError(error), variant: 'destructive' }),
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Usuário" backTo="/users" />
        <div className="max-w-3xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  const isSameUser = currentUser?.id === user.id;
  const requesterIsAdmin = currentUser?.role === Role.ADMIN;
  const canChangePassword = user.role !== Role.ADMIN || isSameUser;
  const requiresCurrentPassword = !requesterIsAdmin || isSameUser;

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title={`Editar Usuário: ${user.username}`} backTo="/users" />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const formData = new FormData(form);
                  updateMutation.mutate({
                    username: String(formData.get('username') || user.username),
                    role: String(formData.get('role') || user.role) as any,
                    isActive: String(formData.get('isActive') || user.isActive) as any,
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <Input name="username" defaultValue={user.username} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select name="role" defaultValue={user.role as any} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value="ADMIN">Administrador</option>
                      <option value="SECRETARIA">Secretaria</option>
                      <option value="PROFESSOR">Professor</option>
                      <option value="ALUNO">Aluno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="isActive" defaultValue={user.isActive} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value="S">Ativo</option>
                      <option value="N">Inativo</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>Atualizar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/users')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card id="password">
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
            </CardHeader>
            <CardContent>
              {canChangePassword ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const formData = new FormData(form);
                    const currentPasswordValue = String(formData.get('currentPassword') || '').trim();
                    const payload: ChangePassword = {
                      newPassword: String(formData.get('newPassword') || ''),
                      confirmPassword: String(formData.get('confirmPassword') || ''),
                    };
                    if (currentPasswordValue.length > 0) {
                      payload.currentPassword = currentPasswordValue;
                    }
                    changePasswordMutation.mutate(payload);
                  }}
                  className={requiresCurrentPassword ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}
                >
                  {requiresCurrentPassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual *</label>
                      <Input name="currentPassword" type="password" required />
                    </div>
                  )}
                  {!requiresCurrentPassword && (
                    <input type="hidden" name="currentPassword" value="" />
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha *</label>
                    <Input name="newPassword" type="password" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha *</label>
                    <Input name="confirmPassword" type="password" required />
                  </div>
                  {!requiresCurrentPassword && (
                    <p className="text-sm text-gray-600 md:col-span-2">
                      Como administrador, você pode definir uma nova senha sem informar a anterior.
                    </p>
                  )}
                  <div className={requiresCurrentPassword ? 'md:col-span-3 flex gap-2' : 'md:col-span-2 flex gap-2'}>
                    <Button type="submit" disabled={changePasswordMutation.isPending}>Alterar Senha</Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-gray-600">
                  Apenas o próprio administrador pode alterar a sua senha. Oriente o usuário a acessar a área "Meu Perfil" para realizar a troca.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


