import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Info, Home } from 'lucide-react';

type CrudHeaderProps = {
  title: string;
  description?: string;
  backTo?: string;
  actions?: React.ReactNode;
  badge?: string;
  showHome?: boolean;
};

export function CrudHeader({ 
  title, 
  description, 
  backTo, 
  actions, 
  badge,
  showHome = false 
}: CrudHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
                aria-label="Voltar"
                title="Voltar"
                className="h-9 w-9 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {showHome && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/dashboard')}
                  aria-label="Dashboard"
                  title="Dashboard"
                  className="h-9 w-9 hover:bg-slate-100"
                >
                  <Home className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                  {badge && (
                    <Badge variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  )}
                </div>
                {description && (
                  <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                )}
              </div>
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default CrudHeader;


