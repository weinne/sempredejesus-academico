import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormSectionProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  iconBgColor?: string;
  iconColor?: string;
  children: React.ReactNode;
}

/**
 * Componente de seção de formulário padronizado
 * Usado para dividir formulários grandes em seções visuais
 */
export const FormSection: React.FC<FormSectionProps> = ({
  icon: Icon,
  title,
  description,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  children,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
};

