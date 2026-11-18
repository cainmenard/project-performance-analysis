import type { LaborVarianceSplit, PortfolioLaborSplit } from '@/lib/calculations';
import { formatCurrency, formatCurrencyFull, formatNumber, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';

/** "+$1.2M" for an overrun, "-$300K" for a saving. formatCurrency already carries the minus. */
function signed(value: number): string {
  return `${value > 0 ? '+' : ''}${formatCurrency(value)}`;
}

function EffectTile({ label, value, detail }: { label: string; value: number; detail: string }) {
  // Red for cost over budget, green for cost under: same convention as every other variance here.
  const tone = value > 0 ? 'fade' : value < 0 ? 'gain' : 'neutral';
  return (
    <div className={cn(
      'rounded-lg border p-4',
      tone === 'fade' && 'border-fade/20 bg-fade/5',
      tone === 'gain' && 'border-gain/20 bg-gain/5',
      tone === 'neutral' && 'border-border bg-muted/30',
    )}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-xl font-bold', tone === 'fade' && 'text-fade', tone === 'gain' && 'text-gain')}>
        {signed(value)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

/**
 * Portfolio card: how much of the labor variance is hours (productivity and scope) and how
 * much is rate (wages, overtime, crew mix). Hidden when no project carries labor hours.
 */
export function LaborSplitCard({ split }: { split: PortfolioLaborSplit }) {
  if (split.projectsWithHours === 0) return null;

  const hoursDelta = split.actualHours - split.budgetHours;
  const hoursPct = split.budgetHours > 0 ? hoursDelta / split.budgetHours : 0;
  // Share of the variance explained by hours. Only meaningful when both effects push the
  // same way; if one is an overrun and the other a saving, a "share" would exceed 100%.
  const sameDirection = split.hoursEffect * split.rateEffect >= 0 && split.totalVariance !== 0;
  const hoursShare = sameDirection ? split.hoursEffect / split.totalVariance : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Labor Variance: Hours vs Rate</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Labor finished {signed(split.totalVariance)} against budget.
        {hoursShare !== null && ` ${formatPercent(hoursShare)} of that is hours and the rest is rate.`}
        {' '}Hours point at productivity and missed scope. Rate points at wages, overtime and crew mix.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <EffectTile
          label="Hours effect"
          value={split.hoursEffect}
          detail={`${hoursDelta > 0 ? '+' : ''}${formatNumber(hoursDelta)} hours against budget (${hoursDelta > 0 ? '+' : ''}${formatPercent(hoursPct)}), priced at each job's budgeted rate`}
        />
        <EffectTile
          label="Rate effect"
          value={split.rateEffect}
          detail="Difference between the rate paid and the rate budgeted, on the hours worked"
        />
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
        Hours effect = (actual hours - budget hours) x budget rate. Rate effect = (actual rate - budget rate) x actual hours.
        Computed per project and summed, so a shift in job mix does not show up as a rate change.
        {split.projectsWithHours < split.projectCount &&
          ` ${split.projectCount - split.projectsWithHours} of ${split.projectCount} projects have no labor hours and are left out.`}
      </p>
    </div>
  );
}

/** One-project version: a compact line under a cost table. */
export function LaborSplitLine({ split, budgetLabel, scopeHours }: {
  split: LaborVarianceSplit;
  budgetLabel: string;
  /** Hours added by change orders, shown so the budget ties back to the original estimate. */
  scopeHours?: number;
}) {
  if (!split.available) return null;
  const hoursDelta = split.actualHours - split.budgetHours;
  const hoursPct = hoursDelta / split.budgetHours;
  return (
    <div className="mt-3 rounded-lg bg-muted/30 p-3 text-xs leading-relaxed">
      <p>
        <span className="font-medium">Labor hours:</span>{' '}
        <span className="text-muted-foreground">
          {formatNumber(split.budgetHours)} in the {budgetLabel}
          {scopeHours !== undefined && scopeHours !== 0 && ` (includes ${scopeHours > 0 ? '+' : ''}${formatNumber(scopeHours)} from change orders)`}
          , {formatNumber(split.actualHours)} actual{' '}
        </span>
        <span className={cn('font-medium', hoursDelta > 0 ? 'text-fade' : hoursDelta < 0 ? 'text-gain' : '')}>
          ({hoursDelta > 0 ? '+' : ''}{formatNumber(hoursDelta)} hrs, {hoursDelta > 0 ? '+' : ''}{formatPercent(hoursPct)})
        </span>
      </p>
      <p className="mt-1">
        <span className="font-medium">Labor variance:</span>{' '}
        <span className="text-muted-foreground">
          {split.totalVariance > 0 ? '+' : ''}{formatCurrencyFull(split.totalVariance)} ={' '}
          {split.hoursEffect > 0 ? '+' : ''}{formatCurrencyFull(split.hoursEffect)} hours{' '}
          and {split.rateEffect > 0 ? '+' : ''}{formatCurrencyFull(split.rateEffect)} rate
          {' '}(${split.budgetRate.toFixed(2)}/hr budgeted, ${split.actualRate.toFixed(2)}/hr paid)
        </span>
      </p>
    </div>
  );
}
