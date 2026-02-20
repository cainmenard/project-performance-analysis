import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectData } from '@/hooks/useProjectData';
import { ProjectScatterPlot } from '@/components/charts/ProjectScatterPlot';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { calculatePortfolioSummary } from '@/lib/calculations';
import { ArrowUpDown } from 'lucide-react';

type SortField = 'projectName' | 'finalContractValue' | 'finalGrossProfitMargin' | 'overallGainFade' | 'marketSegment';

export function ProjectPortfolio() {
  const { filteredProjects, state, setFilters } = useProjectData();
  const summary = calculatePortfolioSummary(state.projects);
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('finalContractValue');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sorted = [...filteredProjects].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortField === 'projectName') return mul * a.projectName.localeCompare(b.projectName);
    if (sortField === 'overallGainFade') return mul * a.overallGainFade.localeCompare(b.overallGainFade);
    if (sortField === 'marketSegment') return mul * a.marketSegment.localeCompare(b.marketSegment);
    return mul * ((a[sortField] as number) - (b[sortField] as number));
  });

  const toggleFilter = (type: 'divisions' | 'marketSegments' | 'gainFade', value: string) => {
    const current = state.filters[type] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ [type]: next });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Project Portfolio</h2>
        <p className="text-sm text-muted-foreground">
          All {filteredProjects.length} projects — click any project to see details
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Division</p>
          <div className="flex gap-1.5">
            {summary.divisions.map((d) => (
              <button
                key={d}
                onClick={() => toggleFilter('divisions', d)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                  (state.filters.divisions as string[]).includes(d)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Gain/Fade</p>
          <div className="flex gap-1.5">
            {(['Gain', 'Fade'] as const).map((gf) => (
              <button
                key={gf}
                onClick={() => toggleFilter('gainFade', gf)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                  (state.filters.gainFade as string[]).includes(gf)
                    ? gf === 'Gain' ? 'border-gain bg-gain text-white' : 'border-fade bg-fade text-white'
                    : 'border-border text-muted-foreground hover:bg-accent'
                )}
              >
                {gf}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ProjectScatterPlot projects={filteredProjects} />

      {/* Data Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {([
                  ['projectName', 'Project'],
                  ['marketSegment', 'Segment'],
                  ['finalContractValue', 'Contract Value'],
                  ['finalGrossProfitMargin', 'Margin'],
                  ['overallGainFade', 'Gain/Fade'],
                ] as [SortField, string][]).map(([field, label]) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className="cursor-pointer whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr
                  key={p.projectNumber}
                  onClick={() => navigate(`/project/${p.projectNumber}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{p.projectName}</p>
                    <p className="text-xs text-muted-foreground">{p.customerName}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.marketSegment}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(p.finalContractValue)}</td>
                  <td className="px-4 py-3">{formatPercent(p.finalGrossProfitMargin)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      p.overallGainFade === 'Gain' ? 'bg-gain/10 text-gain' : 'bg-fade/10 text-fade'
                    )}>
                      {p.overallGainFade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
