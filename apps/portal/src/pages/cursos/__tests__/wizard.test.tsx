import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CursoWizardPage from '../wizard';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const toastMock = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

const apiMocks = {
  getTurnos: vi.fn(),
  getCursos: vi.fn(),
  getCurso: vi.fn(),
  getCurriculos: vi.fn(),
  getPeriodos: vi.fn(),
  getDisciplinas: vi.fn(),
  createCurso: vi.fn(),
  updateCurso: vi.fn(),
  createCurriculo: vi.fn(),
  updateCurriculo: vi.fn(),
  createPeriodo: vi.fn(),
  updatePeriodo: vi.fn(),
  createDisciplina: vi.fn(),
  updateDisciplina: vi.fn(),
};

vi.mock('@/services/api', () => ({
  apiService: {
    getTurnos: (params?: unknown) => apiMocks.getTurnos(params),
    getCursos: (params?: unknown) => apiMocks.getCursos(params),
    getCurso: (id: number) => apiMocks.getCurso(id),
    getCurriculos: (params?: unknown) => apiMocks.getCurriculos(params),
    getPeriodos: (params?: unknown) => apiMocks.getPeriodos(params),
    getDisciplinas: (params?: unknown) => apiMocks.getDisciplinas(params),
    createCurso: (payload: unknown) => apiMocks.createCurso(payload),
    updateCurso: (id: number, payload: unknown) => apiMocks.updateCurso(id, payload),
    createCurriculo: (payload: unknown) => apiMocks.createCurriculo(payload),
    updateCurriculo: (id: number, payload: unknown) => apiMocks.updateCurriculo(id, payload),
    createPeriodo: (payload: unknown) => apiMocks.createPeriodo(payload),
    updatePeriodo: (id: number, payload: unknown) => apiMocks.updatePeriodo(id, payload),
    createDisciplina: (payload: unknown) => apiMocks.createDisciplina(payload),
    updateDisciplina: (id: number, payload: unknown) => apiMocks.updateDisciplina(id, payload),
  },
}));

function renderWizard(initialPath = '/cursos/wizard') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <CursoWizardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function createTurnoFixture(id: number, nome: string) {
  return { id, nome } as const;
}

