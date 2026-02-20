import { useProjectData } from '@/hooks/useProjectData';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import {
  Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Area,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { ProjectRecord } from '@/lib/types';

interface YearMetrics {
  year: number;
  projectCount: number;
  totalRevenue: number;
  avgMargin: number;
  totalProfit: number;
  gainCount: number;
  fadeCount: number;
  gainRate: number;
  totalGainFade: number;
  avgContractValue: number;
}

function computeYearlyMetrics(projects: ProjectRecord[]): YearMetrics[] {
  const yearMap = new Map<number, ProjectRecord[]>();
  for (const p of projects) {
    const yr = p.yearCompleted;
    if (!yr) continue;
    if (!yearMap.has(yr)) yearMap.set(yr, []);
    yearMap.get(yr)!.push(p);
  }

  return Array.from(yearMap.entries())
    .map(([year, prjs]) => ({
      year,
      projectCount: prjs.length,
      totalRevenue: prjs.reduce((s, p) => s + p.finalContractValue, 0),
      avgMargin: prjs.reduce((s, p) => s + p.finalGrossProfitMargin, 0) / prjs.length,
      totalProfit: prjs.reduce((s, p) => s + p.finalProfit, 0),
      gainCount: prjs.filter((p) => p.overallGainFade === 'Gain').length,
      fadeCount: prjs.filter((p) => p.overallGainFade === 'Fade').length,
      gainRate: prjs.filter((p) => p.overallGainFade === 'Gain').length / prjs.length,
      totalGainFade: prjs.reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0),
      avgContractValue: prjs.reduce((s, p) => s + p.finalContractValue, 0) / prjs.length,
    }))
    .sort((a, b) => a.year - b.year);
}

function TrendIndicator({ current, previous, format }: { current: number; previous: number; format: 'percent' | 'currency' | 'number' }) {
  if (previous === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
  const change = (current - previous) / Math.abs(previous);
  const isPositive = change > 0.01;
  const isNegative = change < -0.01;
  const formatted = format === 'percent' ? formatPercent(Math.abs(change)) : format === 'currency' ? formatCurrency(Math.abs(current - previous)) : formatNumber(Math.abs(current - previous));

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium',
      isPositive ? 'text-gain' : isNegative ? 'text-fade' : 'text-muted-foreground'
    )}>
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : isNegative ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {formatted}
    </span>
  );
}

