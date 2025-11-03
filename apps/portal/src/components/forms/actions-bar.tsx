import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ActionsBarProps {
  submitLabel?: string;
  submittingLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  cancelTo?: string;
  className?: string;
}

/**
 * Barra de ações padronizada para formulários
 * Inclui botões Submit e Cancel com estados
 */
export const ActionsBar: React.FC<ActionsBarProps> = ({
  submitLabel = 'Salvar',
  submittingLabel = 'Salvando...',
  cancelLabel = 'Cancelar',
  isSubmitting = false,
  onCancel,
  cancelTo,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (cancelTo) {
      navigate(cancelTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`flex gap-3 pt-6 border-t border-slate-200 ${className}`}>
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="px-8 h-11"
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleCancel}
        className="px-8 h-11"
      >
        {cancelLabel}
      </Button>
    </div>
  );
};

