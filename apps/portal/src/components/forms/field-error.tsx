import React from 'react';

interface FieldErrorProps {
  message?: string;
  className?: string;
}

/**
 * Componente para exibir mensagens de erro de campo inline
 */
export const FieldError: React.FC<FieldErrorProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <p className={`mt-1 text-sm text-red-600 ${className}`}>
      {message}
    </p>
  );
};

