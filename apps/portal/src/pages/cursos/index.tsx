import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/providers/auth-provider';
import { useCan } from '@/lib/permissions';
import { apiService } from '@/services/api';
import { Curso, Curriculo, Disciplina, DisciplinaPeriodo, Periodo, Role, Turno } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, Trash2, BookOpen, Wand2, ArrowRight, ChevronRight, Calendar, Layers3, AlertTriangle } from 'lucide-react';
import { usePageHero } from '@/hooks/use-page-hero';
import { Pagination } from '@/components/crud/pagination';

interface CourseStructure {
 curriculos: Array<{
  curriculo: Curriculo;
  turno?: Turno;
  periodos: Array<{
   periodo: Periodo;
   disciplinas: Disciplina[];
  }>;
 }>;
 totalPeriodos: number;
 totalDisciplinas: number;
}

function formatGrauBadge(grau: string) {
 switch (grau?.toUpperCase()) {
  case 'BACHARELADO':
   return 'bg-blue-500/10 text-blue-600';
  case 'LICENCIATURA':
   return 'bg-emerald-500/10 text-emerald-600';
  case 'ESPECIALIZACAO':
   return 'bg-purple-500/10 text-purple-600';
  case 'MESTRADO':
   return 'bg-orange-500/10 text-orange-600';
  case 'DOUTORADO':
   return 'bg-rose-500/10 text-rose-600';
  default:
   return 'bg-slate-500/10 text-slate-600';
 }
}

