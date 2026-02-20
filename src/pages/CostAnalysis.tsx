import { useProjectData } from '@/hooks/useProjectData';
import { CostComparisonChart, CostVarianceChart } from '@/components/charts/CostBreakdownChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, Label } from 'recharts';
import { formatCurrency, formatCurrencyFull, formatNumber, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

function CostCenterLabel({ viewBox, totalCost }: { viewBox?: { cx?: number; cy?: number }; totalCost: number }) {
  if (!viewBox?.cx || !viewBox?.cy) return null;
  const { cx, cy } = viewBox;
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--color-muted-foreground)" style={{ fontSize: 10 }}>
        Total Cost
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--color-foreground)" style={{ fontSize: 16, fontWeight: 700 }}>
        {formatCurrency(totalCost)}
      </text>
    </>
  );
}

function CostStructurePie({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const totalCost = projects.reduce((s, p) => s + p.finalCost, 0);
  const data = [
    { name: 'Labor', value: projects.reduce((s, p) => s + p.finalLabor, 0) },
    { name: 'Materials', value: projects.reduce((s, p) => s + p.finalMaterials, 0) },
    { name: 'Equipment', value: projects.reduce((s, p) => s + p.finalEquipment, 0) },
    { name: 'Subcontracts', value: projects.reduce((s, p) => s + p.finalSubcontracts, 0) },
    { name: 'Other', value: projects.reduce((s, p) => s + p.finalOther, 0) },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Cost Structure</h3>
      <p className="mb-4 text-xs text-muted-foreground">Where is your money actually going? Final cost allocation by category</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--color-card)"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
              <Label position="center" content={<CostCenterLabel totalCost={totalCost} />} />
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, name?: string) => {
                const pct = totalCost > 0 ? (Number(value ?? 0) / totalCost) * 100 : 0;
                return [`${formatCurrencyFull(Number(value ?? 0))} (${pct.toFixed(1)}%)`, name];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const item = data.find((d) => d.name === value);
                const pct = item && totalCost > 0 ? ((item.value / totalCost) * 100).toFixed(0) : '0';
                return <span className="text-xs text-foreground">{value} ({pct}%)</span>;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LaborHoursChart({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const totalOrig = projects.reduce((s, p) => s + p.originalEstimatedLaborHours, 0);
  const totalFinal = projects.reduce((s, p) => s + p.finalLaborHours, 0);
  const totalVariance = totalFinal - totalOrig;
  const totalVariancePct = totalOrig > 0 ? totalVariance / totalOrig : 0;

  const data = [
    {
      category: 'Total',
      original: totalOrig,
      final: totalFinal,
      variance: totalVariance,
      variancePct: totalVariancePct,
    },
  ];

  // Break down by division
  const divMap = new Map<string, { original: number; final: number }>();
  for (const p of projects) {
    const div = p.division || 'Unknown';
    if (!divMap.has(div)) divMap.set(div, { original: 0, final: 0 });
    const d = divMap.get(div)!;
    d.original += p.originalEstimatedLaborHours;
    d.final += p.finalLaborHours;
  }
  for (const [div, vals] of divMap.entries()) {
    const variance = vals.final - vals.original;
    data.push({
      category: div,
      ...vals,
      variance,
      variancePct: vals.original > 0 ? variance / vals.original : 0,
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Labor Hours: Estimated vs Actual</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Are your crews working more hours than estimated? Total variance:{' '}
        <span className={totalVariance >= 0 ? 'text-fade font-medium' : 'text-gain font-medium'}>
          {totalVariance >= 0 ? '+' : ''}{formatNumber(totalVariance)} hours ({totalVariance >= 0 ? '+' : ''}{formatPercent(totalVariancePct)})
        </span>
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatNumber(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, name?: string, entry?: { payload?: (typeof data)[number] }) => {
                if (!entry?.payload) return ['', ''];
                const d = entry.payload;
                if (name === 'Original Estimated') return [formatNumber(Number(value ?? 0)), name];
                return [`${formatNumber(Number(value ?? 0))}  |  Variance: ${d.variance >= 0 ? '+' : ''}${formatNumber(d.variance)} (${d.variance >= 0 ? '+' : ''}${formatPercent(d.variancePct)})`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="original" fill="var(--color-chart-1)" name="Original Estimated" radius={[4, 4, 0, 0]} />
            <Bar dataKey="final" fill="var(--color-chart-2)" name="Final Actual" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Variance summary */}
      <div className="mt-3 flex flex-wrap gap-3">
        {data.map((d) => (
          <div key={d.category} className="text-xs">
            <span className="text-muted-foreground">{d.category}: </span>
            <span className={d.variance >= 0 ? 'text-fade font-medium' : 'text-gain font-medium'}>
              {d.variance >= 0 ? '+' : ''}{formatNumber(d.variance)} hrs ({d.variance >= 0 ? '+' : ''}{formatPercent(d.variancePct)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CostAnalysis() {
  const { filteredProjects } = useProjectData();

  const totalOrigCost = filteredProjects.reduce((s, p) => s + p.originalEstimatedCost, 0);
  const totalFinalCost = filteredProjects.reduce((s, p) => s + p.finalCost, 0);
  const variance = totalFinalCost - totalOrigCost;
  const variancePct = totalOrigCost > 0 ? variance / totalOrigCost : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Cost Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Total cost: {formatCurrency(totalFinalCost)} — variance from estimate:{' '}
          <span className={cn('font-medium', variance >= 0 ? 'text-fade' : 'text-gain')}>
            {variance >= 0 ? '+' : ''}{formatCurrency(variance)} ({variance >= 0 ? '+' : ''}{formatPercent(variancePct)} {variance >= 0 ? 'overrun' : 'underrun'})
          </span>
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cost Breakdown</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <CostStructurePie projects={filteredProjects} />
          <CostVarianceChart projects={filteredProjects} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Estimated vs Actual</h3>
        <CostComparisonChart projects={filteredProjects} />
        <LaborHoursChart projects={filteredProjects} />
      </div>
    </div>
  );
}
