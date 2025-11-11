import { describe, it, expect } from 'vitest';
import {
  CreateDisciplinaPeriodoSchema,
  UpdateDisciplinaPeriodoSchema,
} from '../disciplina-periodo';

describe('DisciplinaPeriodo schemas', () => {
  it('should accept minimal create payload and default obrigatoria to true', () => {
    const result = CreateDisciplinaPeriodoSchema.parse({
      disciplinaId: 10,
      periodoId: 5,
    });

    expect(result).toMatchObject({
      disciplinaId: 10,
      periodoId: 5,
      obrigatoria: true,
    });
  });

  it('should accept optional ordem when creating vínculo', () => {
    const result = CreateDisciplinaPeriodoSchema.parse({
      disciplinaId: 1,
      periodoId: 2,
      ordem: 3,
      obrigatoria: false,
    });

    expect(result).toMatchObject({
      disciplinaId: 1,
      periodoId: 2,
      ordem: 3,
      obrigatoria: false,
    });
  });

  it('should reject invalid create payloads', () => {
    expect(() =>
      CreateDisciplinaPeriodoSchema.parse({ periodoId: 2 }),
    ).toThrowError(/disciplinaId/);

    expect(() =>
      CreateDisciplinaPeriodoSchema.parse({ disciplinaId: 1 }),
    ).toThrowError(/periodoId/);

    expect(() =>
      CreateDisciplinaPeriodoSchema.parse({
        disciplinaId: 1,
        periodoId: 2,
        ordem: 0,
      }),
    ).toThrowError(/ordem/);
  });

  it('should require at least one field when updating vínculo', () => {
    expect(() => UpdateDisciplinaPeriodoSchema.parse({})).toThrowError(/Informe pelo menos um campo/);
  });

  it('should allow updating ordem and obrigatoriedade independently', () => {
    const ordemUpdate = UpdateDisciplinaPeriodoSchema.parse({ ordem: 2 });
    expect(ordemUpdate).toMatchObject({ ordem: 2 });

    const obrigUpdate = UpdateDisciplinaPeriodoSchema.parse({ obrigatoria: false });
    expect(obrigUpdate).toMatchObject({ obrigatoria: false });
  });
});

