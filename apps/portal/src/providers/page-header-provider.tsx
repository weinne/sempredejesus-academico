import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StatItem {
  value: string | number;
  label: string;
}

interface PageHeaderConfig {
  badge?: string;
  title: string;
  description: string;
  stats?: StatItem[];
  actionLink?: {
    href: string;
    label: string;
  };
  actions?: ReactNode;
  backTo?: string;
  showBackButton?: boolean;
}

interface PageHeaderContextType {
  headerConfig: PageHeaderConfig | null;
  setHeaderConfig: (config: PageHeaderConfig | null) => void;
  onMenuClick?: () => void;
  setOnMenuClick: (handler: (() => void) | undefined) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerConfig, setHeaderConfig] = useState<PageHeaderConfig | null>(null);
  const [onMenuClick, setOnMenuClick] = useState<(() => void) | undefined>(undefined);

  return (
    <PageHeaderContext.Provider value={{ headerConfig, setHeaderConfig, onMenuClick, setOnMenuClick }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error('usePageHeader must be used within PageHeaderProvider');
  }
  return context;
}