describe('CursoWizardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(apiMocks).forEach((mockFn) => (mockFn as unknown as { mockReset: () => void }).mockReset());
    apiMocks.getTurnos.mockResolvedValue([createTurnoFixture(1, 'Noturno')]);
    apiMocks.getCursos.mockResolvedValue({ data: [] });
    apiMocks.getCurso.mockResolvedValue({ id: 101, nome: 'Curso Teste', grau: 'BACHARELADO' });
    apiMocks.getCurriculos.mockResolvedValue([]);
    apiMocks.getPeriodos.mockResolvedValue({ data: [] });
    apiMocks.getDisciplinas.mockResolvedValue({ data: [] });
    apiMocks.createCurso.mockResolvedValue({ id: 101, nome: 'Curso Teste', grau: 'BACHARELADO' });
    apiMocks.updateCurso.mockResolvedValue({});
    apiMocks.createCurriculo.mockResolvedValue({ id: 201, cursoId: 101, turnoId: 1, versao: 'v1.0', ativo: true });
    apiMocks.updateCurriculo.mockResolvedValue({});
    apiMocks.createPeriodo.mockResolvedValue({ id: 301, numero: 1 });
    apiMocks.updatePeriodo.mockResolvedValue({});
    apiMocks.createDisciplina.mockResolvedValue({ id: 401 });
    apiMocks.updateDisciplina.mockResolvedValue({});
  });

  it('permite configurar periodos com numeros duplicados e conclui o wizard', async () => {
    renderWizard();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Nome do curso/i), 'Curso Teste');
    await user.selectOptions(screen.getByLabelText(/Grau/i), 'BACHARELADO');
    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    const periodCountInput = screen.getByLabelText(/Quantidade de periodos/i);
    await user.clear(periodCountInput);
    await user.type(periodCountInput, '2');
    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Noturno/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Noturno/i }));
    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    const periodHeadings = await screen.findAllByText(/Configuracao do periodo/i);
    const numeroInputs = periodHeadings.slice(0, 2).map((heading) => {
      const section = heading.closest('div');
      if (!section) {
        throw new Error('Nao foi possivel localizar a secao do periodo');
      }
      const container = section.parentElement?.parentElement ?? section;
      return within(container).getByLabelText(/Numero \*/i) as HTMLInputElement;
    });
    expect(numeroInputs).toHaveLength(2);
    await user.clear(numeroInputs[1]);
    await user.type(numeroInputs[1], '1');
    expect(numeroInputs[0]).toHaveValue(1);
    expect(numeroInputs[1]).toHaveValue(1);

    await user.click(screen.getByRole('button', { name: /Avancar/i }));
    const resumoSecao = await screen.findByText(/Resumo da configuracao/i);
    const resumo = within(resumoSecao.closest('div') ?? resumoSecao);

    await user.click(screen.getByRole('button', { name: /Concluir wizard/i }));

    await waitFor(() => expect(apiMocks.createCurso).toHaveBeenCalledTimes(1));
    expect(apiMocks.createCurriculo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(apiMocks.createPeriodo).toHaveBeenCalled());
    const periodoCalls = apiMocks.createPeriodo.mock.calls;
    expect(periodoCalls.length).toBeGreaterThanOrEqual(2);
    expect(periodoCalls[0][0]).toMatchObject({ numero: 1 });
    expect(periodoCalls[1][0]).toMatchObject({ numero: 1 });
    expect(apiMocks.createDisciplina).not.toHaveBeenCalled();
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/cursos/view/101'));
  });


  it('permite continuar configuracao de curso existente adicionando nova disciplina', async () => {
    const existingCourse = { id: 55, nome: 'Curso Existente', grau: 'BACHARELADO' };
    const existingCurriculo = { id: 77, cursoId: 55, turnoId: 1, versao: 'v1.0', ativo: true };
    const existingPeriodo = { id: 88, cursoId: 55, turnoId: 1, curriculoId: 77, numero: 1, nome: 'Primeiro', descricao: 'Basico' };
    const existingDisciplina = {
      id: 99,
      cursoId: 55,
      periodoId: 88,
      codigo: 'DISC1',
      nome: 'Introducao',
      creditos: 3,
      cargaHoraria: 60,
    };

    apiMocks.getCursos.mockResolvedValue({ data: [existingCourse] });
    apiMocks.getCurso.mockResolvedValue(existingCourse);
    apiMocks.getCurriculos.mockResolvedValue([existingCurriculo]);
    apiMocks.getPeriodos.mockResolvedValue({ data: [existingPeriodo] });
    apiMocks.getDisciplinas.mockResolvedValue({ data: [existingDisciplina] });

    renderWizard('/cursos/wizard?cursoId=55');
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText(/Estrutura carregada/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/Nome do curso/i)).toHaveValue('Curso Existente');

    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    const periodCountInput = screen.getByLabelText(/Quantidade de periodos/i);
    await user.clear(periodCountInput);
    await user.type(periodCountInput, '2');
    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Noturno/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    const existingRemoveButton = screen.getAllByRole('button', { name: /Remover/ })[0];
    expect(existingRemoveButton).toBeDisabled();

    const addButtons = screen.getAllByRole('button', { name: /Adicionar disciplina/i });
    const addButtonForNewPeriod = addButtons[addButtons.length - 1];
    await user.click(addButtonForNewPeriod);

    let periodContainer: HTMLElement | null = addButtonForNewPeriod.parentElement as HTMLElement | null;
    while (periodContainer && !periodContainer.classList.contains('border')) {
      periodContainer = periodContainer.parentElement as HTMLElement | null;
    }
    expect(periodContainer).not.toBeNull();
    const scoped = within(periodContainer!);

    await user.type(scoped.getByLabelText(/Codigo \*/i), 'DISC2');
    await user.type(scoped.getByLabelText(/Nome \*/i), 'Nova Disciplina');
    await user.type(scoped.getByLabelText(/Creditos \*/i), '4');
    await user.type(scoped.getByLabelText(/Carga horaria \(horas\) \*/i), '60');

    await user.click(screen.getByRole('button', { name: /Avancar/i }));
    await user.click(screen.getByRole('button', { name: /Concluir wizard/i }));

    await waitFor(() => expect(apiMocks.createPeriodo).toHaveBeenCalledWith(expect.objectContaining({ cursoId: 55, numero: 2 })));
    await waitFor(() => expect(apiMocks.createDisciplina).toHaveBeenCalledWith(expect.objectContaining({ codigo: 'DISC2', nome: 'Nova Disciplina', cursoId: 55 })));
    expect(apiMocks.updateCurso).not.toHaveBeenCalled();
    expect(apiMocks.updateDisciplina).not.toHaveBeenCalled();
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/cursos/view/55'));
  });
});

