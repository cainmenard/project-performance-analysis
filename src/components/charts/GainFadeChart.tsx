import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { calculateSegmentMetrics, calculateDivisionMetrics } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';

export function GainFadePieChart({ projects }: { projects: ProjectRecord[] }) {
  const gainCount = projects.filter((p) => p.overallGainFade === 'Gain').length;
  const fadeCount = projects.filter((p) => p.overallGainFade === 'Fade').length;
  const data = [
    { name: 'Gain', value: gainCount },
    { name: 'Fade', value: fadeCount },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Gain vs Fade</h3>
      <p className="mb-4 text-xs text-muted-foreground">Project outcome distribution</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--color-card)"
            >
              <Cell fill="var(--color-gain)" />
              <Cell fill="var(--color-fade)" />
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
            />
            <Legend
              formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function GainFadeBySegmentChart({ projects }: { projects: ProjectRecord[] }) {
  const metrics = calculateSegmentMetrics(projects)
    .filter((m) => m.totalGainFade !== 0)
    .sort((a, b) => b.totalGainFade - a.totalGainFade);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Gain/Fade by Market Segment</h3>
      <p className="mb-4 text-xs text-muted-foreground">Net gain/fade dollars per segment</p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <YAxis type="category" dataKey="segment" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} width={55} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), 'Net Gain/Fade']}
            />
            <ReferenceLine x={0} stroke="var(--color-muted-foreground)" />
            <Bar dataKey="totalGainFade" radius={[0, 4, 4, 0]} name="Net Gain/Fade">
              {metrics.map((entry, index) => (
                <Cell key={index} fill={entry.totalGainFade >= 0 ? 'var(--color-gain)' : 'var(--color-fade)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function GainFadeByDivisionChart({ projects }: { projects: ProjectRecord[] }) {
  const metrics = calculateDivisionMetrics(projects);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Gain/Fade by Division</h3>
      <p className="mb-4 text-xs text-muted-foreground">Gain vs fade project counts per division</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="division" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }} />
            <Bar dataKey="gainCount" fill="var(--color-gain)" name="Gain" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fadeCount" fill="var(--color-fade)" name="Fade" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
