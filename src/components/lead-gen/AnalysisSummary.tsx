import { Lightbulb, AlertTriangle, TrendingUp, Sparkles, BarChart3 } from 'lucide-react';
import type { PortfolioSummary, ProjectRecord } from '@/lib/types';
import { generateDynamicInsights } from '@/lib/calculations';
import type { DynamicInsight } from '@/lib/calculations';
import type { ReactNode } from 'react';

const typeConfig: Record<DynamicInsight['type'], { bg: string; border: string; icon: ReactNode; dot: string }> = {
  warning: { bg: 'bg-fade/5', border: 'border-fade/20', icon: <AlertTriangle className="h-3.5 w-3.5" />, dot: 'bg-fade' },
  opportunity: { bg: 'bg-primary/5', border: 'border-primary/20', icon: <Sparkles className="h-3.5 w-3.5" />, dot: 'bg-primary' },
  strength: { bg: 'bg-gain/5', border: 'border-gain/20', icon: <TrendingUp className="h-3.5 w-3.5" />, dot: 'bg-gain' },
  pattern: { bg: 'bg-chart-4/5', border: 'border-chart-4/20', icon: <BarChart3 className="h-3.5 w-3.5" />, dot: 'bg-chart-4' },
};

const iconColor: Record<DynamicInsight['type'], string> = {
  warning: 'text-fade',
  opportunity: 'text-primary',
  strength: 'text-gain',
  pattern: 'text-chart-4',
};

const categoryLabels: Record<DynamicInsight['category'], string> = {
  'cost-driver': 'Cost Driver',
  segment: 'Segment',
  customer: 'Customer',
  personnel: 'Personnel',
  trend: 'Trend',
  risk: 'Risk',
};

export function AnalysisSummary({ summary: _summary, projects }: { summary: PortfolioSummary; projects: ProjectRecord[] }) {
  const insights = generateDynamicInsights(projects);

  if (insights.length === 0) return null;

  // Show top 6 insights by severity
  const topInsights = insights.slice(0, 6);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Executive Insights</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Data-driven findings from your portfolio — what the numbers are telling you, and what to do about it.
      </p>
      <div className="space-y-3">
        {topInsights.map((insight, i) => {
          const config = typeConfig[insight.type];
          return (
            <div key={i} className={`rounded-lg border ${config.border} ${config.bg} p-3`}>
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 ${iconColor[insight.type]}`}>{config.icon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{insight.headline}</p>
                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.border} ${config.bg}`}>
                      {categoryLabels[insight.category]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{insight.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
