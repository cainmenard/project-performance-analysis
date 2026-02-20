import { useProjectData } from '@/hooks/useProjectData';
import { CostComparisonChart, CostVarianceChart } from '@/components/charts/CostBreakdownChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { Eye } from 'lucide-react';

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

function CostStructurePie({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
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
      <p className="mb-4 text-xs text-muted-foreground">Final cost allocation by category</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={(props: PieLabelRenderProps) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
              strokeWidth={2}
              stroke="var(--color-card)"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LaborHoursChart({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const data = [
    {
      category: 'Total',
      original: projects.reduce((s, p) => s + p.originalEstimatedLaborHours, 0),
      final: projects.reduce((s, p) => s + p.finalLaborHours, 0),
    },
  ];

  // Also break down by division
  const divMap = new Map<string, { original: number; final: number }>();
  for (const p of projects) {
    const div = p.division || 'Unknown';
    if (!divMap.has(div)) divMap.set(div, { original: 0, final: 0 });
    const d = divMap.get(div)!;
    d.original += p.originalEstimatedLaborHours;
    d.final += p.finalLaborHours;
  }
  for (const [div, vals] of divMap.entries()) {
    data.push({ category: div, ...vals });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Labor Hours: Estimated vs Actual</h3>
      <p className="mb-4 text-xs text-muted-foreground">Total and by division</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatNumber(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown) => formatNumber(Number(value ?? 0))}
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

function CostExecutiveCallout({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const totalOrigCost = projects.reduce((s, p) => s + p.originalEstimatedCost, 0);
  const totalFinalCost = projects.reduce((s, p) => s + p.finalCost, 0);
  const variance = totalFinalCost - totalOrigCost;
  const variancePct = totalOrigCost > 0 ? variance / totalOrigCost : 0;

  // Find the biggest cost overrun category
  const categories = [
    { name: 'Labor', orig: projects.reduce((s, p) => s + p.originalEstimatedLabor, 0), final: projects.reduce((s, p) => s + p.finalLabor, 0) },
    { name: 'Materials', orig: projects.reduce((s, p) => s + p.originalEstimatedMaterials, 0), final: projects.reduce((s, p) => s + p.finalMaterials, 0) },
    { name: 'Equipment', orig: projects.reduce((s, p) => s + p.originalEstimatedEquipment, 0), final: projects.reduce((s, p) => s + p.finalEquipment, 0) },
    { name: 'Subcontracts', orig: projects.reduce((s, p) => s + p.originalEstimatedSubcontracts, 0), final: projects.reduce((s, p) => s + p.finalSubcontracts, 0) },
  ].map((c) => ({ ...c, variance: c.final - c.orig }));

  const worstCategory = categories.reduce((a, b) => (a.variance > b.variance ? a : b));

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2 mt-0.5">
          <Eye className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">The Cost Visibility Gap</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {variance > 0 ? (
              <>Final costs exceeded estimates by {formatCurrency(variance)} ({formatPercent(variancePct)}). The biggest driver is <span className="font-medium text-foreground">{worstCategory.name}</span> at {formatCurrency(worstCategory.variance)} over estimate. Without real-time cost tracking connected to your ERP, these overruns compound undetected until close-out.</>
            ) : (
              <>Final costs came in {formatCurrency(Math.abs(variance))} under estimates — that's good cost discipline. But are you leaving margin on the table by over-estimating? Tighter estimates win more competitive bids without sacrificing profitability.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CostAnalysis() {
  const { filteredProjects } = useProjectData();

  const totalOrigCost = filteredProjects.reduce((s, p) => s + p.originalEstimatedCost, 0);
  const totalFinalCost = filteredProjects.reduce((s, p) => s + p.finalCost, 0);
  const variance = totalFinalCost - totalOrigCost;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Cost Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Total cost: {formatCurrency(totalFinalCost)} — variance from estimate: {formatCurrency(variance)} ({variance >= 0 ? 'overrun' : 'underrun'})
        </p>
      </div>

      <CostExecutiveCallout projects={filteredProjects} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CostStructurePie projects={filteredProjects} />
        <CostVarianceChart projects={filteredProjects} />
      </div>

      <CostComparisonChart projects={filteredProjects} />
      <LaborHoursChart projects={filteredProjects} />
    </div>
  );
}
