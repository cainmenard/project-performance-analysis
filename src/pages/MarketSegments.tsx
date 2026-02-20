import { useProjectData } from '@/hooks/useProjectData';
import { SegmentRevenueChart, SegmentMarginChart, SegmentRadarChart } from '@/components/charts/MarketSegmentChart';
import { calculateSegmentMetrics, calculateSegmentScorecards } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { Target, ArrowRight, ThumbsUp, Filter, AlertTriangle, XCircle } from 'lucide-react';

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

const recIcons: Record<string, typeof ThumbsUp> = {
  'Pursue Aggressively': ThumbsUp,
  'Selective Pursuit': Filter,
  'Improve or Exit': AlertTriangle,
  'Exit': XCircle,
};

const recColors: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  'Pursue Aggressively': { border: 'border-gain/30', bg: 'bg-gain/5', text: 'text-gain', badge: 'bg-gain/10 text-gain' },
  'Selective Pursuit': { border: 'border-chart-1/30', bg: 'bg-chart-1/5', text: 'text-chart-1', badge: 'bg-chart-1/10 text-chart-1' },
  'Improve or Exit': { border: 'border-chart-3/30', bg: 'bg-chart-3/5', text: 'text-chart-3', badge: 'bg-chart-3/10 text-chart-3' },
  'Exit': { border: 'border-fade/30', bg: 'bg-fade/5', text: 'text-fade', badge: 'bg-fade/10 text-fade' },
};

function SegmentGoNoGo({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const scorecards = calculateSegmentScorecards(projects);

  if (scorecards.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Segment Go / No-Go Scorecards</h3>
        <p className="text-xs text-muted-foreground">
          Data-driven pursuit recommendations based on margin, gain rate, volume, and consistency
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scorecards.map((sc) => {
          const colors = recColors[sc.recommendation];
          const Icon = recIcons[sc.recommendation];
          return (
            <div key={sc.segment} className={cn('rounded-xl border p-4', colors.border, colors.bg)}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-foreground">{sc.segment}</h4>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', colors.badge)}>
                  <Icon className="h-3 w-3" />
                  {sc.recommendation}
                </span>
              </div>

              {/* Score bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Overall Score</span>
                  <span className={cn('text-sm font-bold', colors.text)}>{sc.totalScore}/100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all', {
                      'bg-gain': sc.totalScore >= 70,
                      'bg-chart-1': sc.totalScore >= 50 && sc.totalScore < 70,
                      'bg-chart-3': sc.totalScore >= 30 && sc.totalScore < 50,
                      'bg-fade': sc.totalScore < 30,
                    })}
                    style={{ width: `${sc.totalScore}%` }}
                  />
                </div>
              </div>

              {/* Score components */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center rounded-lg bg-card/50 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Margin</p>
                  <p className="text-xs font-semibold">{sc.marginScore}/25</p>
                </div>
                <div className="text-center rounded-lg bg-card/50 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Gain Rate</p>
                  <p className="text-xs font-semibold">{sc.gainRateScore}/25</p>
                </div>
                <div className="text-center rounded-lg bg-card/50 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Volume</p>
                  <p className="text-xs font-semibold">{sc.volumeScore}/25</p>
                </div>
                <div className="text-center rounded-lg bg-card/50 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Consistency</p>
                  <p className="text-xs font-semibold">{sc.consistencyScore}/25</p>
                </div>
              </div>

              {/* Key metrics */}
              <div className="space-y-1 text-xs text-muted-foreground mb-3">
                <div className="flex justify-between">
                  <span>Projects</span>
                  <span className="font-medium text-foreground">{sc.projectCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Margin</span>
                  <span className="font-medium text-foreground">{formatPercent(sc.averageMargin)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gain Rate</span>
                  <span className="font-medium text-foreground">{formatPercent(sc.gainRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Contract</span>
                  <span className="font-medium text-foreground">{formatCurrency(sc.avgContractSize)}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">{sc.reasoning}</p>
            </div>
          );
        })}
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

      <SegmentGoNoGo projects={filteredProjects} />

      <SegmentRadarChart projects={filteredProjects} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SegmentRevenueChart projects={filteredProjects} />
        <SegmentMarginChart projects={filteredProjects} />
      </div>

      <SegmentTable projects={filteredProjects} />
    </div>
  );
}
