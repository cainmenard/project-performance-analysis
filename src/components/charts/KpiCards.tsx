import { cn } from '@/lib/cn';
import type { PortfolioSummary } from '@/lib/types';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { DollarSign, FolderKanban, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

function AnimatedValue({ value, formatter }: { value: number; formatter: (v: number) => string }) {
  const animated = useCountUp(value);
  return <>{formatter(animated)}</>;
}

function KpiCard({ title, value, rawValue, formatter, subtitle, icon, className }: {
  title: string;
  value: string;
  rawValue?: number;
  formatter?: (v: number) => string;
  subtitle?: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">
        {rawValue !== undefined && formatter ? <AnimatedValue value={rawValue} formatter={formatter} /> : value}
      </p>
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
        rawValue={summary.totalProjects}
        formatter={(v) => formatNumber(Math.round(v))}
        subtitle={`${summary.divisions.length} divisions`}
        icon={<FolderKanban className="h-4 w-4" />}
      />
      <KpiCard
        title="Total Revenue"
        value={formatCurrency(summary.totalRevenue)}
        rawValue={summary.totalRevenue}
        formatter={formatCurrency}
        subtitle={`Avg ${formatCurrency(summary.averageContractValue)}/project`}
        icon={<DollarSign className="h-4 w-4" />}
      />
      <KpiCard
        title="Avg Profit Margin"
        value={formatPercent(summary.averageProfitMargin)}
        rawValue={summary.averageProfitMargin}
        formatter={formatPercent}
        subtitle={`Total profit: ${formatCurrency(summary.totalProfit)}`}
        icon={<Percent className="h-4 w-4" />}
      />
      <KpiCard
        title="Gain Rate"
        value={formatPercent(summary.gainRate)}
        rawValue={summary.gainRate}
        formatter={formatPercent}
        subtitle={`${summary.gainCount} gain / ${summary.fadeCount} fade`}
        icon={<TrendingUp className="h-4 w-4" />}
        className={summary.gainRate >= 0.5 ? 'border-gain/30' : 'border-fade/30'}
      />
      <KpiCard
        title="Net Gain/Fade"
        value={formatCurrency(summary.totalGainFadeDollars)}
        rawValue={summary.totalGainFadeDollars}
        formatter={formatCurrency}
        subtitle={summary.totalGainFadeDollars >= 0 ? 'Portfolio net gain' : 'Portfolio net fade'}
        icon={summary.totalGainFadeDollars >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        className={summary.totalGainFadeDollars >= 0 ? 'border-gain/30' : 'border-fade/30'}
      />
    </div>
  );
}
