import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
  backTo?: string;
  showBackButton?: boolean;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function HeroSection({
  badge,
  title,
  description,
  stats = [],
  actionLink,
  actions,
  backTo,
  showBackButton = true,
  onMenuClick,
  showMenuButton = false
}: HeroSectionProps) {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-900/70 to-slate-900" />
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
        <div className="space-y-3">
          {/* Top row: menu/back buttons + title + primary actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {/* Menu button (desktop only) */}
              {showMenuButton && onMenuClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMenuClick}
                  className="hidden md:flex shrink-0 h-9 w-9 text-white hover:bg-white/10 hover:text-white mt-0.5"
                  title="Menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              
              {/* Back button (always visible when enabled) */}
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
                  className="shrink-0 h-9 w-9 text-white hover:bg-white/10 hover:text-white mt-0.5"
                  title="Voltar"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}

              {/* Title area */}
              <div className="flex-1 min-w-0">
                {badge && (
                  <Badge className="bg-white/20 text-white hover:bg-white/30 text-xs px-2 py-0.5 mb-2 inline-block">
                    {badge}
                  </Badge>
                )}
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white leading-tight mb-1">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200/70 leading-relaxed pr-4">
                  {description}
                </p>
              </div>
            </div>

            {/* Primary actions - visible only on large screens */}
            {(actionLink || actions) && (
              <div className="hidden lg:flex items-center gap-3 shrink-0">
                {actions}
                {actionLink && (
                  <Link
                    to={actionLink.href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {actionLink.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Bottom row: stats + actions (mobile/tablet) */}
          {(stats.length > 0 || actionLink || actions) && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5">
              {/* Stats */}
              {stats.length > 0 && (
                <div className="flex items-center gap-4 sm:gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-semibold text-white leading-none">
                        {stat.value}
                      </span>
                      <span className="text-xs text-slate-200/60 whitespace-nowrap">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions - visible on mobile/tablet */}
              {(actionLink || actions) && (
                <div className="flex lg:hidden items-center gap-2.5">
                  {actions}
                  {actionLink && (
                    <Link
                      to={actionLink.href}
                      className="inline-flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white transition-colors"
                    >
                      {actionLink.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
