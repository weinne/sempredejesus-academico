import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';

type CrudHeaderProps = {
  title: string;
  description?: string;
  backTo?: string;
  actions?: React.ReactNode;
};

export function CrudHeader({ title, description, backTo, actions }: CrudHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {description ? (
                <Info className="h-4 w-4 text-muted-foreground" title={description} />
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      </div>
    </header>
  );
}

export default CrudHeader;


