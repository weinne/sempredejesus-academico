import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FilterSectionProps {
  title: string;
  description: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  showWizardButton?: boolean;
  onWizardClick?: () => void;
  wizardTitle?: string;
  statusBadge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export function FilterSection({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters,
  actions,
  showWizardButton = false,
  onWizardClick,
  wizardTitle = "Abrir wizard",
  statusBadge
}: FilterSectionProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
          {statusBadge && (
            <div className="mt-2">
              <Badge variant={statusBadge.variant || 'default'} className="text-xs">
                {statusBadge.text}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto">
          {searchValue !== undefined && onSearchChange && (
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 items-center">
            {filters}
            {showWizardButton && onWizardClick && (
              <Button 
                variant="outline" 
                onClick={onWizardClick} 
                title={wizardTitle}
                size="sm"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {wizardTitle}
              </Button>
            )}
            {actions}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