export default function CursosPage() {
 const { hasRole } = useAuth();
 const navigate = useNavigate();
 const { toast } = useToast();
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState('');
 const [page, setPage] = useState(1);
 const [deletingCurso, setDeletingCurso] = useState<Curso | null>(null);
 const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

 const canCreate = useCan('create', 'cursos');
 const canEdit = useCan('edit', 'cursos');
 const canDelete = useCan('delete', 'cursos');

 const {
  data: cursosResponse,
  isLoading: isLoadingCursos,
  error,
 } = useQuery({
  queryKey: ['cursos', page],
  queryFn: () =>
   apiService.getCursos({
    page,
    limit: 20,
    sortBy: 'nome',
    sortOrder: 'asc',
   }),
 });

 const cursos = cursosResponse?.data || [];
 const pagination = cursosResponse?.pagination;

 const { data: turnosData, isLoading: isLoadingTurnos } = useQuery({
  queryKey: ['turnos'],
  queryFn: () => apiService.getTurnos(),
  staleTime: 1000 * 60 * 5,
 });

 const { data: curriculosData = [], isLoading: isLoadingCurriculos } = useQuery({
  queryKey: ['curriculos', 'overview'],
  queryFn: () => apiService.getCurriculos({ limit: 1000 }),
  staleTime: 1000 * 60 * 5,
 });

 const { data: periodosResponse, isLoading: isLoadingPeriodos } = useQuery({
  queryKey: ['periodos', 'overview'],
  queryFn: () => apiService.getPeriodos({ limit: 2000 }),
  staleTime: 1000 * 60 * 5,
 });
 const periodosData = periodosResponse?.data || [];

 const { data: disciplinasResponse, isLoading: isLoadingDisciplinas } = useQuery({
  queryKey: ['disciplinas', 'overview'],
  queryFn: () => apiService.getDisciplinas({ limit: 5000 }),
  staleTime: 1000 * 60 * 5,
 });
 const disciplinasData = disciplinasResponse?.data || [];

 const structureMap = useMemo(() => {
  const turnosMap = new Map((turnosData || []).map((turno) => [turno.id, turno]));
  const periodosByCurriculo = new Map<number, Periodo[]>();
  periodosData.forEach((periodo) => {
   const list = periodosByCurriculo.get(periodo.curriculoId) || [];
   list.push(periodo);
   periodosByCurriculo.set(periodo.curriculoId, list);
  });
  periodosByCurriculo.forEach((list) => list.sort((a, b) => Number(a.numero ?? 0) - Number(b.numero ?? 0)));

 const disciplinasByPeriodo = new Map<number, Disciplina[]>();
 disciplinasData.forEach((disciplina) => {
  const vinculos = Array.isArray(disciplina.periodos) ? disciplina.periodos : [];
  vinculos.forEach((vinculo) => {
    const periodoId = Number(vinculo.periodoId);
    if (!Number.isFinite(periodoId)) {
      return;
    }
    const list = disciplinasByPeriodo.get(periodoId) || [];
    list.push(disciplina);
    disciplinasByPeriodo.set(periodoId, list);
  });
 });
 disciplinasByPeriodo.forEach((list) => list.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));

  const map = new Map<number, CourseStructure>();

  cursos.forEach((curso) => {
   const courseCurriculos = curriculosData.filter((curriculo) => curriculo.cursoId === curso.id);
   const curriculoViews = courseCurriculos.map((curriculo) => {
    const periodos = (periodosByCurriculo.get(curriculo.id) || []).map((periodo) => ({
     periodo,
     disciplinas: disciplinasByPeriodo.get(periodo.id) || [],
    }));
    return {
     curriculo,
     turno: turnosMap.get(curriculo.turnoId),
     periodos,
    };
   });

   const totals = curriculoViews.reduce(
    (acc, view) => {
     acc.periodos += view.periodos.length;
     acc.disciplinas += view.periodos.reduce((sum, p) => sum + p.disciplinas.length, 0);
     return acc;
    },
    { periodos: 0, disciplinas: 0 },
   );

   map.set(curso.id, {
    curriculos: curriculoViews,
    totalPeriodos: totals.periodos,
    totalDisciplinas: totals.disciplinas,
   });
  });

  return map;
 }, [cursos, curriculosData, disciplinasData, periodosData, turnosData]);

 const filteredCursos = useMemo(() => {
  const term = searchTerm.trim().toLowerCase();
  if (!term) {
   return cursos;
  }
  return cursos.filter((curso) => {
   const structure = structureMap.get(curso.id);
   const extraText = structure
    ? structure.curriculos
      .flatMap((view) => [
       view.turno?.nome,
       view.curriculo.versao,
       ...view.periodos.flatMap((p) => [p.periodo.nome, ...p.disciplinas.map((d) => `${d.codigo} ${d.nome}`)]),
      ])
      .filter(Boolean)
      .join(' ')
    : '';
   const haystack = `${curso.nome} ${curso.grau} ${extraText}`.toLowerCase();
   return haystack.includes(term);
  });
 }, [cursos, searchTerm, structureMap]);

 const isStructureLoading = isLoadingTurnos || isLoadingCurriculos || isLoadingPeriodos || isLoadingDisciplinas;

 const deleteMutation = useMutation({
  mutationFn: (id: number) => apiService.deleteCurso(id),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['cursos'] });
   toast({
    title: 'Curso removido',
    description: 'Curso removido com sucesso!',
   });
   setIsDeleteDialogOpen(false);
   setDeletingCurso(null);
  },
  onError: (error: any) => {
   // Verificar se é erro de restrição de FK
   if (error.response?.status === 409 || 
       error.message?.includes('foreign key') || 
       error.message?.includes('constraint') ||
       error.message?.includes('violates foreign key')) {
     toast({
       title: 'Não é possível excluir',
       description: 'Este curso possui alunos, disciplinas ou currículos relacionados. Remova primeiro os dados relacionados para poder excluir o curso.',
       variant: 'destructive',
     });
     setIsDeleteDialogOpen(false);
     setDeletingCurso(null);
     return;
   }
   
   toast({
    title: 'Erro ao remover curso',
    description: error?.message || 'Erro desconhecido',
    variant: 'destructive',
   });
   setIsDeleteDialogOpen(false);
   setDeletingCurso(null);
  },
 });

 if (error) {
  return (
   <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
    <div className="max-w-5xl mx-auto px-6 py-24 text-center">
     <h2 className="text-3xl font-semibold mb-4">Erro ao carregar cursos</h2>
     <p className="text-slate-300">Nao foi possivel conectar ao servidor. Tente novamente em instantes.</p>
    </div>
   </div>
  );
 }

const handleDelete = (curso: Curso) => {
  setDeletingCurso(curso);
  setIsDeleteDialogOpen(true);
};

