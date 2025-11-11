import { describe, it, expect } from 'vitest';
import { apiService } from '../api';

describe('ApiService mapDisciplina', () => {
  it('should map disciplina with múltiplos vínculos corretamente', () => {
    const payload = {
      id: 12,
      cursoId: 3,
      codigo: 'ABC123',
      nome: 'Disciplina Teste',
      creditos: 4,
      cargaHoraria: 60,
      ativo: true,
      periodos: [
        {
          disciplinaId: 12,
          periodoId: 7,
          ordem: 1,
          obrigatoria: true,
          periodo: {
            id: 7,
            numero: 1,
            nome: '1º Período',
            curriculoId: 5,
          },
        },
        {
          disciplinaId: 12,
          periodoId: 8,
          obrigatoria: false,
          periodo: {
            id: 8,
            numero: 2,
            nome: '2º Período',
            curriculoId: 5,
          },
        },
      ],
    };

    const mapped = (apiService as any).mapDisciplina(payload);

    expect(mapped).toMatchObject({
      id: 12,
      cursoId: 3,
      codigo: 'ABC123',
      periodos: [
        {
          periodoId: 7,
          ordem: 1,
          obrigatoria: true,
          periodo: {
            id: 7,
            numero: 1,
            nome: '1º Período',
            curriculoId: 5,
          },
        },
        {
          periodoId: 8,
          ordem: undefined,
          obrigatoria: false,
          periodo: {
            id: 8,
            numero: 2,
            nome: '2º Período',
            curriculoId: 5,
          },
        },
      ],
    });
  });

  it('should normalizar valores ausentes', () => {
    const payload = {
      id: 1,
      cursoId: 2,
      codigo: 'XYZ',
      nome: 'Outra Disciplina',
      creditos: 2,
      cargaHoraria: 30,
      ativo: false,
      periodos: undefined,
    };

    const mapped = (apiService as any).mapDisciplina(payload);
    expect(mapped.periodos).toEqual([]);
    expect(mapped.ativo).toBe(false);
  });
});

