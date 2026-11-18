import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { calculateCostBreakdown } from '@/lib/calculations';
import { formatCurrency, formatCurrencyFull, formatPercent } from '@/lib/formatters';

const tooltipStyle = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: 12,
};

/**
 * Three bars per category: the original estimate, the budget (original plus approved change
 * orders) and the final cost. The step from the first bar to the second is scope the owner
 * paid for. The step from the second to the third is the variance the project team owns.
 */
export function CostComparisonChart({ projects }: { projects: ProjectRecord[] }) {
  const data = calculateCostBreakdown(projects);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Cost Comparison: Original Estimate, Budget and Final</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Budget is the original estimate plus approved change orders. Variance is final cost against budget.
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: unknown, name?: string, entry?: { payload?: (typeof data)[number] }) => {
                if (!entry?.payload) return ['', ''];
                const d = entry.payload;
                const amount = formatCurrencyFull(Number(value ?? 0));
                if (name === 'Budget') {
                  return [`${amount}  |  Change orders: ${d.scopeChange >= 0 ? '+' : ''}${formatCurrencyFull(d.scopeChange)}`, name];
                }
                if (name === 'Final Actual') {
                  const pctStr = d.budget > 0 ? ` (${d.variance >= 0 ? '+' : ''}${formatPercent(d.variancePct)})` : '';
                  return [`${amount}  |  vs budget: ${d.variance >= 0 ? '+' : ''}${formatCurrencyFull(d.variance)}${pctStr}`, name];
                }
                return [amount, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} itemSorter={null} />
            <Bar dataKey="original" fill="var(--color-chart-1)" name="Original Estimate" radius={[4, 4, 0, 0]} />
            <Bar dataKey="budget" fill="var(--color-chart-3)" name="Budget" radius={[4, 4, 0, 0]} />
            <Bar dataKey="final" fill="var(--color-chart-2)" name="Final Actual" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Variance against budget, by category */}
      <div className="mt-3 flex flex-wrap gap-3">
        {data.map((d) => (
          <div key={d.category} className="text-xs">
            <span className="text-muted-foreground">{d.category} vs budget: </span>
            <span className={d.variance > 0 ? 'text-fade font-medium' : d.variance < 0 ? 'text-gain font-medium' : 'font-medium'}>
              {d.variance > 0 ? '+' : ''}{formatCurrency(d.variance)} ({d.variance > 0 ? '+' : ''}{formatPercent(d.variancePct)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CostVarianceChart({ projects }: { projects: ProjectRecord[] }) {
  const data = calculateCostBreakdown(projects);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Cost Variance vs Budget, by Category</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Final cost minus budget. Above zero is an overrun. Approved change-order cost is in the budget, so it does not show here.
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: unknown, _name: unknown, entry: { payload?: (typeof data)[number] }) => {
                if (!entry.payload) return ['', ''];
                const d = entry.payload;
                const pctStr = d.budget > 0 ? ` (${d.variancePct >= 0 ? '+' : ''}${formatPercent(d.variancePct)})` : '';
                return [`${formatCurrencyFull(Number(value ?? 0))}${pctStr}`, d.variance >= 0 ? 'Over budget' : 'Under budget'];
              }}
            />
            <Bar dataKey="variance" name="Variance" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.variance >= 0 ? 'var(--color-fade)' : 'var(--color-gain)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
