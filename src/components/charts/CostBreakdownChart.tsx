import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { calculateCostBreakdown } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';

export function CostComparisonChart({ projects }: { projects: ProjectRecord[] }) {
  const data = calculateCostBreakdown(projects);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Cost Comparison: Original vs Final</h3>
      <p className="mb-4 text-xs text-muted-foreground">Aggregate cost by category across all projects</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="original" fill="var(--color-chart-1)" name="Original Estimate" radius={[4, 4, 0, 0]} />
            <Bar dataKey="final" fill="var(--color-chart-2)" name="Final Actual" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CostVarianceChart({ projects }: { projects: ProjectRecord[] }) {
  const data = calculateCostBreakdown(projects).map((d) => ({
    ...d,
    variance: d.final - d.original,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Cost Variance by Category</h3>
      <p className="mb-4 text-xs text-muted-foreground">Overrun (positive) / Underrun (negative)</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
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
