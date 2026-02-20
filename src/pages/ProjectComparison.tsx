import { useState } from 'react';
import { useProjectData } from '@/hooks/useProjectData';
import { formatCurrency, formatCurrencyFull, formatPercent, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GitCompareArrows, X, Plus, Search } from 'lucide-react';
import type { ProjectRecord } from '@/lib/types';

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)'];

function ProjectSelector({ projects, selected, onToggle }: {
  projects: ProjectRecord[];
  selected: Set<string>;
  onToggle: (projectNumber: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = search.length > 0
    ? projects.filter((p) =>
        p.projectName.toLowerCase().includes(search.toLowerCase()) ||
        p.customerName.toLowerCase().includes(search.toLowerCase()) ||
        p.projectNumber.toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects to compare..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {selected.size} project{selected.size !== 1 ? 's' : ''} selected (select 2-4 to compare)
        </p>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {filtered.slice(0, 50).map((p) => {
          const isSelected = selected.has(p.projectNumber);
          return (
            <button
              key={p.projectNumber}
              onClick={() => onToggle(p.projectNumber)}
              className={cn(
                'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm border-b border-border last:border-0 transition-colors',
                isSelected ? 'bg-primary/5' : 'hover:bg-accent/50'
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn('font-medium truncate', isSelected ? 'text-primary' : 'text-foreground')}>{p.projectName}</p>
                <p className="text-xs text-muted-foreground">{p.customerName} &middot; {p.division} &middot; {p.marketSegment}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs text-muted-foreground">{formatPercent(p.finalGrossProfitMargin)}</span>
                {isSelected ? (
                  <X className="h-4 w-4 text-primary" />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonTable({ projects }: { projects: ProjectRecord[] }) {
  const metrics: { label: string; format: (p: ProjectRecord) => string; colorFn?: (p: ProjectRecord) => string }[] = [
    { label: 'Customer', format: (p) => p.customerName },
    { label: 'Division', format: (p) => p.division },
    { label: 'Market Segment', format: (p) => p.marketSegment },
    { label: 'Year Completed', format: (p) => String(p.yearCompleted) },
    { label: 'Original Contract', format: (p) => formatCurrencyFull(p.originalContractValue) },
    { label: 'Revised Contract', format: (p) => formatCurrencyFull(p.revisedContractValue) },
    { label: 'Final Contract', format: (p) => formatCurrencyFull(p.finalContractValue) },
    { label: 'Change Order Impact', format: (p) => formatCurrencyFull(p.revisedContractValue - p.originalContractValue),
      colorFn: (p) => p.revisedContractValue - p.originalContractValue >= 0 ? 'text-gain' : 'text-fade' },
    { label: 'Original Est. Cost', format: (p) => formatCurrencyFull(p.originalEstimatedCost) },
    { label: 'Final Cost', format: (p) => formatCurrencyFull(p.finalCost) },
    { label: 'Cost Variance', format: (p) => formatCurrencyFull(p.finalCost - p.originalEstimatedCost),
      colorFn: (p) => p.finalCost - p.originalEstimatedCost <= 0 ? 'text-gain' : 'text-fade' },
    { label: 'Final Profit', format: (p) => formatCurrencyFull(p.finalProfit),
      colorFn: (p) => p.finalProfit >= 0 ? 'text-gain' : 'text-fade' },
    { label: 'Profit Margin', format: (p) => formatPercent(p.finalGrossProfitMargin),
      colorFn: (p) => p.finalGrossProfitMargin >= 0.15 ? 'text-gain' : p.finalGrossProfitMargin >= 0 ? 'text-chart-3' : 'text-fade' },
    { label: 'Gain/Fade', format: (p) => `${p.overallGainFade} (${formatCurrencyFull(p.gainFadeOrgFinalDollars)})`,
      colorFn: (p) => p.overallGainFade === 'Gain' ? 'text-gain' : 'text-fade' },
    { label: 'Labor Hours (Est)', format: (p) => formatNumber(p.originalEstimatedLaborHours) },
    { label: 'Labor Hours (Actual)', format: (p) => formatNumber(p.finalLaborHours) },
    { label: 'Hours Variance', format: (p) => {
        const v = p.originalEstimatedLaborHours > 0 ? (p.finalLaborHours - p.originalEstimatedLaborHours) / p.originalEstimatedLaborHours : 0;
        return `${v > 0 ? '+' : ''}${formatPercent(v)}`;
      },
      colorFn: (p) => p.finalLaborHours > p.originalEstimatedLaborHours ? 'text-fade' : 'text-gain' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground sticky left-0 bg-muted/50 min-w-[160px]">Metric</th>
              {projects.map((p, i) => (
                <th key={p.projectNumber} className="px-4 py-3 text-right text-xs font-semibold min-w-[180px]" style={{ color: COLORS[i] }}>
                  {p.projectName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.label} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground sticky left-0 bg-card">{m.label}</td>
                {projects.map((p) => (
                  <td key={p.projectNumber} className={cn('px-4 py-2.5 text-right text-xs', m.colorFn?.(p))}>
                    {m.format(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonCharts({ projects }: { projects: ProjectRecord[] }) {
  // Financial comparison bar chart
  const financialData = projects.map((p, i) => ({
    name: p.projectName.length > 20 ? p.projectName.substring(0, 20) + '...' : p.projectName,
    'Contract Value': p.finalContractValue,
    'Final Cost': p.finalCost,
    'Profit': p.finalProfit,
    color: COLORS[i],
  }));

  // Radar chart data (normalized to 0-100)
  const maxContract = Math.max(...projects.map((p) => p.finalContractValue), 1);
  const maxMargin = Math.max(...projects.map((p) => p.finalGrossProfitMargin), 0.01);
  const maxGainFade = Math.max(...projects.map((p) => Math.abs(p.gainFadeOrgFinalDollars)), 1);
  const maxHours = Math.max(...projects.map((p) => p.finalLaborHours), 1);

  const radarData = [
    { metric: 'Contract Size', ...Object.fromEntries(projects.map((p) => [p.projectName, Math.round((p.finalContractValue / maxContract) * 100)])) },
    { metric: 'Margin', ...Object.fromEntries(projects.map((p) => [p.projectName, Math.round((p.finalGrossProfitMargin / maxMargin) * 100)])) },
    { metric: 'Gain/Fade', ...Object.fromEntries(projects.map((p) => [p.projectName, Math.round(((p.gainFadeOrgFinalDollars / maxGainFade + 1) / 2) * 100)])) },
    { metric: 'Labor Hrs', ...Object.fromEntries(projects.map((p) => [p.projectName, Math.round((p.finalLaborHours / maxHours) * 100)])) },
    { metric: 'Change Orders', ...Object.fromEntries(projects.map((p) => {
        const coImpact = p.revisedContractValue - p.originalContractValue;
        const maxCO = Math.max(...projects.map((q) => Math.abs(q.revisedContractValue - q.originalContractValue)), 1);
        return [p.projectName, Math.round(((coImpact / maxCO + 1) / 2) * 100)];
      })) },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Financial Comparison</h3>
        <p className="mb-4 text-xs text-muted-foreground">Contract value, cost, and profit side by side</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Contract Value" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Final Cost" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="var(--color-gain)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Multi-Dimensional Comparison</h3>
        <p className="mb-4 text-xs text-muted-foreground">Normalized comparison across key metrics (0-100 scale)</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
              {projects.map((p, i) => (
                <Radar
                  key={p.projectNumber}
                  name={p.projectName}
                  dataKey={p.projectName}
                  stroke={COLORS[i]}
                  fill={COLORS[i]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function ProjectComparison() {
  const { filteredProjects } = useProjectData();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleProject = (projectNumber: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectNumber)) {
        next.delete(projectNumber);
      } else if (next.size < 4) {
        next.add(projectNumber);
      }
      return next;
    });
  };

  const selectedProjects = filteredProjects.filter((p) => selectedIds.has(p.projectNumber));
  const canCompare = selectedProjects.length >= 2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Project Comparison</h2>
        <p className="text-sm text-muted-foreground">
          Select 2-4 projects to compare side by side
        </p>
      </div>

      {/* Selected tags */}
      {selectedProjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProjects.map((p, i) => (
            <span
              key={p.projectNumber}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: COLORS[i], color: COLORS[i] }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              {p.projectName}
              <button onClick={() => toggleProject(p.projectNumber)} className="ml-1 hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <ProjectSelector projects={filteredProjects} selected={selectedIds} onToggle={toggleProject} />

      {canCompare ? (
        <>
          <div className="flex items-center gap-2 text-sm text-gain">
            <GitCompareArrows className="h-4 w-4" />
            <span>Comparing {selectedProjects.length} projects</span>
          </div>

          <ComparisonCharts projects={selectedProjects} />
          <ComparisonTable projects={selectedProjects} />
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <GitCompareArrows className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Select at least 2 projects above to see a side-by-side comparison
          </p>
        </div>
      )}
    </div>
  );
}
