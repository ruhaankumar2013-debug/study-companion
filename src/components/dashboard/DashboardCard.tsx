import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type CardVariant = 'lavender' | 'peach' | 'mint' | 'sunshine' | 'coral' | 'sky';

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  variant: CardVariant;
  value?: string | number;
  subtitle?: string;
  hasUpdates?: boolean;
  updateCount?: number;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const variantIconBg: Record<CardVariant, string> = {
  lavender: 'bg-lavender/20',
  peach: 'bg-peach/20',
  mint: 'bg-mint/20',
  sunshine: 'bg-sunshine/20',
  coral: 'bg-coral/20',
  sky: 'bg-sky/20',
};

const variantIconColor: Record<CardVariant, string> = {
  lavender: 'text-lavender',
  peach: 'text-peach',
  mint: 'text-mint',
  sunshine: 'text-sunshine',
  coral: 'text-coral',
  sky: 'text-sky',
};

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon: Icon,
  variant,
  value,
  subtitle,
  hasUpdates = false,
  updateCount,
  children,
  className,
  onClick,
}) => {
  return (
    <Card
      variant={variant}
      className={cn(
        "relative overflow-hidden cursor-pointer group",
        hasUpdates && "ring-2 ring-lavender/50",
        className
      )}
      onClick={onClick}
    >
      {/* Update badge */}
      {hasUpdates && updateCount !== undefined && updateCount > 0 && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-coral text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
          {updateCount}
        </div>
      )}

      {/* Decorative gradient blob */}
      <div className={cn(
        "absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-30 blur-2xl transition-transform duration-500 group-hover:scale-150",
        variant === 'lavender' && 'bg-lavender',
        variant === 'peach' && 'bg-peach',
        variant === 'mint' && 'bg-mint',
        variant === 'sunshine' && 'bg-sunshine',
        variant === 'coral' && 'bg-coral',
        variant === 'sky' && 'bg-sky',
      )} />

      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110",
            variantIconBg[variant]
          )}>
            <Icon className={cn("w-5 h-5", variantIconColor[variant])} />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {value !== undefined && (
          <div className="mb-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {subtitle && (
              <span className="text-sm text-muted-foreground ml-2">{subtitle}</span>
            )}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
