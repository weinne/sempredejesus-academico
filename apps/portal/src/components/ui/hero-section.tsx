import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatItem {
  value: string | number;
  label: string;
}

interface HeroSectionProps {
  badge?: string;
  title: string;
  description: string;
  stats?: StatItem[];
  actionLink?: {
    href: string;
    label: string;
  };
  actions?: React.ReactNode;
}

export function HeroSection({
  badge,
  title,
  description,
  stats = [],
  actionLink,
  actions
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-900/70 to-slate-900" />
      <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <div className="max-w-2xl space-y-4">
            {badge && (
              <Badge className="bg-white/20 text-white hover:bg-white/30">
                {badge}
              </Badge>
            )}
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              {title}
            </h1>
            <p className="text-base md:text-lg text-slate-200/80">
              {description}
            </p>
          </div>
          
          {(stats.length > 0 || actionLink || actions) && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-md shadow-lg border border-white/10">
              {stats.length > 0 && (
                <>
                  <p className="text-sm uppercase tracking-wide text-slate-200/70">Visão geral</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                    {stats.map((stat, index) => (
                      <div key={index}>
                        <p className="text-2xl font-semibold">{stat.value}</p>
                        <p className="text-xs text-slate-200/70">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {actionLink && (
                <Link
                  to={actionLink.href}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-slate-100 hover:text-white transition"
                >
                  {actionLink.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              
              {actions && (
                <div className="mt-6">
                  {actions}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
