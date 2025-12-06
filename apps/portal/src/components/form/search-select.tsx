import React from 'react';

type Option = {
  label: string;
  value: string;
};

interface SearchSelectProps {
  value?: string;
  placeholder?: string;
  options: Option[];
  onChange: (value: string) => void;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecionar...',
  emptyMessage = 'Nenhuma opção encontrada',
  disabled = false,
  isLoading = false,
}: SearchSelectProps) {
  const hasOptions = options.length > 0;
  const placeholderMessage = isLoading
    ? 'Carregando opções...'
    : hasOptions
      ? placeholder
      : emptyMessage;

  return (
    <select
      className="mt-1 w-full border rounded-md px-3 py-2 bg-white text-sm disabled:bg-slate-100 disabled:text-slate-500"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      <option value="">{placeholderMessage}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

