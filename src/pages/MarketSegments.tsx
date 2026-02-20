import { useProjectData } from '@/hooks/useProjectData';
import { SegmentRevenueChart, SegmentMarginChart, SegmentRadarChart } from '@/components/charts/MarketSegmentChart';
import { calculateSegmentMetrics } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { Target, ArrowRight } from 'lucide-react';

function SegmentTable({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const metrics = calculateSegmentMetrics(projects);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-5 pb-0">
        <h3 className="text-sm font-semibold text-foreground">Segment Summary Table</h3>
        <p className="mb-4 text-xs text-muted-foreground">All metrics by market segment</p>
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
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Net Gain/Fade</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.segment} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3 font-medium">{m.segment}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{m.projectCount}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(m.totalRevenue)}</td>
                <td className="px-4 py-3 text-right">{formatPercent(m.averageMargin)}</td>
                <td className="px-4 py-3 text-right text-gain">{m.gainCount}</td>
                <td className="px-4 py-3 text-right text-fade">{m.fadeCount}</td>
                <td className={cn('px-4 py-3 text-right font-medium', m.totalGainFade >= 0 ? 'text-gain' : 'text-fade')}>
                  {formatCurrency(m.totalGainFade)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <h2 className="text-xl font-bold tracking-tight">Market Segments</h2>
        <p className="text-sm text-muted-foreground">
          Performance across {segments.length} market segments
        </p>
      </div>

      <SegmentStrategyCallout projects={filteredProjects} />

      <SegmentRadarChart projects={filteredProjects} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SegmentRevenueChart projects={filteredProjects} />
        <SegmentMarginChart projects={filteredProjects} />
      </div>

      <SegmentTable projects={filteredProjects} />
    </div>
  );
}
