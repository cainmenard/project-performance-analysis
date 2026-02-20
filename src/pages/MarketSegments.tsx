import { useProjectData } from '@/hooks/useProjectData';
import { SegmentRevenueChart, SegmentMarginChart, SegmentRadarChart } from '@/components/charts/MarketSegmentChart';
import { calculateSegmentMetrics } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';

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

      <SegmentRadarChart projects={filteredProjects} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SegmentRevenueChart projects={filteredProjects} />
        <SegmentMarginChart projects={filteredProjects} />
      </div>

      <SegmentTable projects={filteredProjects} />
    </div>
  );
}
