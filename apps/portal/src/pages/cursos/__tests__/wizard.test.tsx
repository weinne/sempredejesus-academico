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
  addDisciplinaAoPeriodo: vi.fn(),
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
    addDisciplinaAoPeriodo: (id: number, payload: unknown) => apiMocks.addDisciplinaAoPeriodo(id, payload),
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
    apiMocks.addDisciplinaAoPeriodo.mockResolvedValue({});
  });

  it('permite configurar periodos com numeros duplicados e conclui o wizard', async () => {
    renderWizard();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Nome do curso/i), 'Curso Teste');
    await user.selectOptions(screen.getByLabelText(/Grau/i), 'BACHARELADO');
    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Noturno/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Noturno/i }));
    const periodCountInput = await screen.findByLabelText(/Quantidade de periodos/i);
    await user.clear(periodCountInput);
    await user.type(periodCountInput, '2');
    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    const numeroInputs = await screen.findAllByLabelText(/Numero \*/i);
    expect(numeroInputs.length).toBeGreaterThanOrEqual(2);
    await user.clear(numeroInputs[1]);
    await user.type(numeroInputs[1], '1');
    expect(numeroInputs[1]).toHaveValue(1);

    await user.click(screen.getByRole('button', { name: /Avancar/i }));
    await screen.findByText(/Resumo da configuracao/i);

    await user.click(screen.getByRole('button', { name: /Concluir wizard/i }));

    await waitFor(() => expect(apiMocks.createCurso).toHaveBeenCalledTimes(1));
    expect(apiMocks.createCurriculo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(apiMocks.createPeriodo).toHaveBeenCalled());
    const periodoCalls = apiMocks.createPeriodo.mock.calls;
    expect(periodoCalls.length).toBeGreaterThanOrEqual(2);
    const numerosCriados = periodoCalls.map(([payload]) => payload.numero);
    expect(numerosCriados).toContain(1);
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

    const existingRemoveButton = await screen.findByRole('button', { name: /Remover curriculo/i });
    expect(existingRemoveButton).toBeDisabled();

    const periodCountInput = await screen.findByLabelText(/Quantidade de periodos/i);
    await user.clear(periodCountInput);
    await user.type(periodCountInput, '2');
    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    const addButtons = screen.getAllByRole('button', { name: /Nova disciplina/i });
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

    await waitFor(() =>
      expect(apiMocks.updateCurso).toHaveBeenCalledWith(
        55,
        expect.objectContaining({
          nome: 'Curso Existente',
          grau: 'BACHARELADO',
        }),
      ),
    );
    expect(apiMocks.createPeriodo).not.toHaveBeenCalled();
    expect(apiMocks.createDisciplina).not.toHaveBeenCalled();
    expect(apiMocks.updateDisciplina).not.toHaveBeenCalled();
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/cursos/view/55'));
  });

  it('permite reutilizar disciplinas ja cadastradas entre periodos', async () => {
    renderWizard();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Nome do curso/i), 'Curso Compartilhado');
    await user.selectOptions(screen.getByLabelText(/Grau/i), 'BACHARELADO');
    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Noturno/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Noturno/i }));
    const periodCountInput = await screen.findByLabelText(/Quantidade de periodos/i);
    await user.clear(periodCountInput);
    await user.type(periodCountInput, '2');
    await user.click(screen.getByRole('button', { name: /Avancar/i }));

    const periodHeadings = await screen.findAllByText(/Configuracao do periodo/i);
    const resolveContainer = (heading: HTMLElement) => {
      let container: HTMLElement | null = heading.closest('div');
      while (container && !container.classList.contains('border')) {
        container = container.parentElement as HTMLElement | null;
      }
      if (!container) {
        throw new Error('Nao foi possivel localizar a secao do periodo');
      }
      return container;
    };

    const firstPeriodContainer = resolveContainer(periodHeadings[0]);
    const firstScoped = within(firstPeriodContainer);
    await user.click(firstScoped.getByRole('button', { name: /Nova disciplina/i }));
    await user.type(firstScoped.getByLabelText(/Codigo \*/i), 'DISC1');
    await user.type(firstScoped.getByLabelText(/Nome \*/i), 'Disciplina Compartilhada');
    await user.type(firstScoped.getByLabelText(/Creditos \*/i), '3');
    await user.type(firstScoped.getByLabelText(/Carga horaria \(horas\) \*/i), '60');

    const secondPeriodContainer = resolveContainer(periodHeadings[1]);
    const secondScoped = within(secondPeriodContainer);
    const existingSelect = secondScoped.getByRole('combobox', { name: /Selecionar disciplina existente/i });
    await waitFor(() =>
      expect(Array.from((existingSelect as HTMLSelectElement).options).some((option) => option.value === 'codigo-DISC1')).toBe(true),
    );
    await user.selectOptions(existingSelect, 'codigo-DISC1');
    await user.click(secondScoped.getByRole('button', { name: /Usar selecionada/i }));

    expect(secondScoped.getAllByText(/DISC1/i).length).toBeGreaterThan(0);
    expect(secondScoped.getAllByText(/Disciplina Compartilhada/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Avancar/i }));
    await user.click(screen.getByRole('button', { name: /Concluir wizard/i }));

    await waitFor(() => expect(apiMocks.createDisciplina).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(apiMocks.addDisciplinaAoPeriodo).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/cursos/view/101'));
  });
});

