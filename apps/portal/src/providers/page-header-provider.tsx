import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

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
  actionsKey?: string | number;
}

interface PageHeaderContextType {
  headerConfig: PageHeaderConfig | null;
  setHeaderConfig: (config: PageHeaderConfig | null) => void;
  onMenuClick?: () => void;
  setOnMenuClick: (handler: (() => void) | undefined) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ config: PageHeaderConfig | null; signature: string }>({
    config: null,
    signature: 'null',
  });
  const [onMenuClick, setOnMenuClick] = useState<(() => void) | undefined>(undefined);

  const setHeaderConfig = useCallback((config: PageHeaderConfig | null) => {
    setState((prev) => {
      const nextSignature = buildHeaderSignature(config);
      if (prev.signature === nextSignature) {
        return prev;
      }

      return {
        config,
        signature: nextSignature,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      headerConfig: state.config,
      setHeaderConfig,
      onMenuClick,
      setOnMenuClick,
    }),
    [state.config, setHeaderConfig, onMenuClick, setOnMenuClick]
  );

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error('usePageHeader must be used within PageHeaderProvider');
  }
  return context;
}

function buildHeaderSignature(config: PageHeaderConfig | null): string {
  if (!config) {
    return 'null';
  }

  const statsSignature = config.stats?.map((item) => `${item.label}:${item.value}`).join('|') ?? 'no-stats';
  const actionLinkSignature = config.actionLink
    ? `${config.actionLink.href}|${config.actionLink.label}`
    : 'no-action-link';
  const actionsSignature = config.actions
    ? `actions:${config.actionsKey ?? 'default'}`
    : 'no-actions';

  return [
    config.badge ?? 'no-badge',
    config.title,
    config.description,
    statsSignature,
    actionLinkSignature,
    config.backTo ?? 'no-back',
    config.showBackButton ? 'show-back' : 'no-back-btn',
    actionsSignature,
  ].join('__');
}

