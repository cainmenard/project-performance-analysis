import { useProjectData } from '@/hooks/useProjectData';
import { calculatePortfolioSummary } from '@/lib/calculations';
import { KpiCards } from '@/components/charts/KpiCards';
import { ProfitMarginChart } from '@/components/charts/ProfitMarginChart';
import { GainFadePieChart } from '@/components/charts/GainFadeChart';
import { TopProjectsChart } from '@/components/charts/TopProjectsChart';
import { AnalysisSummary } from '@/components/lead-gen/AnalysisSummary';
import { CtaBanner } from '@/components/lead-gen/CtaBanner';

export function ExecutiveSummary() {
  const { filteredProjects } = useProjectData();
  const summary = calculatePortfolioSummary(filteredProjects);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Executive Summary</h2>
        <p className="text-sm text-muted-foreground">
          Portfolio overview across {summary.totalProjects} projects
        </p>
      </div>

      <KpiCards summary={summary} />

      <AnalysisSummary summary={summary} projects={filteredProjects} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfitMarginChart projects={filteredProjects} />
        <GainFadePieChart projects={filteredProjects} />
      </div>

      <TopProjectsChart projects={filteredProjects} />

      <CtaBanner />
    </div>
  );
}
