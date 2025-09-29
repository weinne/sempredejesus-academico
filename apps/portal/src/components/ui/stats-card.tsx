import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  className = '',
  children
}: StatCardProps) {
  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardContent className="p-4 flex flex-col gap-1">
        <span className="text-xs font-medium uppercase text-slate-500">{title}</span>
        <span className="text-lg font-semibold text-slate-900">{value}</span>
        {description && (
          <span className="text-sm text-slate-500">{description}</span>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

interface StatCardWithIconProps extends StatCardProps {
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCardWithIcon({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-slate-400',
  className = '',
  children
}: StatCardWithIconProps) {
  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
          {children}
        </div>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsGrid({ children, className = '' }: StatsGridProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {children}
    </div>
  );
}
