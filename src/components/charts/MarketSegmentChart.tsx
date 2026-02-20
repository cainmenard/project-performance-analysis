import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { calculateSegmentMetrics } from '@/lib/calculations';
import { formatCurrency, formatCurrencyFull, formatPercent } from '@/lib/formatters';

export function SegmentRevenueChart({ projects }: { projects: ProjectRecord[] }) {
  const metrics = calculateSegmentMetrics(projects).slice(0, 12);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Revenue by Market Segment</h3>
      <p className="mb-4 text-xs text-muted-foreground">Where is your revenue concentrated?</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <YAxis type="category" dataKey="segment" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} width={75} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, _name: unknown, entry: { payload?: (typeof metrics)[number] }) => {
                if (!entry.payload) return ['', ''];
                const m = entry.payload;
                return [`${formatCurrencyFull(Number(value ?? 0))} | ${m.projectCount} projects | Avg margin: ${formatPercent(m.averageMargin)}`, 'Revenue'];
              }}
            />
            <Bar dataKey="totalRevenue" fill="var(--color-chart-1)" name="Revenue" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SegmentMarginChart({ projects }: { projects: ProjectRecord[] }) {
  const metrics = calculateSegmentMetrics(projects)
    .map((m) => ({ ...m, averageMarginPct: m.averageMargin * 100 }))
    .sort((a, b) => b.averageMargin - a.averageMargin)
    .slice(0, 12);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Average Margin by Segment</h3>
      <p className="mb-4 text-xs text-muted-foreground">Which segments are most profitable?</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
            <YAxis type="category" dataKey="segment" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} width={75} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(_: unknown, _name: unknown, entry: { payload?: (typeof metrics)[number] }) => {
                if (!entry.payload) return ['', ''];
                const m = entry.payload;
                const gainRate = m.projectCount > 0 ? m.gainCount / m.projectCount : 0;
                return [`${formatPercent(m.averageMargin)} | ${m.projectCount} projects | ${formatPercent(gainRate)} gain rate | Net: ${formatCurrency(m.totalGainFade)}`, 'Avg Margin'];
              }}
            />
            <Bar dataKey="averageMarginPct" fill="var(--color-chart-4)" name="Avg Margin" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SegmentRadarChart({ projects }: { projects: ProjectRecord[] }) {
  const metrics = calculateSegmentMetrics(projects).slice(0, 8);
  const maxRevenue = Math.max(...metrics.map((m) => m.totalRevenue));
  const maxCount = Math.max(...metrics.map((m) => m.projectCount));

  const radarData = metrics.map((m) => ({
    segment: m.segment,
    margin: m.averageMargin * 100,
    revenue: (m.totalRevenue / maxRevenue) * 100,
    projects: (m.projectCount / maxCount) * 100,
    gainRate: (m.gainCount / m.projectCount) * 100,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Segment Performance Radar</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Multi-dimensional view — which segments score highest across margin, volume, and estimating accuracy?
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--color-border)" />
            <PolarAngleAxis dataKey="segment" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }} />
            <Radar name="Margin %" dataKey="margin" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.2} />
            <Radar name="Revenue %" dataKey="revenue" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.2} />
            <Radar name="Gain Rate %" dataKey="gainRate" stroke="var(--color-chart-3)" fill="var(--color-chart-3)" fillOpacity={0.2} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
