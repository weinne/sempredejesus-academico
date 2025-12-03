import { describe, expect, it, vi, afterEach } from 'vitest';

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'mocked-uuid'),
}));

import { sanitizeHorarios } from '../../../routes/turnos.routes';

describe('sanitizeHorarios', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when no value is provided', () => {
    expect(sanitizeHorarios(undefined)).toBeUndefined();
  });

  it('normalizes horarios, assigning ids and ordens', () => {
    const result = sanitizeHorarios([
      { descricao: 'Primeiro', horaInicio: '19:00', horaFim: '20:40' },
      { descricao: 'Segundo', horaInicio: '20:50', horaFim: '22:30', ordem: 5 },
    ]);

    expect(result).toHaveLength(2);
    expect(result?.[0]).toMatchObject({
      id: 'mocked-uuid',
      ordem: 1,
      horaInicio: '19:00',
      horaFim: '20:40',
    });
    expect(result?.[1]).toMatchObject({
      ordem: 2,
      horaInicio: '20:50',
      horaFim: '22:30',
    });
  });

  it('throws when horarios overlap', () => {
    expect(() =>
      sanitizeHorarios([
        { horaInicio: '19:00', horaFim: '20:00' },
        { horaInicio: '19:30', horaFim: '21:00' },
      ]),
    ).toThrow(/não podem se sobrepor/i);
  });
});

