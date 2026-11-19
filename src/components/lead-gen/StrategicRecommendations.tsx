import { ArrowRight, Zap, RefreshCw, BarChart3, Users, Wrench } from 'lucide-react';
import type { PortfolioSummary, ProjectRecord } from '@/lib/types';
import { calculateSegmentMetrics, analyzePortfolioCostDrivers } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';

function generateRecommendations(summary: PortfolioSummary, projects: ProjectRecord[]) {
  const recs: { icon: typeof Zap; title: string; body: string; impact: string }[] = [];
  const segments = calculateSegmentMetrics(projects);
  const analysis = analyzePortfolioCostDrivers(projects);
  // The dollar totals below cover every year in the file, so the impact line says how many
  // years that is. It used to say "annually" on a multi-year total.
  const yearCount = new Set(projects.map((p) => p.yearCompleted).filter(Boolean)).size;
  const period = yearCount > 1 ? ` over the ${yearCount} years in this data` : '';

  // 1. Cost driver-specific recommendation
  const fadedProjects = projects.filter((p) => p.overallGainFade === 'Fade');
  if (fadedProjects.length > 0 && analysis.fadeDriverPatterns.length > 0) {
    const topDriver = analysis.fadeDriverPatterns[0];
    const fadeDollars = fadedProjects.reduce((s, p) => s + Math.abs(p.gainFadeOrgFinalDollars), 0);

    if (topDriver.category === 'Labor') {
      recs.push({
        icon: Users,
        title: 'Address Labor Cost Overruns Systematically',
        body: `Labor is the primary fade driver in ${topDriver.timesPrimaryDriver} of ${fadedProjects.length} faded projects, totaling ${formatCurrency(topDriver.totalVarianceDollars)} in overruns against the revised budget. Review labor hour assumptions in estimating templates, compare actual crew productivity rates against bid assumptions, and investigate whether scope complexity is being underestimated.`,
        impact: `Closing half the labor gap = ${formatCurrency(topDriver.totalVarianceDollars * 0.5)}${period}`,
      });
    } else if (topDriver.category === 'Materials') {
      recs.push({
        icon: Wrench,
        title: 'Tighten Materials Estimating & Procurement',
        body: `Materials costs drove the fade in ${topDriver.timesPrimaryDriver} projects, averaging +${formatPercent(topDriver.averageVariancePct)} over budget. Lock material pricing earlier in the bid process, improve takeoff accuracy, and track material waste/rework rates to identify root causes.`,
        impact: `Cutting materials overruns in half = ${formatCurrency(topDriver.totalVarianceDollars * 0.5)}${period}`,
      });
    } else {
      recs.push({
        icon: RefreshCw,
        title: `Investigate ${topDriver.category} Cost Patterns`,
        body: `${topDriver.category} is the primary fade driver in ${topDriver.timesPrimaryDriver} projects, representing ${formatCurrency(topDriver.totalVarianceDollars)} in cost overruns. A structured close-out review process focused on ${topDriver.category.toLowerCase()} costs would help calibrate estimating templates.`,
        impact: `Recovering 40% to 60% of the fade = ${formatCurrency(fadeDollars * 0.4)} to ${formatCurrency(fadeDollars * 0.6)}${period}`,
      });
    }
  }

  // 2. Segment focus strategy
  if (segments.length >= 2) {
    const best = segments.reduce((a, b) => (a.weightedMargin > b.weightedMargin ? a : b));
    const worst = segments.reduce((a, b) => (a.weightedMargin < b.weightedMargin ? a : b));
    if (best.segment !== worst.segment) {
      // Add segment-specific cost driver context
      const segPattern = analysis.segmentCostPatterns.find((s) => s.segment === worst.segment);
      const driverContext = segPattern ? ` (${worst.segment} fades are primarily ${segPattern.primaryDriverCategory.toLowerCase()}-driven)` : '';

      recs.push({
        icon: BarChart3,
        title: 'Reallocate Pursuit Resources by Segment Profitability',
        body: `${best.segment} delivers ${formatPercent(best.weightedMargin)} margin vs. ${worst.segment} at ${formatPercent(worst.weightedMargin)}${driverContext}. Shifting pursuit effort toward higher-margin segments and applying segment-specific estimating adjustments could materially improve portfolio returns.`,
        impact: `Margin lift: ${formatPercent((best.weightedMargin - worst.weightedMargin) * 0.2)} on shifted revenue`,
      });
    }
  }

  // 3. PM workload balance
  const pmMap = new Map<string, { count: number; revenue: number }>();
  for (const p of projects) {
    if (!p.projectManager) continue;
    const entry = pmMap.get(p.projectManager) ?? { count: 0, revenue: 0 };
    entry.count++;
    entry.revenue += p.finalContractValue;
    pmMap.set(p.projectManager, entry);
  }
  const pmEntries = Array.from(pmMap.entries());
  const maxPm = pmEntries.reduce((a, b) => a[1].revenue > b[1].revenue ? a : b, pmEntries[0]);
  if (maxPm && summary.totalRevenue > 0) {
    const share = maxPm[1].revenue / summary.totalRevenue;
    if (share > 0.2) {
      recs.push({
        icon: Users,
        title: 'Balance PM Workload & Build Bench Strength',
        body: `${maxPm[0]} manages ${maxPm[1].count} projects (${formatPercent(share)} of revenue). This creates succession risk. Cross-training and knowledge transfer ensure continuity and enable you to scale without bottlenecks.`,
        impact: 'Reduced key-person risk and capacity to take on more work',
      });
    }
  }

  return recs;
}

export function StrategicRecommendations({ summary, projects }: { summary: PortfolioSummary; projects: ProjectRecord[] }) {
  const recs = generateRecommendations(summary, projects);

  if (recs.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Strategic Recommendations</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Based on your cost driver analysis and portfolio data: where to focus first.
      </p>
      <div className="space-y-4">
        {recs.map((rec) => (
          <div key={rec.title} className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-lg bg-primary/10 p-2 mt-0.5">
                <rec.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground">{rec.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{rec.body}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-gain/10 px-2.5 py-1 text-xs font-medium text-gain">
                  <ArrowRight className="h-3 w-3" />
                  {rec.impact}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
