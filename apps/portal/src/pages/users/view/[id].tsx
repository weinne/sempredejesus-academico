import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiService.getUser(Number(id)),
    enabled: !!id,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Detalhes do Usuário" backTo="/users" />
        <div className="max-w-3xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title={`Usuário: ${user.username}`}
        backTo="/users"
        actions={
          <Link to={`/users/edit/${user.id}`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        }
      />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Username</div>
                  <div className="font-medium">{user.username}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Role</div>
                  <div className="font-medium">{user.role}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium">{user.isActive === 'S' ? 'Ativo' : 'Inativo'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pessoa</div>
                  <div className="font-medium">{user.pessoa?.nome || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{user.pessoa?.email || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


