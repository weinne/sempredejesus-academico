import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid, Filter } from 'lucide-react';

type CrudToolbarProps = {
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  filtersSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
};

export function CrudToolbar({
  searchPlaceholder = 'Buscar...',
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filtersSlot,
  actionsSlot,
}: CrudToolbarProps) {
  return (
    <div className="bg-white border rounded-md p-2.5 sm:p-3 flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
        {search !== undefined && onSearchChange && (
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full sm:w-48 md:w-56 h-9 text-sm flex-shrink-0"
          />
        )}
        {filtersSlot ? (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            {filtersSlot}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        {actionsSlot}
        {/* Ocultar botões de modo de visualização em telas menores (< 1024px) 
            pois o modo cards é usado automaticamente para evitar overflow */}
        <div className="hidden xl:flex items-center gap-1">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('table')}
            title="Tabela"
            className="h-9"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('card')}
            title="Cartões"
            className="h-9"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CrudToolbar;


