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
}

export function SearchSelect({ value, onChange, options, placeholder = 'Selecionar...', emptyMessage = 'Nenhuma opção encontrada' }: SearchSelectProps) {
  const hasOptions = options.length > 0;

  return (
    <select
      className="mt-1 w-full border rounded-md px-3 py-2 bg-white text-sm"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{hasOptions ? placeholder : emptyMessage}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