// Configure Hero via hook
usePageHero({
 title: "Gestão de cursos acadêmicos",
 description: "Crie, edite e organize o currículo de cada curso.",
 backTo: "/dashboard",
 stats: [
  { value: cursosResponse?.pagination?.total ?? cursos.length, label: 'Cursos' },
  { value: curriculosData.length, label: 'Currículos' },
  { value: periodosData.length, label: 'Períodos' },
  { value: disciplinasData.length, label: 'Disciplinas' }
 ],
 actionLink: {
  href: '/relatorios',
  label: 'Explorar relatórios'
 },
 actions: canCreate ? (
  <div className="flex gap-2">
   <Button variant="outline" onClick={() => navigate('/cursos/wizard')}>
    <Wand2 className="h-4 w-4 mr-2" />
    Abrir wizard
   </Button>
   <Button onClick={() => navigate('/cursos/new')}>
    <Plus className="h-4 w-4 mr-2" />
    Novo curso
   </Button>
  </div>
 ) : undefined
});

return (
 <div className="min-h-screen bg-background">

   <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <Card className="mb-6 border-0 shadow-sm">
     <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-sm">
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
       <Input
        value={searchTerm}
        onChange={(event) => {
         setSearchTerm(event.target.value);
         setPage(1);
        }}
        placeholder="Busque por curso, turno, periodo ou disciplina"
        className="pl-9"
       />
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
       <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
       Dados sincronizados automaticamente ao salvar no wizard.
      </div>
     </CardContent>
    </Card>

    {isLoadingCursos || isStructureLoading ? (
     <div className="grid gap-6 md:grid-cols-2">
      {[...Array(4)].map((_, index) => (
       <Card key={index} className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4 animate-pulse">
         <div className="h-6 w-1/2 bg-slate-200 rounded" />
         <div className="h-4 w-1/3 bg-slate-200 rounded" />
         <div className="space-y-2">
          <div className="h-3 w-full bg-slate-200 rounded" />
          <div className="h-3 w-5/6 bg-slate-200 rounded" />
          <div className="h-3 w-2/3 bg-slate-200 rounded" />
         </div>
        </CardContent>
       </Card>
      ))}
     </div>
    ) : (
     <>
      {filteredCursos.length === 0 ? (
       <Card className="border-0 shadow-sm">
        <CardContent className="p-10 text-center space-y-3">
         <BookOpen className="h-10 w-10 text-slate-400 mx-auto" />
         <p className="text-slate-600">{searchTerm ? 'Nenhum curso corresponde a busca.' : 'Nenhum curso cadastrado no momento.'}</p>
         {canCreate && (
          <Button onClick={() => navigate('/cursos/wizard')}>
           <Wand2 className="h-4 w-4 mr-2" />
           Criar curso pelo wizard
          </Button>
         )}
        </CardContent>
       </Card>
      ) : (
       <div className="grid gap-6 md:grid-cols-2">
        {filteredCursos.map((curso) => {
         const structure = structureMap.get(curso.id);
         return (
          <Card key={curso.id} className="border-0 shadow-sm flex flex-col">
           <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
             <div className="space-y-2">
              <Badge className={formatGrauBadge(curso.grau)}>{curso.grau}</Badge>
              <CardTitle className="text-2xl font-semibold text-slate-900">{curso.nome}</CardTitle>
              <CardDescription className="text-slate-600">
               {structure?.totalDisciplinas || 0} disciplinas | {structure?.totalPeriodos || 0} periodos
              </CardDescription>
             </div>
             {canEdit && (
              <div className="flex flex-col gap-2">
               <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/cursos/wizard?cursoId=${curso.id}`)}
                title="Continuar no wizard"
               >
                <Wand2 className="h-4 w-4" />
               </Button>
               <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/cursos/view/${curso.id}`)}
                title="Visualizar curso"
               >
                <ChevronRight className="h-4 w-4" />
               </Button>
              </div>
             )}
            </div>
           </CardHeader>
           <CardContent className="space-y-4 text-sm text-slate-600 flex-1">
            {structure && structure.curriculos.length > 0 ? (
             structure.curriculos.map(({ curriculo, turno, periodos }) => (
              <div key={curriculo.id} className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
               <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                 <Badge variant="outline" className="bg-white/70 text-slate-700">
                  <Layers3 className="h-3 w-3 mr-1" />
                  {turno?.nome || 'Turno nao informado'}
                 </Badge>
                 <span className="text-xs text-slate-500 uppercase tracking-wide">Versao {curriculo.versao}</span>
                </div>
                <span className="text-xs text-slate-500">
                 Vigencia: {curriculo.vigenteDe ? new Date(curriculo.vigenteDe).toLocaleDateString() : 'Nao informada'} - {curriculo.vigenteAte ? new Date(curriculo.vigenteAte).toLocaleDateString() : 'Atual'}
                </span>
               </div>
               <div className="mt-3 space-y-3">
                {periodos.length === 0 ? (
                 <p className="text-xs text-slate-500">Nenhum periodo cadastrado ainda.</p>
                ) : (
                 periodos.map(({ periodo, disciplinas }) => (
                  <div key={periodo.id} className="rounded-md bg-white px-3 py-2 shadow-sm border border-slate-100">
                   <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-700">
                     <Badge variant="secondary" className="bg-slate-900 text-white">
                      <Calendar className="h-3 w-3 mr-1" />
                      Periodo {periodo.numero}
                     </Badge>
                     <span className="font-medium">{periodo.nome || 'Sem titulo'}</span>
                    </div>
                    <span className="text-xs text-slate-500">{disciplinas.length} disciplinas</span>
                   </div>
                   {disciplinas.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                     {disciplinas.map((disciplina) => (
                      <li key={disciplina.id} className="flex items-center justify-between gap-2 border-t border-dashed border-slate-100 pt-1 first:border-t-0 first:pt-0">
                       <span className="font-medium text-slate-700">{disciplina.codigo}</span>
                       <span className="flex-1 mx-2 truncate">{disciplina.nome}</span>
                       <span className="text-slate-400">{disciplina.cargaHoraria}h</span>
                      </li>
                     ))}
                    </ul>
                   )}
                  </div>
                 ))
                )}
               </div>
              </div>
             ))
            ) : (
             <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Estrutura em carregamento ou ainda nao configurada.
             </div>
            )}
           </CardContent>
           <div className="border-t border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
             <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <BookOpen className="h-3 w-3" />
              {structure?.totalDisciplinas ?? 0} disciplinas
             </span>
             <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              <Layers3 className="h-3 w-3" />
              {structure?.totalPeriodos ?? 0} periodos
             </span>
            </div>
            <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={() => navigate(`/cursos/view/${curso.id}`)}>
              Ver detalhes
             </Button>
             {canDelete && (
              <Button
               variant="ghost"
               size="sm"
               className="text-red-600 hover:text-red-700"
               onClick={() => handleDelete(curso)}
               disabled={deleteMutation.isPending}
              >
               <Trash2 className="h-4 w-4 mr-1" />
               Remover
              </Button>
             )}
            </div>
           </div>
          </Card>
         );
        })}
       </div>
      )}
     </>
    )}

    <div className="mt-8">
     <Pagination page={page} totalPages={pagination?.totalPages || 0} onChange={setPage} />
    </div>
   </main>

   {/* Dialog para exclusão */}
   <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
     setIsDeleteDialogOpen(open);
     if (!open) {
       setDeletingCurso(null);
     }
   }}>
     <AlertDialogContent>
       <AlertDialogHeader>
         <AlertDialogTitle className="flex items-center">
           <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
           Confirmar Exclusão
         </AlertDialogTitle>
         <AlertDialogDescription>
           Tem certeza que deseja excluir o curso <strong>{deletingCurso?.nome}</strong>?
           <br />
           <br />
           <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
           <br />
           <br />
           <span className="text-sm text-gray-600">
             Esta ação pode afetar alunos e disciplinas vinculadas.
           </span>
         </AlertDialogDescription>
       </AlertDialogHeader>
       <AlertDialogFooter>
         <AlertDialogCancel onClick={() => {
           setIsDeleteDialogOpen(false);
           setDeletingCurso(null);
         }}>
           Cancelar
         </AlertDialogCancel>
         <AlertDialogAction
           onClick={() => deletingCurso && deleteMutation.mutate(deletingCurso.id)}
           className="bg-red-600 hover:bg-red-700"
           disabled={deleteMutation.isPending}
         >
           Excluir
         </AlertDialogAction>
       </AlertDialogFooter>
     </AlertDialogContent>
   </AlertDialog>
  </div>
 );
}

