import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeInput } from '../time-input';

describe('TimeInput component', () => {
  it('preenche o valor completo ao selecionar hora e minuto', () => {
    const handleChange = vi.fn();
    render(<TimeInput name="horaInicio" onChange={handleChange} />);

    const [horaSelect, minutoSelect] = screen.getAllByRole('combobox');

    fireEvent.change(horaSelect, { target: { value: '08' } });
    fireEvent.change(minutoSelect, { target: { value: '30' } });

    const lastCall = handleChange.mock.calls.at(-1)?.[0];
    expect(lastCall?.target.value).toBe('08:30');

    const hiddenInput = document.querySelector(
      'input[type="hidden"][name="horaInicio"]',
    ) as HTMLInputElement | null;
    expect(hiddenInput?.value).toBe('08:30');
  });
});

