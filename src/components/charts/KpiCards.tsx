import { cn } from '@/lib/cn';
import type { PortfolioSummary } from '@/lib/types';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { DollarSign, FolderKanban, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import type { ReactNode } from 'react';

function KpiCard({ title, value, subtitle, icon, className }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function KpiCards({ summary }: { summary: PortfolioSummary }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <KpiCard
        title="Total Projects"
        value={formatNumber(summary.totalProjects)}
        subtitle={`${summary.divisions.length} divisions`}
        icon={<FolderKanban className="h-4 w-4" />}
      />
      <KpiCard
        title="Total Revenue"
        value={formatCurrency(summary.totalRevenue)}
        subtitle={`Avg ${formatCurrency(summary.averageContractValue)}/project`}
        icon={<DollarSign className="h-4 w-4" />}
      />
      <KpiCard
        title="Avg Profit Margin"
        value={formatPercent(summary.averageProfitMargin)}
        subtitle={`Total profit: ${formatCurrency(summary.totalProfit)}`}
        icon={<Percent className="h-4 w-4" />}
      />
      <KpiCard
        title="Gain Rate"
        value={formatPercent(summary.gainRate)}
        subtitle={`${summary.gainCount} gain / ${summary.fadeCount} fade`}
        icon={<TrendingUp className="h-4 w-4" />}
        className={summary.gainRate >= 0.5 ? 'border-gain/30' : 'border-fade/30'}
      />
      <KpiCard
        title="Net Gain/Fade"
        value={formatCurrency(summary.totalGainFadeDollars)}
        subtitle={summary.totalGainFadeDollars >= 0 ? 'Portfolio net gain' : 'Portfolio net fade'}
        icon={summary.totalGainFadeDollars >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        className={summary.totalGainFadeDollars >= 0 ? 'border-gain/30' : 'border-fade/30'}
      />
    </div>
  );
}
