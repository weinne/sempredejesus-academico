import { useEffect } from 'react';
import { usePageHeader } from '@/providers/page-header-provider';

interface StatItem {
  value: string | number;
  label: string;
}

interface UsePageHeroOptions {
  badge?: string;
  title: string;
  description: string;
  stats?: StatItem[];
  actionLink?: {
    href: string;
    label: string;
  };
  actions?: React.ReactNode;
  backTo?: string;
  showBackButton?: boolean;
  actionsKey?: string | number;
}

export function usePageHero(options: UsePageHeroOptions) {
  const { setHeaderConfig } = usePageHeader();

  useEffect(() => {
    setHeaderConfig(options);
  }, [setHeaderConfig, options]);

  useEffect(() => {
    return () => setHeaderConfig(null);
  }, [setHeaderConfig]);
}

