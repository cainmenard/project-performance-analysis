import { AlertTriangle, TrendingDown, DollarSign, Target } from 'lucide-react';
import type { PortfolioSummary } from '@/lib/types';
import type { ProjectRecord } from '@/lib/types';
import { calculatePortfolioCostTotals } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';

function computeRiskMetrics(summary: PortfolioSummary, projects: ProjectRecord[]) {
  const fadedProjects = projects.filter((p) => p.overallGainFade === 'Fade');
  const totalFadeDollars = fadedProjects.reduce((s, p) => s + Math.abs(p.gainFadeOrgFinalDollars), 0);
  const avgFadePerProject = fadedProjects.length > 0 ? totalFadeDollars / fadedProjects.length : 0;

  // Final cost against budget (original estimate plus approved change orders). Measuring
  // against the original estimate instead would count change-order cost as overrun.
  const cost = calculatePortfolioCostTotals(projects);

  // 10% is the line for "low margin" here: thin enough that one bad month of labor erases
  // the profit. Adjust to the contractor's own floor if this becomes configurable.
  const lowMarginProjects = projects.filter((p) => p.finalGrossProfitMargin < 0.10);
  const lowMarginRevenue = lowMarginProjects.reduce((s, p) => s + p.finalContractValue, 0);

  // One point of margin on total revenue, as a dollar figure.
  const onePercentImpact = summary.totalRevenue * 0.01;

  return {
    fadedProjects: fadedProjects.length,
    totalFadeDollars,
    avgFadePerProject,
    cost,
    lowMarginProjects: lowMarginProjects.length,
    lowMarginRevenue,
    onePercentImpact,
  };
}

export function RiskExposurePanel({ summary, projects }: { summary: PortfolioSummary; projects: ProjectRecord[] }) {
  const risk = computeRiskMetrics(summary, projects);
  const { cost } = risk;
  const overBudget = cost.executionVariance > 0;
  // Only mention change orders when there are some, and only call the baseline "budget"
  // when at least one project has a revised estimate behind it.
  const scopeNote = cost.scopeChange !== 0
    ? ` Budget includes ${formatCurrency(cost.scopeChange)} of approved change-order cost, which is not overrun.`
    : '';

  const items = [
    {
      icon: TrendingDown,
      label: 'Total Fade Exposure',
      value: formatCurrency(risk.totalFadeDollars),
      detail: `${risk.fadedProjects} projects faded, averaging ${formatCurrency(risk.avgFadePerProject)} each`,
      severity: risk.totalFadeDollars > 0 ? 'high' : 'low',
    },
    {
      icon: AlertTriangle,
      label: 'Cost Overrun vs Budget',
      value: formatCurrency(Math.abs(cost.executionVariance)),
      detail: overBudget
        ? `Final cost ran ${formatPercent(cost.executionVariancePct)} over budget, with ${cost.overrunProjectCount} of ${projects.length} projects over.${scopeNote}`
        : `Final cost came in ${formatPercent(Math.abs(cost.executionVariancePct))} under budget.${scopeNote}`,
      severity: overBudget ? 'high' : 'low',
    },
    {
      icon: Target,
      label: 'Low-Margin Revenue at Risk',
      value: formatCurrency(risk.lowMarginRevenue),
      detail: `${risk.lowMarginProjects} projects finished below 10% margin`,
      severity: risk.lowMarginProjects > 2 ? 'high' : 'low',
    },
    {
      icon: DollarSign,
      label: 'Value of 1 Point of Margin',
      value: formatCurrency(risk.onePercentImpact),
      detail: 'Added profit if portfolio margin improves by one percentage point',
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
        Where profit went missing against the plan, and what one point of margin is worth.
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
