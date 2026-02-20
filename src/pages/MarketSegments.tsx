import { useProjectData } from '@/hooks/useProjectData';
import { SegmentRevenueChart, SegmentMarginChart, SegmentRadarChart } from '@/components/charts/MarketSegmentChart';
import { calculateSegmentMetrics, calculateYearMetrics } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';

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
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Detailed Breakdown</h3>
        <SegmentTable projects={filteredProjects} />
      </div>
    </div>
  );
}
