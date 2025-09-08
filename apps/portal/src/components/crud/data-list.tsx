import React from 'react';

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataListProps<T> = {
  items: T[];
  columns: Column<T>[];
  viewMode: 'table' | 'card';
  cardRender: (row: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
};

export function DataList<T>({ items, columns, viewMode, cardRender, emptyState, isLoading }: DataListProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8">
        {emptyState || <p className="text-gray-500">Nenhum registro encontrado</p>}
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={String(col.key)} className={"px-4 py-2 whitespace-nowrap " + (col.className || '')}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((row, idx) => (
        <div key={idx}>{cardRender(row)}</div>
      ))}
    </div>
  );
}

export default DataList;


