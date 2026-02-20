import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { calculateCostBreakdown } from '@/lib/calculations';
import { formatCurrency, formatCurrencyFull, formatPercent } from '@/lib/formatters';

export function CostComparisonChart({ projects }: { projects: ProjectRecord[] }) {
  const data = calculateCostBreakdown(projects).map((d) => ({
    ...d,
    variancePctDisplay: d.original > 0 ? ((d.final - d.original) / d.original) : 0,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Cost Comparison: Original Estimated vs Final Actual</h3>
      <p className="mb-4 text-xs text-muted-foreground">Aggregate cost by category — are you spending more than you estimated?</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, name?: string, entry?: { payload?: (typeof data)[number] }) => {
                if (!entry?.payload) return ['', ''];
                const d = entry.payload;
                const variance = d.final - d.original;
                const pctStr = d.original > 0 ? ` (${variance >= 0 ? '+' : ''}${formatPercent(d.variancePctDisplay)})` : '';
                if (name === 'Original Estimated') return [formatCurrencyFull(Number(value ?? 0)), name];
                return [`${formatCurrencyFull(Number(value ?? 0))}  |  Variance: ${variance >= 0 ? '+' : ''}${formatCurrencyFull(variance)}${pctStr}`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="original" fill="var(--color-chart-1)" name="Original Estimated" radius={[4, 4, 0, 0]} />
            <Bar dataKey="final" fill="var(--color-chart-2)" name="Final Actual" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Variance summary row */}
      <div className="mt-3 flex flex-wrap gap-3">
        {data.map((d) => {
          const variance = d.final - d.original;
          const pct = d.original > 0 ? variance / d.original : 0;
          return (
            <div key={d.category} className="text-xs">
              <span className="text-muted-foreground">{d.category}: </span>
              <span className={variance >= 0 ? 'text-fade font-medium' : 'text-gain font-medium'}>
                {variance >= 0 ? '+' : ''}{formatCurrency(variance)} ({variance >= 0 ? '+' : ''}{formatPercent(pct)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CostVarianceChart({ projects }: { projects: ProjectRecord[] }) {
  const data = calculateCostBreakdown(projects).map((d) => ({
    ...d,
    variance: d.final - d.original,
    variancePct: d.original > 0 ? (d.final - d.original) / d.original : 0,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Cost Variance by Category</h3>
      <p className="mb-4 text-xs text-muted-foreground">Overrun (positive) vs Underrun (negative) from original estimate</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, _name: unknown, entry: { payload?: (typeof data)[number] }) => {
                if (!entry.payload) return ['', ''];
                const d = entry.payload;
                const pctStr = d.original > 0 ? ` (${d.variancePct >= 0 ? '+' : ''}${formatPercent(d.variancePct)})` : '';
                return [`${formatCurrencyFull(Number(value ?? 0))}${pctStr}`, d.variance >= 0 ? 'Overrun' : 'Underrun'];
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
