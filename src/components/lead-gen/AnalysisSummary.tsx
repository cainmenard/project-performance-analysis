import { Lightbulb, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import type { PortfolioSummary } from '@/lib/types';
import type { ProjectRecord } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { calculateSegmentMetrics } from '@/lib/calculations';
import type { ReactNode } from 'react';

interface Insight {
  icon: ReactNode;
  type: 'warning' | 'opportunity' | 'strength';
  headline: string;
  detail: string;
}

function generateInsights(summary: PortfolioSummary, projects: ProjectRecord[]): Insight[] {
  const insights: Insight[] = [];
  const segments = calculateSegmentMetrics(projects);

  // Gain rate insight — framed as dollars
  const fadedProjects = projects.filter((p) => p.overallGainFade === 'Fade');
  if (fadedProjects.length > 0) {
    const fadeDollars = fadedProjects.reduce((s, p) => s + Math.abs(p.gainFadeOrgFinalDollars), 0);
    if (summary.gainRate >= 0.8) {
      insights.push({
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        type: 'strength',
        headline: `${formatPercent(summary.gainRate)} gain rate — strong estimating discipline`,
        detail: `But even with a high gain rate, the ${summary.fadeCount} faded projects represent ${formatCurrency(fadeDollars)} in lost margin. A structured close-out review could recover 40-60% of that.`,
      });
    } else {
      insights.push({
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        type: 'warning',
        headline: `${summary.fadeCount} projects faded — ${formatCurrency(fadeDollars)} in margin erosion`,
        detail: `With a ${formatPercent(summary.gainRate)} gain rate, estimating accuracy needs attention. Each faded project averages ${formatCurrency(fadeDollars / fadedProjects.length)} in losses. This is the #1 lever for profitability.`,
      });
    }
  }

  // Best vs worst segment — framed as strategic decision
  if (segments.length >= 2) {
    const best = segments.reduce((a, b) => (a.averageMargin > b.averageMargin ? a : b));
    const worst = segments.reduce((a, b) => (a.averageMargin < b.averageMargin ? a : b));
    if (best.segment !== worst.segment && (best.averageMargin - worst.averageMargin) > 0.05) {
      insights.push({
        icon: <Target className="h-3.5 w-3.5" />,
        type: 'opportunity',
        headline: `${formatPercent(best.averageMargin - worst.averageMargin)} margin gap between best and worst segments`,
        detail: `${best.segment} (${formatPercent(best.averageMargin)} margin) vs. ${worst.segment} (${formatPercent(worst.averageMargin)} margin). Shifting pursuit effort toward higher-margin segments could add ${formatCurrency(worst.totalRevenue * (best.averageMargin - worst.averageMargin) * 0.2)} in annual profit.`,
      });
    }
  }

  // Revenue concentration risk
  if (segments.length > 0) {
    const topSegment = segments[0];
    const pct = topSegment.totalRevenue / summary.totalRevenue;
    if (pct > 0.4) {
      insights.push({
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        type: 'warning',
        headline: `${formatPercent(pct)} of revenue concentrated in ${topSegment.segment}`,
        detail: `${formatCurrency(topSegment.totalRevenue)} tied to one segment creates concentration risk. A downturn in ${topSegment.segment} would disproportionately impact the portfolio.`,
      });
    }
  }

  // Margin vs industry benchmark
  if (summary.averageProfitMargin < 0.15) {
    const gap = 0.15 - summary.averageProfitMargin;
    insights.push({
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      type: 'warning',
      headline: `Average margin ${formatPercent(summary.averageProfitMargin)} is below the 15% industry benchmark`,
      detail: `Closing this ${formatPercent(gap)} gap would add ${formatCurrency(summary.totalRevenue * gap)} to the bottom line. Review pricing strategy, cost control, and change order capture.`,
    });
  } else if (summary.averageProfitMargin > 0.25) {
    insights.push({
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      type: 'strength',
      headline: `${formatPercent(summary.averageProfitMargin)} avg margin — well above industry benchmarks`,
      detail: `At ${formatCurrency(summary.totalProfit)} in total profit across ${summary.totalProjects} projects, the focus should shift to protecting this margin as you scale.`,
    });
  }

  // Large project risk
  const largeProjects = projects.filter((p) => p.finalContractValue > summary.averageContractValue * 5);
  if (largeProjects.length > 0) {
    const fadedLarge = largeProjects.filter((p) => p.overallGainFade === 'Fade');
    if (fadedLarge.length > 0) {
      const largeFadeDollars = fadedLarge.reduce((s, p) => s + Math.abs(p.gainFadeOrgFinalDollars), 0);
      insights.push({
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        type: 'warning',
        headline: `${fadedLarge.length} of ${largeProjects.length} large projects faded — ${formatCurrency(largeFadeDollars)} at risk`,
        detail: `Large projects (>5x avg value) carry outsized risk. A single large fade can wipe out gains from dozens of smaller projects. These need dedicated oversight and monthly cost reviews.`,
      });
    }
  }

  return insights;
}

const typeColors = {
  warning: { bg: 'bg-fade/5', border: 'border-fade/20', icon: 'text-fade', dot: 'bg-fade' },
  opportunity: { bg: 'bg-primary/5', border: 'border-primary/20', icon: 'text-primary', dot: 'bg-primary' },
  strength: { bg: 'bg-gain/5', border: 'border-gain/20', icon: 'text-gain', dot: 'bg-gain' },
};

export function AnalysisSummary({ summary, projects }: { summary: PortfolioSummary; projects: ProjectRecord[] }) {
  const insights = generateInsights(summary, projects);

  if (insights.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Executive Insights</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        What your data is telling you — and what to do about it.
      </p>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          const colors = typeColors[insight.type];
          return (
            <div key={i} className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}>
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 ${colors.icon}`}>{insight.icon}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{insight.headline}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{insight.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
