import { useParams, useNavigate } from 'react-router-dom';
import { useProjectData } from '@/hooks/useProjectData';
import { formatCurrencyFull, formatPercent, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { ArrowLeft } from 'lucide-react';
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
          </div>
          <span className={cn(
            'rounded-full px-3 py-1 text-sm font-medium',
            project.overallGainFade === 'Gain' ? 'bg-gain/10 text-gain' : 'bg-fade/10 text-fade'
          )}>
            {project.overallGainFade}
          </span>
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
        <MetricCard label="Labor Hours" value={formatNumber(project.finalLaborHours)} sub={`Est: ${formatNumber(project.originalEstimatedLaborHours)}`} />
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

      {/* Cost Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Cost Breakdown by Category</h3>
        <p className="mb-4 text-xs text-muted-foreground">Original vs Revised vs Final</p>
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
      </div>
    </div>
  );
}
