import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const DIAS_SEMANA = [
  { value: 'Segunda-feira', label: 'Segunda-feira' },
  { value: 'Terça-feira', label: 'Terça-feira' },
  { value: 'Quarta-feira', label: 'Quarta-feira' },
  { value: 'Quinta-feira', label: 'Quinta-feira' },
  { value: 'Sexta-feira', label: 'Sexta-feira' },
  { value: 'Sábado', label: 'Sábado' },
  { value: 'Domingo', label: 'Domingo' },
] as const;

// Gera opções de horas (00-23)
const HORAS = Array.from({ length: 24 }, (_, i) => {
  const hora = i.toString().padStart(2, '0');
  return { value: hora, label: hora };
});

// Gera opções de minutos (00, 15, 30, 45)
const MINUTOS = [
  { value: '00', label: '00' },
  { value: '15', label: '15' },
  { value: '30', label: '30' },
  { value: '45', label: '45' },
];

interface HorarioSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Componente para seleção padronizada de horário de turma.
 * Permite selecionar dia da semana e horário de forma estruturada.
 * Formato de armazenamento: "Segunda-feira, 08:00-10:00"
 */
export function HorarioSelector({
  value = '',
  onChange,
  name,
  label = 'Horário',
  placeholder = 'Selecione dia e horário',
  className = '',
}: HorarioSelectorProps) {
  // Função para parsear o valor
  const parseValue = (val: string) => {
    if (!val) return { dia: '', horaInicio: '', minutoInicio: '', horaFim: '', minutoFim: '' };
    
    // Tenta parsear formato padronizado: "Segunda-feira, 08:00-10:00"
    const match = val.match(/^([^,]+),\s*(.+)$/);
    if (match) {
      const diaValue = match[1].trim();
      const horarioValue = match[2].trim();
      const horarioMatch = horarioValue.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
      if (horarioMatch) {
        return {
          dia: diaValue,
          horaInicio: horarioMatch[1],
          minutoInicio: horarioMatch[2],
          horaFim: horarioMatch[3],
          minutoFim: horarioMatch[4],
        };
      }
      return { dia: diaValue, horaInicio: '', minutoInicio: '', horaFim: '', minutoFim: '' };
    }
    
    // Tenta parsear formatos antigos: "Seg 08:00-10:00" ou "08:00-10:00"
    const diaMatch = val.match(/^(Seg|Ter|Qua|Qui|Sex|Sáb|Dom)/i);
    let diaValue = '';
    let horarioStr = val;
    
    if (diaMatch) {
      const diaMap: Record<string, string> = {
        'Seg': 'Segunda-feira',
        'Ter': 'Terça-feira',
        'Qua': 'Quarta-feira',
        'Qui': 'Quinta-feira',
        'Sex': 'Sexta-feira',
        'Sáb': 'Sábado',
        'Dom': 'Domingo',
      };
      diaValue = diaMap[diaMatch[1]] || '';
      horarioStr = val.replace(/^(Seg|Ter|Qua|Qui|Sex|Sáb|Dom)\s*/i, '');
    }
    
    const horarioMatch = horarioStr.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
    if (horarioMatch) {
      return {
        dia: diaValue,
        horaInicio: horarioMatch[1],
        minutoInicio: horarioMatch[2],
        horaFim: horarioMatch[3],
        minutoFim: horarioMatch[4],
      };
    }
    
    return { dia: diaValue, horaInicio: '', minutoInicio: '', horaFim: '', minutoFim: '' };
  };

  // Estado interno para gerenciar os valores dos selects
  const [internalState, setInternalState] = React.useState(() => parseValue(value));

  // Sincroniza o estado interno quando o value externo muda
  React.useEffect(() => {
    setInternalState(parseValue(value));
  }, [value]);

  const { dia, horaInicio, minutoInicio, horaFim, minutoFim } = internalState;

  const buildHorarioString = (hInicio: string, mInicio: string, hFim: string, mFim: string) => {
    if (hInicio && mInicio && hFim && mFim) {
      return `${hInicio}:${mInicio}-${hFim}:${mFim}`;
    }
    return '';
  };

  const handleDiaChange = (novoDia: string) => {
    const novoEstado = { ...internalState, dia: novoDia };
    setInternalState(novoEstado);
    
    const horarioStr = buildHorarioString(novoEstado.horaInicio, novoEstado.minutoInicio, novoEstado.horaFim, novoEstado.minutoFim);
    if (novoDia && horarioStr) {
      onChange(`${novoDia}, ${horarioStr}`);
    } else if (novoDia) {
      onChange(novoDia);
    } else if (horarioStr) {
      onChange(horarioStr);
    } else {
      onChange('');
    }
  };

  const handleHorarioChange = (
    tipo: 'horaInicio' | 'minutoInicio' | 'horaFim' | 'minutoFim',
    novoValor: string
  ) => {
    const novoEstado = {
      ...internalState,
      [tipo]: novoValor,
    };
    setInternalState(novoEstado);

    const horarioStr = buildHorarioString(novoEstado.horaInicio, novoEstado.minutoInicio, novoEstado.horaFim, novoEstado.minutoFim);
    
    if (novoEstado.dia && horarioStr) {
      onChange(`${novoEstado.dia}, ${horarioStr}`);
    } else if (horarioStr) {
      onChange(horarioStr);
    } else if (novoEstado.dia) {
      onChange(novoEstado.dia);
    } else {
      onChange('');
    }
  };

  const selectBaseClasses = cn(
    "flex h-9 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm",
    "ring-offset-background",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "cursor-pointer appearance-none",
    "relative z-10"
  );

  return (
    <div className={cn("space-y-3", className)}>
      <Label htmlFor={name} className="text-sm font-medium">{label}</Label>
      
      {/* Seleção de dia */}
      <div className="relative">
        <select
          name={name ? `${name}_dia` : undefined}
          id={name ? `${name}_dia` : undefined}
          value={dia}
          onChange={(e) => handleDiaChange(e.target.value)}
          className={cn(selectBaseClasses, "w-full")}
        >
          <option value="">Selecione o dia</option>
          {DIAS_SEMANA.map((diaOption) => (
            <option key={diaOption.value} value={diaOption.value}>
              {diaOption.label}
            </option>
          ))}
        </select>
      </div>

      {/* Seleção de horários - layout compacto */}
      <div className="space-y-2.5">
        {/* Horário de início */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Horário de início</Label>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <select
                name={name ? `${name}_hora_inicio` : undefined}
                id={name ? `${name}_hora_inicio` : undefined}
                value={horaInicio}
                onChange={(e) => handleHorarioChange('horaInicio', e.target.value)}
                className={cn(selectBaseClasses, "w-20 flex-shrink-0")}
              >
                <option value="">--</option>
                {HORAS.map((hora) => (
                  <option key={hora.value} value={hora.value}>
                    {hora.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-muted-foreground text-sm font-medium">:</span>
            <div className="relative">
              <select
                name={name ? `${name}_minuto_inicio` : undefined}
                id={name ? `${name}_minuto_inicio` : undefined}
                value={minutoInicio}
                onChange={(e) => handleHorarioChange('minutoInicio', e.target.value)}
                className={cn(selectBaseClasses, "w-20 flex-shrink-0")}
              >
                <option value="">--</option>
                {MINUTOS.map((minuto) => (
                  <option key={minuto.value} value={minuto.value}>
                    {minuto.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Horário de término */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Horário de término</Label>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <select
                name={name ? `${name}_hora_fim` : undefined}
                id={name ? `${name}_hora_fim` : undefined}
                value={horaFim}
                onChange={(e) => handleHorarioChange('horaFim', e.target.value)}
                className={cn(selectBaseClasses, "w-20 flex-shrink-0")}
              >
                <option value="">--</option>
                {HORAS.map((hora) => (
                  <option key={hora.value} value={hora.value}>
                    {hora.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-muted-foreground text-sm font-medium">:</span>
            <div className="relative">
              <select
                name={name ? `${name}_minuto_fim` : undefined}
                id={name ? `${name}_minuto_fim` : undefined}
                value={minutoFim}
                onChange={(e) => handleHorarioChange('minutoFim', e.target.value)}
                className={cn(selectBaseClasses, "w-20 flex-shrink-0")}
              >
                <option value="">--</option>
                {MINUTOS.map((minuto) => (
                  <option key={minuto.value} value={minuto.value}>
                    {minuto.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Preview do horário selecionado */}
      {value && (
        <div className="text-xs text-muted-foreground mt-2 px-2.5 py-1.5 bg-muted/50 rounded-md border border-border">
          <span className="font-medium">Horário:</span> {value}
        </div>
      )}
    </div>
  );
}

