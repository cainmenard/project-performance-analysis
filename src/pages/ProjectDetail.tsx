import { useParams, useNavigate } from 'react-router-dom';
import { useProjectData } from '@/hooks/useProjectData';
import { formatCurrencyFull, formatPercent, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { calculatePortfolioSummary } from '@/lib/calculations';

function MetricCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: 'gain' | 'fade' }) {
  return (
    <div className={cn(
      'rounded-lg border p-3',
      highlight === 'gain' ? 'border-gain/20 bg-gain/5' : highlight === 'fade' ? 'border-fade/20 bg-fade/5' : 'border-border bg-muted/30'
    )}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-lg font-bold', highlight === 'gain' ? 'text-gain' : highlight === 'fade' ? 'text-fade' : '')}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function PortfolioComparison({ project, allProjects }: { project: import('@/lib/types').ProjectRecord; allProjects: import('@/lib/types').ProjectRecord[] }) {
  const summary = calculatePortfolioSummary(allProjects);
  const sorted = [...allProjects].sort((a, b) => b.finalGrossProfitMargin - a.finalGrossProfitMargin);
  const rank = sorted.findIndex((p) => p.projectNumber === project.projectNumber) + 1;
  const percentile = Math.round(((allProjects.length - rank) / allProjects.length) * 100);

  // Segment peers
  const peers = allProjects.filter((p) => p.marketSegment === project.marketSegment && p.projectNumber !== project.projectNumber);
  const segmentAvgMargin = peers.length > 0 ? peers.reduce((s, p) => s + p.finalGrossProfitMargin, 0) / peers.length : null;

  const marginVsPortfolio = project.finalGrossProfitMargin - summary.averageProfitMargin;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Portfolio Context</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">How this project compares to the rest of your portfolio</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Margin Rank</p>
          <p className="mt-1 text-xl font-bold text-primary">#{rank}</p>
          <p className="text-xs text-muted-foreground">of {allProjects.length} projects</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Percentile</p>
          <p className={cn('mt-1 text-xl font-bold', percentile >= 50 ? 'text-gain' : 'text-fade')}>{percentile}th</p>
          <p className="text-xs text-muted-foreground">{percentile >= 75 ? 'Top performer' : percentile >= 50 ? 'Above average' : percentile >= 25 ? 'Below average' : 'Needs review'}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">vs Portfolio Avg</p>
          <p className={cn('mt-1 text-xl font-bold', marginVsPortfolio >= 0 ? 'text-gain' : 'text-fade')}>
            {marginVsPortfolio >= 0 ? '+' : ''}{formatPercent(marginVsPortfolio)}
          </p>
          <p className="text-xs text-muted-foreground">Portfolio avg: {formatPercent(summary.averageProfitMargin)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">vs {project.marketSegment} Avg</p>
          {segmentAvgMargin !== null ? (
            <>
              <p className={cn('mt-1 text-xl font-bold', project.finalGrossProfitMargin - segmentAvgMargin >= 0 ? 'text-gain' : 'text-fade')}>
                {project.finalGrossProfitMargin - segmentAvgMargin >= 0 ? '+' : ''}{formatPercent(project.finalGrossProfitMargin - segmentAvgMargin)}
              </p>
              <p className="text-xs text-muted-foreground">Segment avg: {formatPercent(segmentAvgMargin)}</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-xl font-bold text-muted-foreground">N/A</p>
              <p className="text-xs text-muted-foreground">Only project in segment</p>
            </>
          )}
        </div>
      </div>

      {/* Margin position bar */}
      <div className="mt-4">
        <p className="text-xs text-muted-foreground mb-2">Margin distribution (this project highlighted)</p>
        <div className="flex items-end gap-px h-16">
          {sorted.map((p) => (
            <div
              key={p.projectNumber}
              className={cn(
                'flex-1 rounded-t-sm transition-all min-w-[3px]',
                p.projectNumber === project.projectNumber
                  ? 'bg-primary ring-1 ring-primary ring-offset-1 ring-offset-card'
                  : p.finalGrossProfitMargin >= 0 ? 'bg-gain/30' : 'bg-fade/30'
              )}
              style={{
                height: `${Math.max(8, Math.min(100, (Math.abs(p.finalGrossProfitMargin) / 0.4) * 100))}%`,
              }}
              title={`${p.projectName}: ${formatPercent(p.finalGrossProfitMargin)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectNarrative({ project }: { project: import('@/lib/types').ProjectRecord }) {
  const changeOrderDelta = project.revisedContractValue - project.originalContractValue;
  const executionDelta = project.finalProfit - project.revisedEstimatedProfit;
  const isGain = project.overallGainFade === 'Gain';
  const Icon = isGain ? TrendingUp : TrendingDown;

  return (
    <div className={cn(
      'rounded-xl border p-5',
      isGain ? 'border-gain/20 bg-gain/5' : 'border-fade/20 bg-fade/5'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('shrink-0 rounded-lg p-2 mt-0.5', isGain ? 'bg-gain/10' : 'bg-fade/10')}>
          <Icon className={cn('h-4 w-4', isGain ? 'text-gain' : 'text-fade')} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Project {isGain ? 'Gained' : 'Faded'} {formatCurrencyFull(Math.abs(project.gainFadeOrgFinalDollars))} from Original Estimate
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            This project started with an estimated profit of {formatCurrencyFull(project.originalEstimatedProfit)} ({formatPercent(project.originalEstimatedProfitMargin)} margin).
            {changeOrderDelta !== 0 && (
              <> Change orders {changeOrderDelta > 0 ? 'added' : 'reduced'} {formatCurrencyFull(Math.abs(changeOrderDelta))} in contract value, moving revised profit to {formatCurrencyFull(project.revisedEstimatedProfit)}.</>
            )}
            {' '}During execution, {executionDelta >= 0 ? 'the team delivered' : 'cost overruns led to'} {formatCurrencyFull(Math.abs(executionDelta))} {executionDelta >= 0 ? 'in additional profit' : 'in profit erosion'} vs revised estimate.
            Final result: {formatCurrencyFull(project.finalProfit)} profit at {formatPercent(project.finalGrossProfitMargin)} margin.
          </p>
        </div>
      </div>
    </div>
  );
}

function PeerProjects({ project, allProjects }: { project: import('@/lib/types').ProjectRecord; allProjects: import('@/lib/types').ProjectRecord[] }) {
  const peers = allProjects
    .filter((p) => p.marketSegment === project.marketSegment && p.projectNumber !== project.projectNumber)
    .sort((a, b) => b.finalGrossProfitMargin - a.finalGrossProfitMargin)
    .slice(0, 5);

  if (peers.length === 0) return null;
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Peer Projects in {project.marketSegment}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Other projects in the same market segment</p>
      <div className="space-y-1.5">
        {peers.map((p) => (
          <div
            key={p.projectNumber}
            onClick={() => navigate(`/project/${p.projectNumber}`)}
            className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{p.projectName}</p>
              <p className="text-xs text-muted-foreground">{p.customerName}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <span className="text-sm font-medium">{formatPercent(p.finalGrossProfitMargin)}</span>
              <span className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                p.overallGainFade === 'Gain' ? 'bg-gain/10 text-gain' : 'bg-fade/10 text-fade'
              )}>
                {p.overallGainFade}
              </span>
            </div>
          </div>
        ))}
      </div>
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

  const summary = calculatePortfolioSummary(state.projects);
  const gainFadeHighlight = project.overallGainFade === 'Gain' ? 'gain' as const : 'fade' as const;

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

      {/* Gain/Fade Narrative */}
      <ProjectNarrative project={project} />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Final Contract Value" value={formatCurrencyFull(project.finalContractValue)} />
        <MetricCard label="Final Cost" value={formatCurrencyFull(project.finalCost)} />
        <MetricCard label="Final Profit" value={formatCurrencyFull(project.finalProfit)} highlight={project.finalProfit >= 0 ? 'gain' : 'fade'} />
        <MetricCard
          label="Profit Margin"
          value={formatPercent(project.finalGrossProfitMargin)}
          sub={`Original: ${formatPercent(project.originalEstimatedProfitMargin)}`}
          highlight={project.finalGrossProfitMargin >= summary.averageProfitMargin ? 'gain' : 'fade'}
        />
        <MetricCard label="Gain/Fade ($)" value={formatCurrencyFull(project.gainFadeOrgFinalDollars)} highlight={gainFadeHighlight} />
        <MetricCard label="Labor Hours" value={formatNumber(project.finalLaborHours)} sub={`Est: ${formatNumber(project.originalEstimatedLaborHours)}`} />
        <MetricCard label="Original Value" value={formatCurrencyFull(project.originalContractValue)} />
        <MetricCard label="Change Orders" value={formatCurrencyFull(project.revisedContractValue - project.originalContractValue)} />
      </div>

      {/* Portfolio Comparison */}
      <PortfolioComparison project={project} allProjects={state.projects} />

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
        <p className="mb-4 text-xs text-muted-foreground">Original vs Revised vs Final (portfolio avg margin shown as reference)</p>
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

      {/* Peer Projects */}
      <PeerProjects project={project} allProjects={state.projects} />
    </div>
  );
}
