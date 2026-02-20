import { ArrowRight, Zap, RefreshCw, BarChart3, Users, Database } from 'lucide-react';
import type { PortfolioSummary } from '@/lib/types';
import type { ProjectRecord } from '@/lib/types';
import { calculateSegmentMetrics } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';

function generateRecommendations(summary: PortfolioSummary, projects: ProjectRecord[]) {
  const recs: { icon: typeof Zap; title: string; body: string; impact: string }[] = [];
  const segments = calculateSegmentMetrics(projects);

  // 1. Estimating feedback loop
  const fadedProjects = projects.filter((p) => p.overallGainFade === 'Fade');
  if (fadedProjects.length > 0) {
    const fadeDollars = fadedProjects.reduce((s, p) => s + Math.abs(p.gainFadeOrgFinalDollars), 0);
    recs.push({
      icon: RefreshCw,
      title: 'Implement an Estimating Feedback Loop',
      body: `${fadedProjects.length} projects faded, representing ${formatCurrency(fadeDollars)} in lost margin. A structured close-out review process that feeds actual costs back into estimating templates would systematically close this gap.`,
      impact: `Potential recovery: ${formatCurrency(fadeDollars * 0.4)} - ${formatCurrency(fadeDollars * 0.6)} annually`,
    });
  }

  // 2. Segment focus strategy
  if (segments.length >= 2) {
    const best = segments.reduce((a, b) => (a.averageMargin > b.averageMargin ? a : b));
    const worst = segments.reduce((a, b) => (a.averageMargin < b.averageMargin ? a : b));
    if (best.segment !== worst.segment) {
      recs.push({
        icon: BarChart3,
        title: 'Reallocate Pursuit Resources by Segment Profitability',
        body: `${best.segment} delivers ${formatPercent(best.averageMargin)} avg margin vs. ${worst.segment} at ${formatPercent(worst.averageMargin)}. Shifting 20% of pursuit effort from low-margin to high-margin segments could materially improve portfolio returns.`,
        impact: `Margin lift: ${formatPercent((best.averageMargin - worst.averageMargin) * 0.2)} on shifted revenue`,
      });
    }
  }

  // 3. Real-time visibility
  recs.push({
    icon: Database,
    title: 'Connect Your ERP for Real-Time Intelligence',
    body: 'This analysis is powerful but static. Live integration with Viewpoint, Sage, or Procore means you see margin erosion as it happens — not months later at close-out. Automated alerts flag projects deviating from estimate before the damage compounds.',
    impact: 'Early intervention on just 2-3 projects per year pays for the entire system',
  });

  // 4. PM accountability / change management
  if (summary.totalProjects >= 10) {
    recs.push({
      icon: Users,
      title: 'Build PM Scorecards & Accountability Dashboards',
      body: `Across ${summary.totalProjects} projects, individual PM performance varies significantly. PM-level dashboards that track estimating accuracy, cost control, and gain/fade create accountability and identify who needs coaching vs. who needs more work.`,
      impact: 'Top-quartile PMs drive 2-3x the margin of bottom-quartile — making this visible changes behavior',
    });
  }

  return recs;
}

export function StrategicRecommendations({ summary, projects }: { summary: PortfolioSummary; projects: ProjectRecord[] }) {
  const recs = generateRecommendations(summary, projects);

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Strategic Recommendations</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Based on your portfolio data, here's where to focus for maximum impact.
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
