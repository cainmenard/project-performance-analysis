import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { getMarginDistribution } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#2563eb'];

export function ProfitMarginChart({ projects }: { projects: ProjectRecord[] }) {
  const data = getMarginDistribution(projects);
  const totalProjects = projects.length;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Profit Margin Distribution</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        How many of your {totalProjects} projects fall into each margin bracket?
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              labelStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
              formatter={(_: unknown, _name: unknown, entry: { payload?: (typeof data)[number] }) => {
                if (!entry.payload) return ['', ''];
                const d = entry.payload;
                const pct = totalProjects > 0 ? ((d.count / totalProjects) * 100).toFixed(0) : '0';
                return [`${d.count} projects (${pct}%) | Revenue: ${formatCurrency(d.totalRevenue)} | Profit: ${formatCurrency(d.totalProfit)}`, 'Projects'];
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Projects">
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground text-center italic">
        Understanding where your projects cluster helps identify estimating patterns and pricing opportunities
      </p>
    </div>
  );
}