function RevenueProfitChart({ data }: { data: YearMetrics[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Revenue & Profit Trend</h3>
      <p className="mb-4 text-xs text-muted-foreground">Annual revenue with profit overlay</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, name?: string) => [formatCurrency(Number(value ?? 0)), name ?? '']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="totalRevenue" fill="var(--color-chart-1)" name="Revenue" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            <Line type="monotone" dataKey="totalProfit" stroke="var(--color-gain)" name="Profit" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-gain)' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MarginTrendChart({ data }: { data: YearMetrics[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Average Margin Trend</h3>
      <p className="mb-4 text-xs text-muted-foreground">Year-over-year profit margin with industry benchmark</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatPercent(v)} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, name?: string) => [formatPercent(Number(value ?? 0)), name ?? '']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={0.15} stroke="var(--color-warning)" strokeDasharray="6 4" label={{ value: '15% benchmark', position: 'right', fontSize: 10, fill: 'var(--color-warning)' }} />
            <Area type="monotone" dataKey="avgMargin" stroke="var(--color-chart-4)" fill="var(--color-chart-4)" fillOpacity={0.15} name="Avg Margin" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-chart-4)' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GainFadeTrendChart({ data }: { data: YearMetrics[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Gain/Fade Trend</h3>
      <p className="mb-4 text-xs text-muted-foreground">Annual gain vs fade count and gain rate</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 40, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatPercent(v)} domain={[0, 1]} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, name?: string) => {
                const v = Number(value ?? 0);
                return name === 'Gain Rate' ? [formatPercent(v), name] : [v, name ?? ''];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="gainCount" fill="var(--color-gain)" name="Gains" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            <Bar yAxisId="left" dataKey="fadeCount" fill="var(--color-fade)" name="Fades" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            <Line yAxisId="right" type="monotone" dataKey="gainRate" stroke="var(--color-chart-4)" name="Gain Rate" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-chart-4)' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GainFadeDollarsTrendChart({ data }: { data: YearMetrics[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Net Gain/Fade Dollars by Year</h3>
      <p className="mb-4 text-xs text-muted-foreground">Annual portfolio gain/fade in dollars</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
            />
            <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeDasharray="3 3" />
            <Bar dataKey="totalGainFade" name="Net Gain/Fade" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <rect
                  key={index}
                  fill={entry.totalGainFade >= 0 ? 'var(--color-gain)' : 'var(--color-fade)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TrendCallout({ data }: { data: YearMetrics[] }) {
  if (data.length < 2) return null;

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const marginDelta = latest.avgMargin - previous.avgMargin;
  const revenueDelta = latest.totalRevenue - previous.totalRevenue;
  const gainRateDelta = latest.gainRate - previous.gainRate;

  const improving = (marginDelta > 0 ? 1 : 0) + (revenueDelta > 0 ? 1 : 0) + (gainRateDelta > 0 ? 1 : 0);
  const isImproving = improving >= 2;

  return (
    <div className={cn(
      'rounded-xl border p-5',
      isImproving ? 'border-gain/20 bg-gain/5' : 'border-fade/20 bg-fade/5'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('shrink-0 rounded-lg p-2 mt-0.5', isImproving ? 'bg-gain/10' : 'bg-fade/10')}>
          {isImproving ? <TrendingUp className="h-4 w-4 text-gain" /> : <TrendingDown className="h-4 w-4 text-fade" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {isImproving ? 'Portfolio Trajectory: Improving' : 'Portfolio Trajectory: Needs Attention'}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Comparing {latest.year} to {previous.year}: margin moved from {formatPercent(previous.avgMargin)} to {formatPercent(latest.avgMargin)} ({marginDelta >= 0 ? '+' : ''}{formatPercent(marginDelta)}),
            revenue went from {formatCurrency(previous.totalRevenue)} to {formatCurrency(latest.totalRevenue)},
            and gain rate shifted from {formatPercent(previous.gainRate)} to {formatPercent(latest.gainRate)}.
            {isImproving
              ? ' The positive momentum suggests your processes are working — double down on what\'s driving improvement.'
              : ' Declining metrics across multiple dimensions signals a systemic issue worth investigating before the next project cycle.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TrendAnalysis() {
  const { filteredProjects } = useProjectData();
  const yearlyData = computeYearlyMetrics(filteredProjects);

  if (yearlyData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Year-over-Year Trends</h2>
          <p className="text-sm text-muted-foreground">No year data available</p>
        </div>
      </div>
    );
  }

  const latest = yearlyData[yearlyData.length - 1];
  const previous = yearlyData.length >= 2 ? yearlyData[yearlyData.length - 2] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Year-over-Year Trends</h2>
        <p className="text-sm text-muted-foreground">
          Performance trends across {yearlyData.length} years ({yearlyData[0].year} - {latest.year})
        </p>
      </div>

      {/* Year-over-year summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Latest Revenue ({latest.year})</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(latest.totalRevenue)}</p>
          {previous && <TrendIndicator current={latest.totalRevenue} previous={previous.totalRevenue} format="percent" />}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Latest Margin ({latest.year})</p>
          <p className="mt-1 text-xl font-bold">{formatPercent(latest.avgMargin)}</p>
          {previous && <TrendIndicator current={latest.avgMargin} previous={previous.avgMargin} format="percent" />}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Latest Gain Rate ({latest.year})</p>
          <p className="mt-1 text-xl font-bold">{formatPercent(latest.gainRate)}</p>
          {previous && <TrendIndicator current={latest.gainRate} previous={previous.gainRate} format="percent" />}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Projects ({latest.year})</p>
          <p className="mt-1 text-xl font-bold">{latest.projectCount}</p>
          {previous && <TrendIndicator current={latest.projectCount} previous={previous.projectCount} format="number" />}
        </div>
      </div>

      <TrendCallout data={yearlyData} />

      <RevenueProfitChart data={yearlyData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MarginTrendChart data={yearlyData} />
        <GainFadeTrendChart data={yearlyData} />
      </div>

      <GainFadeDollarsTrendChart data={yearlyData} />
    </div>
  );
}
