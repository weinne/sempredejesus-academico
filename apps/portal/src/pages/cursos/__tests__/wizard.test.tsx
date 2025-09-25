import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

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
  createCurso: vi.fn(),
  createCurriculo: vi.fn(),
  createPeriodo: vi.fn(),
  createDisciplina: vi.fn(),
};

vi.mock('@/services/api', () => ({
  apiService: {
    getTurnos: (params?: unknown) => apiMocks.getTurnos(params),
    createCurso: (payload: unknown) => apiMocks.createCurso(payload),
    createCurriculo: (payload: unknown) => apiMocks.createCurriculo(payload),
    createPeriodo: (payload: unknown) => apiMocks.createPeriodo(payload),
    createDisciplina: (payload: unknown) => apiMocks.createDisciplina(payload),
  },
}));

function renderWizard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
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
    apiMocks.getTurnos.mockResolvedValue([createTurnoFixture(1, 'Noturno')]);
    apiMocks.createCurso.mockResolvedValue({ id: 101, nome: 'Curso Teste', grau: 'BACHARELADO' });
    apiMocks.createCurriculo.mockResolvedValue({ id: 201, cursoId: 101, turnoId: 1, versao: 'v1.0', ativo: true });
    apiMocks.createPeriodo
      .mockResolvedValueOnce({ id: 301, numero: 1 })
      .mockResolvedValueOnce({ id: 302, numero: 1 });
    apiMocks.createDisciplina.mockResolvedValue({});
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

    const numeroInputs = await screen.findAllByLabelText(/Numero \*/i);
    expect(numeroInputs).toHaveLength(2);
    await user.clear(numeroInputs[1]);
    await user.type(numeroInputs[1], '1');
    expect(numeroInputs[0]).toHaveValue('1');
    expect(numeroInputs[1]).toHaveValue('1');

    await user.click(screen.getByRole('button', { name: /Avancar/i }));
    const resumoSecao = await screen.findByText(/Resumo da configuracao/i);
    const resumo = within(resumoSecao.closest('div') ?? resumoSecao);
    await waitFor(() => {
      const periodEntries = resumo.getAllByText(/Periodo 1/i);
      expect(periodEntries.length).toBeGreaterThanOrEqual(2);
    });

    await user.click(screen.getByRole('button', { name: /Concluir wizard/i }));

    await waitFor(() => expect(apiMocks.createCurso).toHaveBeenCalledTimes(1));
    expect(apiMocks.createCurriculo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(apiMocks.createPeriodo).toHaveBeenCalledTimes(2));
    expect(apiMocks.createPeriodo.mock.calls[0][0]).toMatchObject({ numero: 1 });
    expect(apiMocks.createPeriodo.mock.calls[1][0]).toMatchObject({ numero: 1 });
    expect(apiMocks.createDisciplina).not.toHaveBeenCalled();
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/cursos/view/101'));
  });
});
