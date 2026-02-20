import { AlertTriangle, TrendingDown, DollarSign, Target } from 'lucide-react';
import type { PortfolioSummary } from '@/lib/types';
import type { ProjectRecord } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/formatters';

function computeRiskMetrics(summary: PortfolioSummary, projects: ProjectRecord[]) {
  const fadedProjects = projects.filter((p) => p.overallGainFade === 'Fade');
  const totalFadeDollars = fadedProjects.reduce((s, p) => s + Math.abs(p.gainFadeOrgFinalDollars), 0);
  const avgFadePerProject = fadedProjects.length > 0 ? totalFadeDollars / fadedProjects.length : 0;

  // Cost overruns: projects where final cost exceeded original estimated cost
  const overrunProjects = projects.filter((p) => p.finalCost > p.originalEstimatedCost);
  const totalOverrun = overrunProjects.reduce((s, p) => s + (p.finalCost - p.originalEstimatedCost), 0);

  // Low margin projects (below 10%)
  const lowMarginProjects = projects.filter((p) => p.finalGrossProfitMargin < 0.10);
  const lowMarginRevenue = lowMarginProjects.reduce((s, p) => s + p.finalContractValue, 0);

  // What 1% margin improvement would mean
  const onePercentImpact = summary.totalRevenue * 0.01;

  // Estimating accuracy gap
  const totalOriginalEstCost = projects.reduce((s, p) => s + p.originalEstimatedCost, 0);
  const totalFinalCost = projects.reduce((s, p) => s + p.finalCost, 0);
  const estimatingGap = totalFinalCost - totalOriginalEstCost;
  const estimatingGapPct = totalOriginalEstCost > 0 ? estimatingGap / totalOriginalEstCost : 0;

  return {
    fadedProjects: fadedProjects.length,
    totalFadeDollars,
    avgFadePerProject,
    overrunProjects: overrunProjects.length,
    totalOverrun,
    lowMarginProjects: lowMarginProjects.length,
    lowMarginRevenue,
    onePercentImpact,
    estimatingGap,
    estimatingGapPct,
  };
}

export function RiskExposurePanel({ summary, projects }: { summary: PortfolioSummary; projects: ProjectRecord[] }) {
  const risk = computeRiskMetrics(summary, projects);

  const items = [
    {
      icon: TrendingDown,
      label: 'Total Fade Exposure',
      value: formatCurrency(risk.totalFadeDollars),
      detail: `${risk.fadedProjects} projects faded — avg ${formatCurrency(risk.avgFadePerProject)} per faded project`,
      severity: risk.totalFadeDollars > 0 ? 'high' : 'low',
    },
    {
      icon: AlertTriangle,
      label: 'Cost Estimating Gap',
      value: formatCurrency(Math.abs(risk.estimatingGap)),
      detail: risk.estimatingGap > 0
        ? `Final costs exceeded estimates by ${formatPercent(risk.estimatingGapPct)} across ${risk.overrunProjects} projects`
        : `Final costs came in ${formatPercent(Math.abs(risk.estimatingGapPct))} under estimates — strong estimating`,
      severity: risk.estimatingGap > 0 ? 'high' : 'low',
    },
    {
      icon: Target,
      label: 'Low-Margin Revenue at Risk',
      value: formatCurrency(risk.lowMarginRevenue),
      detail: `${risk.lowMarginProjects} projects operating below 10% margin — vulnerable to any cost surprise`,
      severity: risk.lowMarginProjects > 2 ? 'high' : 'low',
    },
    {
      icon: DollarSign,
      label: 'Value of 1% Margin Improvement',
      value: formatCurrency(risk.onePercentImpact),
      detail: 'Additional profit if portfolio margin improves by just one percentage point',
      severity: 'opportunity' as const,
    },
  ];

  return (
    <div className="rounded-xl border border-fade/20 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-4 w-4 text-fade" />
        <h3 className="text-sm font-semibold text-foreground">Money Left on the Table</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        These are the dollars your portfolio is leaving behind — and the opportunity to recapture them.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-4 ${
              item.severity === 'high'
                ? 'border-fade/20 bg-fade/5'
                : item.severity === 'opportunity'
                ? 'border-gain/20 bg-gain/5'
                : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={`h-4 w-4 ${
                item.severity === 'high' ? 'text-fade' : item.severity === 'opportunity' ? 'text-gain' : 'text-muted-foreground'
              }`} />
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            </div>
            <p className={`text-xl font-bold ${
              item.severity === 'high' ? 'text-fade' : item.severity === 'opportunity' ? 'text-gain' : 'text-foreground'
            }`}>{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
