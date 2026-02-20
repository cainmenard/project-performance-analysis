import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { getTopProjects } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';

export function TopProjectsChart({ projects }: { projects: ProjectRecord[] }) {
  const top = getTopProjects(projects, 10).map((p) => ({
    name: p.projectName.length > 25 ? p.projectName.slice(0, 25) + '...' : p.projectName,
    revenue: p.finalContractValue,
    profit: p.finalProfit,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Top 10 Projects by Revenue</h3>
      <p className="mb-4 text-xs text-muted-foreground">Largest projects in the portfolio</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} width={115} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value ?? 0)), name === 'revenue' ? 'Revenue' : 'Profit']}
            />
            <Bar dataKey="revenue" fill="var(--color-chart-1)" name="Revenue" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
