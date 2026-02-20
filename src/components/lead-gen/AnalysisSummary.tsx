import { Lightbulb } from 'lucide-react';
import type { PortfolioSummary } from '@/lib/types';
import type { ProjectRecord } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { calculateSegmentMetrics } from '@/lib/calculations';

function generateInsights(summary: PortfolioSummary, projects: ProjectRecord[]): string[] {
  const insights: string[] = [];
  const segments = calculateSegmentMetrics(projects);

  // Gain rate insight
  if (summary.gainRate >= 0.8) {
    insights.push(`Strong estimating accuracy: ${formatPercent(summary.gainRate)} of projects finished at or above original estimates.`);
  } else if (summary.gainRate >= 0.6) {
    insights.push(`Good gain rate at ${formatPercent(summary.gainRate)}, but there's room to improve estimating on ${summary.fadeCount} faded projects.`);
  } else {
    insights.push(`Attention needed: ${formatPercent(1 - summary.gainRate)} of projects faded, indicating potential estimating or execution challenges.`);
  }

  // Best segment
  if (segments.length > 0) {
    const best = segments.reduce((a, b) => (a.averageMargin > b.averageMargin ? a : b));
    insights.push(`Highest margin segment is ${best.segment} at ${formatPercent(best.averageMargin)} average margin across ${best.projectCount} projects.`);
  }

  // Revenue concentration
  if (segments.length > 0) {
    const topSegment = segments[0];
    const pct = topSegment.totalRevenue / summary.totalRevenue;
    if (pct > 0.4) {
      insights.push(`Revenue is concentrated: ${topSegment.segment} represents ${formatPercent(pct)} of total portfolio revenue (${formatCurrency(topSegment.totalRevenue)}).`);
    }
  }

  // Margin analysis
  if (summary.averageProfitMargin < 0.15) {
    insights.push(`Average margin of ${formatPercent(summary.averageProfitMargin)} is below industry benchmarks. Consider reviewing pricing strategy.`);
  } else if (summary.averageProfitMargin > 0.25) {
    insights.push(`Strong average margin of ${formatPercent(summary.averageProfitMargin)} — well above typical construction industry benchmarks.`);
  }

  // Large project risk
  const largeProjects = projects.filter((p) => p.finalContractValue > summary.averageContractValue * 5);
  if (largeProjects.length > 0) {
    const fadedLarge = largeProjects.filter((p) => p.overallGainFade === 'Fade');
    if (fadedLarge.length > 0) {
      insights.push(`${fadedLarge.length} of ${largeProjects.length} large projects (>5x avg value) faded — monitor large project execution closely.`);
    }
  }

  return insights;
}

export function AnalysisSummary({ summary, projects }: { summary: PortfolioSummary; projects: ProjectRecord[] }) {
  const insights = generateInsights(summary, projects);

  if (insights.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Key Insights</h3>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
