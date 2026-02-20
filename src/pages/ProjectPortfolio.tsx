import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectData } from '@/hooks/useProjectData';
import { ProjectScatterPlot } from '@/components/charts/ProjectScatterPlot';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { ArrowUpDown } from 'lucide-react';

type SortField = 'projectName' | 'finalContractValue' | 'finalGrossProfitMargin' | 'overallGainFade' | 'marketSegment' | 'customerName' | 'yearCompleted' | 'gainFadeOrgFinalDollars' | 'projectManager' | 'estimator';

export function ProjectPortfolio() {
  const { filteredProjects } = useProjectData();
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
    if (sortField === 'projectName' || sortField === 'overallGainFade' || sortField === 'marketSegment' || sortField === 'customerName' || sortField === 'projectManager' || sortField === 'estimator') {
      return mul * ((a[sortField] as string) || '').localeCompare((b[sortField] as string) || '');
    }
    return mul * ((a[sortField] as number) - (b[sortField] as number));
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Project Portfolio</h2>
        <p className="text-sm text-muted-foreground">
          {filteredProjects.length} projects — click any project to drill down into cost and margin details
        </p>
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
                  ['customerName', 'Customer'],
                  ['marketSegment', 'Segment'],
                  ['projectManager', 'PM'],
                  ['estimator', 'Estimator'],
                  ['yearCompleted', 'Year'],
                  ['finalContractValue', 'Contract Value'],
                  ['finalGrossProfitMargin', 'Margin'],
                  ['gainFadeOrgFinalDollars', 'Gain/Fade $'],
                  ['overallGainFade', 'Status'],
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
                    <p className="text-xs text-muted-foreground">{p.division}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.customerName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.marketSegment}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{p.projectManager}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{p.estimator}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.yearCompleted}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(p.finalContractValue)}</td>
                  <td className="px-4 py-3">{formatPercent(p.finalGrossProfitMargin)}</td>
                  <td className={cn('px-4 py-3 font-medium', p.gainFadeOrgFinalDollars >= 0 ? 'text-gain' : 'text-fade')}>
                    {p.gainFadeOrgFinalDollars >= 0 ? '+' : ''}{formatCurrency(p.gainFadeOrgFinalDollars)}
                  </td>
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
