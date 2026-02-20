import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { getMarginDistribution } from '@/lib/calculations';

const COLORS = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981', '#2563eb'];

export function ProfitMarginChart({ projects }: { projects: ProjectRecord[] }) {
  const data = getMarginDistribution(projects);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Profit Margin Distribution</h3>
      <p className="mb-4 text-xs text-muted-foreground">Number of projects per margin range</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              labelStyle={{ color: 'var(--color-foreground)' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Projects">
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
