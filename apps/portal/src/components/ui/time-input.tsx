import * as React from "react"
import { cn } from "@/lib/utils"

// Gera opções de horas (00-23) - formato 24h
const HORAS_24 = Array.from({ length: 24 }, (_, i) => {
  const hora = i.toString().padStart(2, '0');
  return { value: hora, label: hora };
});

// Gera opções de minutos (00-59)
const MINUTOS = Array.from({ length: 60 }, (_, i) => {
  const minuto = i.toString().padStart(2, '0');
  return { value: minuto, label: minuto };
});

export interface TimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  /**
   * Valor no formato 24h (HH:mm)
   * Exemplo: "08:30", "14:15", "23:59"
   */
  value?: string;
  /**
   * Callback quando o valor muda
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * ID do input (para labels)
   */
  id?: string;
  /**
   * Nome do input
   */
  name?: string;
  /**
   * Placeholder
   */
  placeholder?: string;
  /**
   * Classes CSS adicionais
   */
  className?: string;
  /**
   * Se está desabilitado
   */
  disabled?: boolean;
}

/**
 * Componente de input de hora que FORÇA formato 24h (HH:mm) visualmente
 * 
 * Usa selects separados para hora e minuto, garantindo formato 24h sempre,
 * independente da configuração do sistema operacional do usuário.
 */
const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, value, defaultValue, onChange, id, name, placeholder, disabled, ...rest }, ref) => {
    // Parse do valor HH:mm em hora e minuto
    const parseTime = (timeValue: string | undefined): { hora: string; minuto: string } => {
      if (!timeValue) return { hora: '', minuto: '' };
      // Remove segundos se existirem (formato HH:mm:ss -> HH:mm)
      const cleanValue = timeValue.substring(0, 5);
      const [hora = '', minuto = ''] = cleanValue.split(':');
      return { hora, minuto };
    };

    const initialValue = (value ?? (defaultValue as string | undefined)) || '';
    const [{ hora, minuto }, setTime] = React.useState(() => parseTime(initialValue));

    const composedValue = React.useMemo(() => (hora && minuto ? `${hora}:${minuto}` : ''), [hora, minuto]);

    React.useEffect(() => {
      if (value !== undefined && value !== composedValue) {
        setTime(parseTime(value));
      }
    }, [value, composedValue]);

    const handleChange = (tipo: 'hora' | 'minuto', novoValor: string) => {
      const novoEstado =
        tipo === 'hora'
          ? { hora: novoValor, minuto }
          : {
              hora,
              minuto: novoValor,
            };

      setTime(novoEstado);

      if (!onChange) return;

      const novaHora = novoEstado.hora;
      const novoMinuto = novoEstado.minuto;

      // Monta o valor no formato HH:mm
      // Só emite valor completo quando ambos (hora e minuto) estão selecionados
      const novoValorCompleto = novaHora && novoMinuto ? `${novaHora}:${novoMinuto}` : '';

      // Cria um evento sintético para compatibilidade com onChange
      const syntheticEvent = {
        target: {
          value: novoValorCompleto,
          name: name,
          id: id,
        },
        currentTarget: {
          value: novoValorCompleto,
          name: name,
          id: id,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      onChange(syntheticEvent);
    };

    const selectBaseClasses = "h-11 px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-sm disabled:cursor-not-allowed disabled:opacity-50";

    return (
      <div className={cn("flex items-center gap-2 w-full", className)}>
        <input
          type="hidden"
          name={name}
          id={id}
          value={composedValue}
          readOnly
          ref={ref}
          {...rest}
        />
        {/* Select de Hora (00-23) */}
        <select
          id={id ? `${id}_hora` : undefined}
          name={name ? `${name}_hora` : undefined}
          value={hora}
          onChange={(e) => handleChange('hora', e.target.value)}
          disabled={disabled}
          className={cn(selectBaseClasses, "w-20")}
        >
          <option value="">--</option>
          {HORAS_24.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>

        <span className="text-muted-foreground text-sm font-medium">:</span>

        {/* Select de Minuto (00-59) */}
        <select
          id={id ? `${id}_minuto` : undefined}
          name={name ? `${name}_minuto` : undefined}
          value={minuto}
          onChange={(e) => handleChange('minuto', e.target.value)}
          disabled={disabled}
          className={cn(selectBaseClasses, "w-20")}
        >
          <option value="">--</option>
          {MINUTOS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
TimeInput.displayName = "TimeInput";

export { TimeInput };

