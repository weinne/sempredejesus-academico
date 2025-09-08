import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid, Filter } from 'lucide-react';

type CrudToolbarProps = {
  searchPlaceholder?: string;
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  filtersSlot?: React.ReactNode;
};

export function CrudToolbar({
  searchPlaceholder = 'Buscar...',
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filtersSlot,
}: CrudToolbarProps) {
  return (
    <div className="bg-white border rounded-md p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 flex items-center gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-md"
        />
        {filtersSlot ? (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {filtersSlot}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-1 self-end md:self-auto">
        <Button
          variant={viewMode === 'table' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('table')}
          title="Tabela"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'card' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('card')}
          title="Cartões"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default CrudToolbar;


