import { useParams, useNavigate } from 'react-router-dom';
import { useProjectData } from '@/hooks/useProjectData';
import { formatCurrencyFull, formatPercent, formatNumber } from '@/lib/formatters';
import { analyzeProjectCostDrivers, COST_CATEGORIES } from '@/lib/calculations';
import { LaborSplitLine } from '@/components/charts/LaborSplit';
import { cn } from '@/lib/cn';
import { ArrowLeft, User, Calculator, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { state } = useProjectData();
  const navigate = useNavigate();

  const project = state.projects.find((p) => p.projectNumber === id);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Project not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const costDrivers = analyzeProjectCostDrivers(project);
  const isFade = project.overallGainFade === 'Fade';

  const costData = [
    { category: 'Labor', original: project.originalEstimatedLabor, revised: project.revisedEstimatedLabor, final: project.finalLabor },
    { category: 'Materials', original: project.originalEstimatedMaterials, revised: project.revisedEstimatedMaterials, final: project.finalMaterials },
    { category: 'Equipment', original: project.originalEstimatedEquipment, revised: project.revisedEstimatedEquipment, final: project.finalEquipment },
    { category: 'Subcontracts', original: project.originalEstimatedSubcontracts, revised: project.revisedEstimatedSubcontracts, final: project.finalSubcontracts },
    { category: 'Other', original: project.originalEstimatedOther, revised: project.revisedEstimatedOther, final: project.finalOther },
  ];

  const contractData = [
    { stage: 'Original', value: project.originalContractValue, cost: project.originalEstimatedCost, profit: project.originalEstimatedProfit },
    { stage: 'Revised', value: project.revisedContractValue, cost: project.revisedEstimatedCost, profit: project.revisedEstimatedProfit },
    { stage: 'Final', value: project.finalContractValue, cost: project.finalCost, profit: project.finalProfit },
  ];

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{project.projectName}</h2>
            <p className="text-sm text-muted-foreground">
              {project.customerName} &middot; #{project.projectNumber} &middot; {project.division} &middot; {project.marketSegment} &middot; {project.yearCompleted}
            </p>
            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> PM: {project.projectManager}</span>
              <span className="inline-flex items-center gap-1"><Calculator className="h-3 w-3" /> Estimator: {project.estimator}</span>
            </div>
          </div>
          <span className={cn(
            'rounded-full px-3 py-1 text-sm font-medium',
            project.overallGainFade === 'Gain' ? 'bg-gain/10 text-gain' : 'bg-fade/10 text-fade'
          )}>
            {project.overallGainFade}
          </span>
        </div>
      </div>

      {/* Cost Driver Diagnosis */}
      <div className={cn(
        'rounded-xl border p-4 flex items-start gap-3',
        isFade ? 'border-fade/20 bg-fade/5' : 'border-gain/20 bg-gain/5'
      )}>
        {isFade ? (
          <AlertTriangle className="h-5 w-5 text-fade shrink-0 mt-0.5" />
        ) : (
          <TrendingUp className="h-5 w-5 text-gain shrink-0 mt-0.5" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isFade ? 'Why This Project Faded' : 'Why This Project Gained'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{costDrivers.diagnosis}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {costDrivers.drivers
              .filter((d) => Math.abs(d.varianceDollars) > 0)
              .slice(0, 3)
              .map((d) => (
                <span
                  key={d.category}
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                    d.varianceDollars > 0 ? 'bg-fade/10 text-fade' : 'bg-gain/10 text-gain'
                  )}
                >
                  {d.category}: {d.varianceDollars > 0 ? '+' : ''}{formatCurrencyFull(d.varianceDollars)} ({(d.shareOfTotalVariance * 100).toFixed(0)}%)
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Final Contract Value" value={formatCurrencyFull(project.finalContractValue)} />
        <MetricCard label="Final Cost" value={formatCurrencyFull(project.finalCost)} />
        <MetricCard label="Final Profit" value={formatCurrencyFull(project.finalProfit)} />
        <MetricCard
          label="Profit Margin"
          value={formatPercent(project.finalGrossProfitMargin)}
          sub={`Original: ${formatPercent(project.originalEstimatedProfitMargin)}`}
        />
        <MetricCard label="Gain/Fade ($)" value={formatCurrencyFull(project.gainFadeOrgFinalDollars)} />
        <MetricCard label="Labor Hours" value={formatNumber(project.finalLaborHours)} sub={`Budget: ${formatNumber(costDrivers.laborSplit.budgetHours)}`} />
        <MetricCard label="Original Value" value={formatCurrencyFull(project.originalContractValue)} />
        <MetricCard label="Change Orders" value={formatCurrencyFull(project.revisedContractValue - project.originalContractValue)} />
      </div>

      {/* Contract Value Progression */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Contract Value Progression</h3>
        <p className="mb-4 text-xs text-muted-foreground">Original → Revised → Final</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contractData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                formatter={(value: unknown) => formatCurrencyFull(Number(value ?? 0))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" fill="var(--color-chart-1)" name="Contract Value" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" fill="var(--color-chart-3)" name="Cost" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="var(--color-chart-2)" name="Profit" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Breakdown with Driver Highlighting */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Cost Breakdown by Category</h3>
        <p className="mb-4 text-xs text-muted-foreground">Original estimate, revised budget and final cost. Variance below is final against the {costDrivers.budgetLabel}.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                formatter={(value: unknown) => formatCurrencyFull(Number(value ?? 0))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="original" fill="var(--color-chart-1)" name="Original" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revised" fill="var(--color-chart-3)" name="Revised" radius={[4, 4, 0, 0]} />
              <Bar dataKey="final" fill="var(--color-chart-2)" name="Final" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Cost driver detail table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1.5 text-left font-semibold text-muted-foreground">Category</th>
                <th className="py-1.5 text-right font-semibold text-muted-foreground">Original</th>
                <th className="py-1.5 text-right font-semibold text-muted-foreground">Change Orders</th>
                <th className="py-1.5 text-right font-semibold text-muted-foreground">Budget</th>
                <th className="py-1.5 text-right font-semibold text-muted-foreground">Final</th>
                <th className="py-1.5 text-right font-semibold text-muted-foreground">Variance vs Budget</th>
                <th className="py-1.5 text-right font-semibold text-muted-foreground">Share of Variance</th>
              </tr>
            </thead>
            <tbody>
              {COST_CATEGORIES.map((cat) => {
                const d = costDrivers.drivers.find((x) => x.category === cat);
                if (!d) return null;
                // Highlight the driver only when it explains the outcome, in the color of
                // that outcome: an overrun on a fade is red, a saving on a gain is green.
                const isPrimary = costDrivers.primaryExplainsOutcome && d.category === costDrivers.primaryDriver.category;
                return (
                  <tr key={cat} className={cn('border-b border-border last:border-0', isPrimary && (isFade ? 'bg-fade/5 font-medium' : 'bg-gain/5 font-medium'))}>
                    <td className="py-1.5">
                      {cat}
                      {isPrimary && <span className={cn('ml-1 text-[9px]', isFade ? 'text-fade' : 'text-gain')}>PRIMARY</span>}
                    </td>
                    <td className="py-1.5 text-right text-muted-foreground">{formatCurrencyFull(d.originalDollars)}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{d.scopeChangeDollars > 0 ? '+' : ''}{formatCurrencyFull(d.scopeChangeDollars)}</td>
                    <td className="py-1.5 text-right">{formatCurrencyFull(d.budgetDollars)}</td>
                    <td className="py-1.5 text-right">{formatCurrencyFull(d.finalDollars)}</td>
                    <td className={cn('py-1.5 text-right', d.varianceDollars > 0 ? 'text-fade' : d.varianceDollars < 0 ? 'text-gain' : '')}>
                      {d.varianceDollars > 0 ? '+' : ''}{formatCurrencyFull(d.varianceDollars)} ({d.varianceDollars > 0 ? '+' : ''}{formatPercent(d.variancePct)})
                    </td>
                    <td className="py-1.5 text-right text-muted-foreground">{(d.shareOfTotalVariance * 100).toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <LaborSplitLine
          split={costDrivers.laborSplit}
          budgetLabel={costDrivers.budgetLabel}
          scopeHours={costDrivers.drivers.find((x) => x.category === 'Labor')?.scopeHours}
        />
      </div>
    </div>
  );
}
