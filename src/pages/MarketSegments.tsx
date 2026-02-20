import { useProjectData } from '@/hooks/useProjectData';
import { SegmentRevenueChart, SegmentMarginChart, SegmentRadarChart } from '@/components/charts/MarketSegmentChart';
import { calculateSegmentMetrics, calculateYearMetrics, analyzePortfolioCostDrivers } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';
import { Target, ArrowRight, AlertTriangle } from 'lucide-react';

function YearOverYearChart({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const yearMetrics = calculateYearMetrics(projects);

  if (yearMetrics.length < 2) return null;

  const chartData = yearMetrics.map((y) => ({
    year: String(y.year),
    revenue: y.totalRevenue,
    margin: y.averageMargin * 100,
    gainRate: y.gainRate * 100,
    projects: y.projectCount,
    gainFade: y.totalGainFade,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Year-Over-Year Trends</h3>
      <p className="mb-4 text-xs text-muted-foreground">Revenue volume, average margin, and gain rate by year</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, name?: string) => {
                if (name === 'Revenue') return [formatCurrency(Number(value ?? 0)), name];
                return [`${Number(value ?? 0).toFixed(1)}%`, name ?? ''];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="revenue" fill="var(--color-chart-1)" name="Revenue" radius={[4, 4, 0, 0]} opacity={0.7} />
            <Line yAxisId="right" type="monotone" dataKey="margin" stroke="var(--color-chart-4)" name="Avg Margin %" strokeWidth={2} dot={{ fill: 'var(--color-chart-4)', r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="gainRate" stroke="var(--color-gain)" name="Gain Rate %" strokeWidth={2} dot={{ fill: 'var(--color-gain)', r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Year summary cards */}
      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${yearMetrics.length}, 1fr)` }}>
        {yearMetrics.map((y) => (
          <div key={y.year} className="rounded-lg bg-muted/30 p-2 text-center">
            <p className="text-xs font-semibold">{y.year}</p>
            <p className="text-[10px] text-muted-foreground">{y.projectCount} projects</p>
            <p className="text-[10px] text-muted-foreground">{formatPercent(y.gainRate)} gain rate</p>
            <p className={cn('text-[10px] font-medium', y.totalGainFade >= 0 ? 'text-gain' : 'text-fade')}>
              Net: {y.totalGainFade >= 0 ? '+' : ''}{formatCurrency(y.totalGainFade)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentTable({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const metrics = calculateSegmentMetrics(projects);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-5 pb-0">
        <h3 className="text-sm font-semibold text-foreground">Segment Summary Table</h3>
        <p className="mb-4 text-xs text-muted-foreground">All metrics by market segment — which segments should you pursue?</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Segment</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Projects</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Revenue</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Avg Margin</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Gain</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Fade</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Gain Rate</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Net Gain/Fade</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const gainRate = m.projectCount > 0 ? m.gainCount / m.projectCount : 0;
              return (
                <tr key={m.segment} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{m.segment}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{m.projectCount}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(m.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right">{formatPercent(m.averageMargin)}</td>
                  <td className="px-4 py-3 text-right text-gain">{m.gainCount}</td>
                  <td className="px-4 py-3 text-right text-fade">{m.fadeCount}</td>
                  <td className="px-4 py-3 text-right">{formatPercent(gainRate)}</td>
                  <td className={cn('px-4 py-3 text-right font-medium', m.totalGainFade >= 0 ? 'text-gain' : 'text-fade')}>
                    {m.totalGainFade >= 0 ? '+' : ''}{formatCurrency(m.totalGainFade)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SegmentCostDriverInsights({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const analysis = analyzePortfolioCostDrivers(projects);
  const patterns = analysis.segmentCostPatterns.filter((s) => s.fadeCount >= 2);

  if (patterns.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-4 w-4 text-fade" />
        <h3 className="text-sm font-semibold text-foreground">Segment-Level Cost Driver Patterns</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Which cost categories are driving fades in each segment — reveals segment-specific estimating gaps
      </p>
      <div className="space-y-3">
        {patterns.map((scp) => {
          const segTotal = projects.filter((p) => p.marketSegment === scp.segment).length;
          const fadeRate = segTotal > 0 ? scp.fadeCount / segTotal : 0;
          return (
            <div key={scp.segment} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{scp.segment}</span>
                <span className="text-xs text-fade font-medium">{scp.fadeCount} of {segTotal} faded ({formatPercent(fadeRate)})</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Primary driver: <span className="font-medium text-foreground">{scp.primaryDriverCategory}</span> ({(scp.primaryDriverPct * 100).toFixed(0)}% of fades)
                </span>
                <span>·</span>
                <span>Fade impact: <span className="font-medium text-fade">{formatCurrency(scp.fadeDollars)}</span></span>
              </div>
              {scp.primaryDriverCategory === 'Labor' && scp.avgLaborHoursVariancePct > 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Avg labor hours variance: +{formatPercent(scp.avgLaborHoursVariancePct)} — suggests scope complexity is underestimated for {scp.segment.toLowerCase()} projects
                </p>
              )}
              {scp.primaryDriverCategory === 'Materials' && scp.avgMaterialsVariancePct > 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Avg materials variance: +{formatPercent(scp.avgMaterialsVariancePct)} — may indicate price escalation or incomplete scope definition in takeoffs
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SegmentStrategyCallout({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const segments = calculateSegmentMetrics(projects);
  if (segments.length < 2) return null;

  const best = segments.reduce((a, b) => (a.averageMargin > b.averageMargin ? a : b));
  const worst = segments.reduce((a, b) => (a.averageMargin < b.averageMargin ? a : b));
  const spread = best.averageMargin - worst.averageMargin;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2 mt-0.5">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">The Strategic Question Your Data Answers</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Not all revenue is created equal. Your <span className="font-medium text-foreground">{best.segment}</span> work
            delivers {formatPercent(best.averageMargin)} margins while <span className="font-medium text-foreground">{worst.segment}</span> runs
            at {formatPercent(worst.averageMargin)} — a {formatPercent(spread)} spread. Every dollar of revenue you shift from
            low-margin to high-margin segments drops {formatPercent(spread)} more to the bottom line.
            This is the data that should drive your pursuit strategy, staffing, and go/no-go decisions.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-gain/10 px-2.5 py-1 text-xs font-medium text-gain">
            <ArrowRight className="h-3 w-3" />
            Shifting 20% of {worst.segment} revenue to {best.segment} = {formatCurrency(worst.totalRevenue * 0.2 * spread)} in added profit
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketSegments() {
  const { filteredProjects } = useProjectData();
  const segments = calculateSegmentMetrics(filteredProjects);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Market Segments & Trends</h2>
        <p className="text-sm text-muted-foreground">
          Performance across {segments.length} market segments — use these insights to drive your go-to-market strategy
        </p>
      </div>

      <SegmentStrategyCallout projects={filteredProjects} />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Time Analysis</h3>
        <YearOverYearChart projects={filteredProjects} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Segment Comparison</h3>
        <SegmentRadarChart projects={filteredProjects} />
        <div className="grid gap-6 lg:grid-cols-2">
          <SegmentRevenueChart projects={filteredProjects} />
          <SegmentMarginChart projects={filteredProjects} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cost Driver Patterns by Segment</h3>
        <SegmentCostDriverInsights projects={filteredProjects} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Detailed Breakdown</h3>
        <SegmentTable projects={filteredProjects} />
      </div>
    </div>
  );
}
