import { useProjectData } from '@/hooks/useProjectData';
import { calculatePortfolioSummary } from '@/lib/calculations';
import { KpiCards } from '@/components/charts/KpiCards';
import { ProfitMarginChart } from '@/components/charts/ProfitMarginChart';
import { GainFadePieChart } from '@/components/charts/GainFadeChart';
import { TopProjectsChart } from '@/components/charts/TopProjectsChart';
import { AnalysisSummary } from '@/components/lead-gen/AnalysisSummary';
import { RiskExposurePanel } from '@/components/lead-gen/RiskExposurePanel';
import { StrategicRecommendations } from '@/components/lead-gen/StrategicRecommendations';

export function ExecutiveSummary() {
  const { filteredProjects } = useProjectData();
  const summary = calculatePortfolioSummary(filteredProjects);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Executive Summary</h2>
        <p className="text-sm text-muted-foreground">
          Portfolio intelligence across {summary.totalProjects} projects — {summary.divisions.length} divisions, {summary.marketSegments.length} market segments
        </p>
      </div>

      <KpiCards summary={summary} />

      <RiskExposurePanel summary={summary} projects={filteredProjects} />

      <AnalysisSummary summary={summary} projects={filteredProjects} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfitMarginChart projects={filteredProjects} />
        <GainFadePieChart projects={filteredProjects} />
      </div>

      <TopProjectsChart projects={filteredProjects} />

      <StrategicRecommendations summary={summary} projects={filteredProjects} />
    </div>
  );
}
