import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { calculateSegmentMetrics, calculateDivisionMetrics, calculateCustomerMetrics } from '@/lib/calculations';
import { formatCurrency, formatCurrencyFull, formatPercent } from '@/lib/formatters';

function CenterLabel({ viewBox, totalRevenue }: { viewBox?: { cx?: number; cy?: number }; totalRevenue: number }) {
  if (!viewBox?.cx || !viewBox?.cy) return null;
  const { cx, cy } = viewBox;
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--color-muted-foreground)" style={{ fontSize: 10 }}>
        Total Revenue
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--color-foreground)" style={{ fontSize: 16, fontWeight: 700 }}>
        {formatCurrency(totalRevenue)}
      </text>
    </>
  );
}

interface PieDataItem {
  name: string;
  value: number;
  count: number;
  dollars: number;
}

export function GainFadePieChart({ projects }: { projects: ProjectRecord[] }) {
  const gainProjects = projects.filter((p) => p.overallGainFade === 'Gain');
  const fadeProjects = projects.filter((p) => p.overallGainFade === 'Fade');
  const gainDollars = gainProjects.reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0);
  const fadeDollars = fadeProjects.reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0);
  const totalRevenue = projects.reduce((s, p) => s + p.finalContractValue, 0);

  const data: PieDataItem[] = [
    { name: 'Gain', value: Math.max(Math.abs(gainDollars), 1), count: gainProjects.length, dollars: gainDollars },
    { name: 'Fade', value: Math.max(Math.abs(fadeDollars), 1), count: fadeProjects.length, dollars: fadeDollars },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Gain vs Fade</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Dollar impact: <span className="text-gain font-medium">+{formatCurrency(gainDollars)}</span> gained,{' '}
        <span className="text-fade font-medium">{formatCurrency(fadeDollars)}</span> faded
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--color-card)"
            >
              <Cell fill="var(--color-gain)" />
              <Cell fill="var(--color-fade)" />
              <Label
                position="center"
                content={<CenterLabel totalRevenue={totalRevenue} />}
              />
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(_: unknown, name?: string, entry?: { payload?: PieDataItem }) => {
                if (!entry?.payload) return ['', ''];
                const d = entry.payload;
                return [`${formatCurrencyFull(d.dollars)} (${d.count} projects)`, name];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const d = data.find((item) => item.name === value);
                return (
                  <span className="text-xs text-foreground">
                    {value}: {d ? formatCurrency(d.dollars) : ''} ({d?.count} projects)
                  </span>
                );
              }}
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
      <p className="mb-4 text-xs text-muted-foreground">Net gain/fade dollars per segment — where are you winning and losing?</p>
      <div className="h-80">
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
                return [`${formatCurrencyFull(Number(value ?? 0))} | ${m.gainCount}G / ${m.fadeCount}F | Avg margin: ${formatPercent(m.averageMargin)}`, 'Net Gain/Fade'];
              }}
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
  const metrics = calculateDivisionMetrics(projects).map((m) => ({
    ...m,
    gainDollars: projects.filter((p) => p.division === m.division && p.overallGainFade === 'Gain')
      .reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0),
    fadeDollars: projects.filter((p) => p.division === m.division && p.overallGainFade === 'Fade')
      .reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0),
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Gain/Fade by Division</h3>
      <p className="mb-4 text-xs text-muted-foreground">Project counts and dollar impact per division</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="division" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, name?: string, entry?: { payload?: (typeof metrics)[number] }) => {
                if (!entry?.payload) return ['', ''];
                const m = entry.payload;
                if (name === 'Gain') return [`${value} projects (${formatCurrency(m.gainDollars)})`, name];
                return [`${value} projects (${formatCurrency(m.fadeDollars)})`, name];
              }}
            />
            <Bar dataKey="gainCount" fill="var(--color-gain)" name="Gain" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fadeCount" fill="var(--color-fade)" name="Fade" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function GainFadeByCustomerChart({ projects }: { projects: ProjectRecord[] }) {
  const metrics = calculateCustomerMetrics(projects)
    .filter((m) => m.totalGainFade !== 0)
    .sort((a, b) => b.totalGainFade - a.totalGainFade);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Gain/Fade by Customer</h3>
      <p className="mb-4 text-xs text-muted-foreground">Which GCs and developers are you most profitable with?</p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <YAxis type="category" dataKey="customer" tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }} width={95} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, _name: unknown, entry: { payload?: (typeof metrics)[number] }) => {
                if (!entry.payload) return ['', ''];
                const m = entry.payload;
                return [`${formatCurrencyFull(Number(value ?? 0))} | ${m.projectCount} projects | Avg margin: ${formatPercent(m.averageMargin)}`, 'Net Gain/Fade'];
              }}
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
