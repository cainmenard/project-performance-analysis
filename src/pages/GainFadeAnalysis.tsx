import { useProjectData } from '@/hooks/useProjectData';
import { GainFadePieChart, GainFadeBySegmentChart, GainFadeByDivisionChart } from '@/components/charts/GainFadeChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { calculatePortfolioSummary } from '@/lib/calculations';

function WaterfallChart({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  // Aggregate: original profit -> change orders impact -> execution impact -> final profit
  const totalOrigProfit = projects.reduce((s, p) => s + p.originalEstimatedProfit, 0);
  const totalRevisedProfit = projects.reduce((s, p) => s + p.revisedEstimatedProfit, 0);
  const totalFinalProfit = projects.reduce((s, p) => s + p.finalProfit, 0);
  const changeOrderImpact = totalRevisedProfit - totalOrigProfit;
  const executionImpact = totalFinalProfit - totalRevisedProfit;

  const data = [
    { name: 'Original Est.', value: totalOrigProfit, base: 0, fill: 'var(--color-chart-1)' },
    { name: 'Change Orders', value: changeOrderImpact, base: totalOrigProfit, fill: changeOrderImpact >= 0 ? 'var(--color-gain)' : 'var(--color-fade)' },
    { name: 'Execution', value: executionImpact, base: totalRevisedProfit, fill: executionImpact >= 0 ? 'var(--color-gain)' : 'var(--color-fade)' },
    { name: 'Final Actual', value: totalFinalProfit, base: 0, fill: 'var(--color-chart-4)' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Profit Waterfall: Original to Final</h3>
      <p className="mb-4 text-xs text-muted-foreground">How portfolio profit evolved from estimate through completion</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
            />
            <Bar dataKey="base" stackId="a" fill="transparent" />
            <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ProjectGainFadeList({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const sorted = [...projects]
    .filter((p) => p.gainFadeOrgFinalDollars !== 0)
    .sort((a, b) => b.gainFadeOrgFinalDollars - a.gainFadeOrgFinalDollars);

  const top5Gain = sorted.slice(0, 5);
  const top5Fade = sorted.slice(-5).reverse();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top 5 Gains</h3>
        <div className="space-y-2">
          {top5Gain.map((p) => (
            <div key={p.projectNumber} className="flex items-center justify-between text-sm">
              <span className="truncate text-muted-foreground max-w-[200px]">{p.projectName}</span>
              <span className="font-medium text-gain">+{formatCurrency(p.gainFadeOrgFinalDollars)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top 5 Fades</h3>
        <div className="space-y-2">
          {top5Fade.map((p) => (
            <div key={p.projectNumber} className="flex items-center justify-between text-sm">
              <span className="truncate text-muted-foreground max-w-[200px]">{p.projectName}</span>
              <span className="font-medium text-fade">{formatCurrency(p.gainFadeOrgFinalDollars)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GainFadeAnalysis() {
  const { filteredProjects } = useProjectData();
  const summary = calculatePortfolioSummary(filteredProjects);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Gain / Fade Analysis</h2>
        <p className="text-sm text-muted-foreground">
          {summary.gainCount} gains, {summary.fadeCount} fades — {formatPercent(summary.gainRate)} gain rate
        </p>
      </div>

      <WaterfallChart projects={filteredProjects} />

      <div className="grid gap-6 lg:grid-cols-2">
        <GainFadePieChart projects={filteredProjects} />
        <GainFadeByDivisionChart projects={filteredProjects} />
      </div>

      <GainFadeBySegmentChart projects={filteredProjects} />

      <ProjectGainFadeList projects={filteredProjects} />
    </div>
  );
}
