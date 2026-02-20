import { useProjectData } from '@/hooks/useProjectData';
import { CostComparisonChart, CostVarianceChart } from '@/components/charts/CostBreakdownChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { calculateLaborProductivity } from '@/lib/calculations';
import { Eye, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

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

function LaborProductivitySection({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const productivity = calculateLaborProductivity(projects);

  const hasHours = productivity.some((p) => p.totalHours > 0);
  if (!hasHours) return null;

  const totalHours = productivity.reduce((s, p) => s + p.totalHours, 0);
  const totalRevenue = productivity.reduce((s, p) => s + p.totalRevenue, 0);
  const totalLaborCost = productivity.reduce((s, p) => s + p.totalLaborCost, 0);
  const totalEstHours = productivity.reduce((s, p) => s + p.estimatedHours, 0);
  const portfolioRevPerHour = totalHours > 0 ? totalRevenue / totalHours : 0;
  const portfolioCostPerHour = totalHours > 0 ? totalLaborCost / totalHours : 0;
  const hoursVariancePct = totalEstHours > 0 ? (totalHours - totalEstHours) / totalEstHours : 0;

  const chartData = productivity.filter((p) => p.totalHours > 0).map((p) => ({
    division: p.division,
    revenuePerHour: Math.round(p.revenuePerHour),
    costPerHour: Math.round(p.costPerHour),
  }));

  const hoursVarianceData = productivity.filter((p) => p.estimatedHours > 0).map((p) => ({
    division: p.division,
    variance: p.hoursVariancePct,
  }));

  return (
    <>
      <div className="rounded-xl border border-chart-2/20 bg-chart-2/5 p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-chart-2/10 p-2 mt-0.5">
            <Zap className="h-4 w-4 text-chart-2" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Labor Productivity Intelligence</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Your portfolio generates <span className="font-medium text-foreground">{formatCurrency(portfolioRevPerHour)}/hour</span> in revenue
              at a labor cost of <span className="font-medium text-foreground">{formatCurrency(portfolioCostPerHour)}/hour</span> — yielding {formatCurrency(portfolioRevPerHour - portfolioCostPerHour)} net per hour.
              {hoursVariancePct > 0.05 && (
                <> Labor hours ran {formatPercent(hoursVariancePct)} over estimates across {formatNumber(totalHours)} total hours. Tighter hour tracking and crew planning could significantly reduce this gap.</>
              )}
              {hoursVariancePct <= 0.05 && hoursVariancePct >= -0.05 && (
                <> Labor hour estimates were accurate within {formatPercent(Math.abs(hoursVariancePct))} — solid estimating discipline across {formatNumber(totalHours)} hours.</>
              )}
              {hoursVariancePct < -0.05 && (
                <> Labor came in {formatPercent(Math.abs(hoursVariancePct))} under estimates — indicating either conservative estimating or efficient execution.</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Revenue / Hour</p>
          <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(portfolioRevPerHour)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Labor Cost / Hour</p>
          <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(portfolioCostPerHour)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Labor Hours</p>
          <p className="text-xl font-bold text-foreground mt-1">{formatNumber(totalHours)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Hours Variance</p>
          <p className={cn('text-xl font-bold mt-1', hoursVariancePct > 0 ? 'text-fade' : 'text-gain')}>
            {hoursVariancePct > 0 ? '+' : ''}{formatPercent(hoursVariancePct)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Revenue vs Cost per Labor Hour</h3>
          <p className="mb-4 text-xs text-muted-foreground">By division — the gap is your labor contribution margin</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="division" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                  formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenuePerHour" fill="var(--color-chart-1)" name="Revenue/Hr" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costPerHour" fill="var(--color-chart-3)" name="Labor Cost/Hr" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Labor Hours Estimating Accuracy</h3>
          <p className="mb-4 text-xs text-muted-foreground">Actual vs estimated hours by division (0% = perfect estimate)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursVarianceData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="division" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                  formatter={(value: unknown) => formatPercent(Number(value ?? 0))}
                />
                <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeDasharray="3 3" />
                <Bar dataKey="variance" name="Hours Variance" radius={[4, 4, 0, 0]}>
                  {hoursVarianceData.map((entry, index) => (
                    <Cell key={index} fill={entry.variance > 0 ? 'var(--color-fade)' : 'var(--color-gain)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground text-center">Red = hours overrun, Green = under budget</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 pb-0">
          <h3 className="text-sm font-semibold text-foreground">Division Productivity Breakdown</h3>
          <p className="mb-4 text-xs text-muted-foreground">Detailed labor efficiency metrics by division</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Division</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Projects</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Rev/Hour</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Cost/Hour</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Total Hours</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Est. Hours</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Variance</th>
              </tr>
            </thead>
            <tbody>
              {productivity.filter((p) => p.totalHours > 0).map((p) => (
                <tr key={p.division} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.division}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{p.projectCount}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.revenuePerHour)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.costPerHour)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(p.totalHours)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatNumber(p.estimatedHours)}</td>
                  <td className={cn('px-4 py-3 text-right font-medium', p.hoursVariancePct > 0 ? 'text-fade' : 'text-gain')}>
                    {p.hoursVariancePct > 0 ? '+' : ''}{formatPercent(p.hoursVariancePct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
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

      <div className="border-t border-border pt-6">
        <h2 className="text-xl font-bold tracking-tight mb-1">Labor Productivity</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Revenue generation and cost efficiency per labor hour
        </p>
      </div>
      <LaborProductivitySection projects={filteredProjects} />
    </div>
  );
}
