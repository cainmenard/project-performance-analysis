import { useProjectData } from '@/hooks/useProjectData';
import { CostComparisonChart, CostVarianceChart } from '@/components/charts/CostBreakdownChart';
import { LaborSplitCard } from '@/components/charts/LaborSplit';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, Label } from 'recharts';
import { formatCurrency, formatCurrencyFull, formatNumber, formatPercent } from '@/lib/formatters';
import { analyzePortfolioCostDrivers, calculatePortfolioCostTotals, portfolioLaborSplit, projectBudget } from '@/lib/calculations';
import type { PortfolioCostTotals } from '@/lib/calculations';
import type { ProjectRecord } from '@/lib/types';
import { cn } from '@/lib/cn';
import { AlertTriangle, TrendingUp } from 'lucide-react';

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

function CostStructurePie({ projects }: { projects: ProjectRecord[] }) {
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

function LaborHoursChart({ projects }: { projects: ProjectRecord[] }) {
  // Hours by division: original estimate, budget (original plus change-order hours) and actual.
  type Row = { category: string; original: number; budget: number; final: number; variance: number; variancePct: number };
  const rowFor = (category: string, prjs: ProjectRecord[]): Row => {
    const original = prjs.reduce((s, p) => s + p.originalEstimatedLaborHours, 0);
    const budget = prjs.reduce((s, p) => s + projectBudget(p).laborHours, 0);
    const final = prjs.reduce((s, p) => s + p.finalLaborHours, 0);
    const variance = final - budget;
    return { category, original, budget, final, variance, variancePct: budget > 0 ? variance / budget : 0 };
  };

  const divisions = [...new Set(projects.map((p) => p.division || 'Unknown'))];
  const data: Row[] = [
    rowFor('Total', projects),
    ...divisions.map((div) => rowFor(div, projects.filter((p) => (p.division || 'Unknown') === div))),
  ];
  const total = data[0];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Labor Hours: Estimate, Budget and Actual</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Actual hours against budget (original estimate plus change-order hours):{' '}
        <span className={total.variance > 0 ? 'text-fade font-medium' : 'text-gain font-medium'}>
          {total.variance > 0 ? '+' : ''}{formatNumber(total.variance)} hours ({total.variance > 0 ? '+' : ''}{formatPercent(total.variancePct)})
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
              formatter={(value: unknown, name?: string, entry?: { payload?: Row }) => {
                if (!entry?.payload) return ['', ''];
                const d = entry.payload;
                if (name !== 'Final Actual') return [formatNumber(Number(value ?? 0)), name];
                return [`${formatNumber(Number(value ?? 0))}  |  vs budget: ${d.variance > 0 ? '+' : ''}${formatNumber(d.variance)} (${d.variance > 0 ? '+' : ''}${formatPercent(d.variancePct)})`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} itemSorter={null} />
            <Bar dataKey="original" fill="var(--color-chart-1)" name="Original Estimate" radius={[4, 4, 0, 0]} />
            <Bar dataKey="budget" fill="var(--color-chart-3)" name="Budget" radius={[4, 4, 0, 0]} />
            <Bar dataKey="final" fill="var(--color-chart-2)" name="Final Actual" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Variance against budget */}
      <div className="mt-3 flex flex-wrap gap-3">
        {data.map((d) => (
          <div key={d.category} className="text-xs">
            <span className="text-muted-foreground">{d.category} vs budget: </span>
            <span className={d.variance > 0 ? 'text-fade font-medium' : 'text-gain font-medium'}>
              {d.variance > 0 ? '+' : ''}{formatNumber(d.variance)} hrs ({d.variance > 0 ? '+' : ''}{formatPercent(d.variancePct)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CostExecutiveCallout({ projects, cost }: { projects: ProjectRecord[]; cost: PortfolioCostTotals }) {
  const analysis = analyzePortfolioCostDrivers(projects);
  const fadedProjects = projects.filter((p) => p.overallGainFade === 'Fade');
  const isOverrun = cost.executionVariance > 0;

  return (
    <div className={cn('rounded-xl border p-5', isOverrun ? 'border-fade/20 bg-fade/5' : 'border-gain/20 bg-gain/5')}>
      <div className="flex items-start gap-3">
        <div className={cn('shrink-0 rounded-lg p-2 mt-0.5', isOverrun ? 'bg-fade/10' : 'bg-gain/10')}>
          {isOverrun ? <AlertTriangle className="h-4 w-4 text-fade" /> : <TrendingUp className="h-4 w-4 text-gain" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {isOverrun ? 'Cost Overrun vs Budget' : 'Cost vs Budget'}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Original estimate {formatCurrency(cost.originalCost)}, plus {formatCurrency(cost.scopeChange)} of approved
            change-order cost, gives a budget of {formatCurrency(cost.budgetCost)}. Final cost was {formatCurrency(cost.finalCost)}:{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(Math.abs(cost.executionVariance))} ({formatPercent(Math.abs(cost.executionVariancePct))}) {isOverrun ? 'over' : 'under'} budget
            </span>.
            {isOverrun && analysis.fadeDriverPatterns.length > 0 && (
              <> Across {fadedProjects.length} faded projects, the most common cost driver is <span className="font-medium text-foreground">{analysis.overallPrimaryFadeDriver}</span>
                {analysis.laborDrivenFadeCount > 0 && ` (labor drove ${analysis.laborDrivenFadeCount}`}
                {analysis.materialsDrivenFadeCount > 0 && `, materials ${analysis.materialsDrivenFadeCount}`}
                {analysis.subsDrivenFadeCount > 0 && `, subcontracts ${analysis.subsDrivenFadeCount}`}
                {analysis.laborDrivenFadeCount > 0 && ')'}.
              </>
            )}
            {analysis.pricingDrivenFadeCount > 0 && (
              <> {analysis.pricingDrivenFadeCount} faded {analysis.pricingDrivenFadeCount === 1 ? 'project was' : 'projects were'} on or under budget, so that fade came from contract pricing, not cost.</>
            )}
            {cost.projectsWithoutRevisedBudget > 0 && (
              <> {cost.projectsWithoutRevisedBudget} of {projects.length} projects have no revised estimate and are measured against the original estimate.</>
            )}
          </p>
          {isOverrun && analysis.fadeDriverPatterns.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {analysis.fadeDriverPatterns.map((p) => (
                <span key={p.category} className="inline-flex rounded-full bg-fade/10 px-2 py-0.5 text-[10px] font-medium text-fade">
                  {p.category}: {p.timesPrimaryDriver} projects, {formatCurrency(p.totalVarianceDollars)} over budget
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CostAnalysis() {
  const { filteredProjects } = useProjectData();
  const cost = calculatePortfolioCostTotals(filteredProjects);
  const laborSplit = portfolioLaborSplit(filteredProjects);
  const over = cost.executionVariance > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Cost Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Total cost: {formatCurrency(cost.finalCost)}. Against budget:{' '}
          <span className={cn('font-medium', over ? 'text-fade' : 'text-gain')}>
            {over ? '+' : ''}{formatCurrency(cost.executionVariance)} ({over ? '+' : ''}{formatPercent(cost.executionVariancePct)} {over ? 'overrun' : 'underrun'})
          </span>
        </p>
      </div>

      <CostExecutiveCallout projects={filteredProjects} cost={cost} />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cost Breakdown</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <CostStructurePie projects={filteredProjects} />
          <CostVarianceChart projects={filteredProjects} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Estimate, Budget and Actual</h3>
        <CostComparisonChart projects={filteredProjects} />
        <LaborHoursChart projects={filteredProjects} />
        <LaborSplitCard split={laborSplit} />
      </div>
    </div>
  );
}
