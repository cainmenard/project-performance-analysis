import { useProjectData } from '@/hooks/useProjectData';
import { GainFadePieChart, GainFadeBySegmentChart, GainFadeByDivisionChart } from '@/components/charts/GainFadeChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { calculatePortfolioSummary, calculateGainFadeRootCause } from '@/lib/calculations';
import { AlertTriangle, RefreshCw, Microscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import type { PieLabelRenderProps } from 'recharts';

function WaterfallChart({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
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

function RootCauseBreakdown({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const rootCause = calculateGainFadeRootCause(projects);
  const navigate = useNavigate();

  const attributionData = [
    { name: 'Change Orders', value: Math.abs(rootCause.changeOrderImpact), fill: rootCause.changeOrderImpact >= 0 ? 'var(--color-gain)' : 'var(--color-chart-3)' },
    { name: 'Execution', value: Math.abs(rootCause.executionVariance), fill: rootCause.executionVariance >= 0 ? 'var(--color-gain)' : 'var(--color-fade)' },
  ];

  const costBreakdown = [
    { name: 'Labor', value: -rootCause.executionCostBreakdown.labor },
    { name: 'Materials', value: -rootCause.executionCostBreakdown.materials },
    { name: 'Equipment', value: -rootCause.executionCostBreakdown.equipment },
    { name: 'Subs', value: -rootCause.executionCostBreakdown.subcontracts },
    { name: 'Other', value: -rootCause.executionCostBreakdown.other },
  ].sort((a, b) => b.value - a.value);

  // Top 5 worst faders with decomposition
  const worstFaders = rootCause.projectBreakdown
    .filter((p) => p.overallGainFade === 'Fade')
    .slice(0, 5);

  return (
    <>
      {/* Root cause attribution callout */}
      <div className="rounded-xl border border-chart-3/20 bg-chart-3/5 p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-chart-3/10 p-2 mt-0.5">
            <Microscope className="h-4 w-4 text-chart-3" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Root Cause Attribution</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Of the total {formatCurrency(rootCause.totalGainFade)} net gain/fade, <span className="font-medium text-foreground">{formatPercent(rootCause.changeOrderPct)}</span> is attributable to
              change order impact ({formatCurrency(rootCause.changeOrderImpact)}) and <span className="font-medium text-foreground">{formatPercent(rootCause.executionPct)}</span> to
              execution variance ({formatCurrency(rootCause.executionVariance)}).
              {rootCause.executionVariance < 0 && (
                <> The execution gap means projects are costing more than revised estimates — focus on cost control during project delivery.</>
              )}
              {rootCause.changeOrderImpact < 0 && (
                <> Negative change order impact suggests scope changes aren't being priced profitably — tighten change order markup and approval processes.</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attribution Donut */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Impact Attribution</h3>
          <p className="mb-4 text-xs text-muted-foreground">Change orders vs execution as drivers of gain/fade</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  dataKey="value"
                  label={(props: PieLabelRenderProps) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  strokeWidth={2}
                  stroke="var(--color-card)"
                >
                  {attributionData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                  formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: attributionData[0].fill }} />
              <span className="text-muted-foreground">Change Orders: {formatCurrency(rootCause.changeOrderImpact)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: attributionData[1].fill }} />
              <span className="text-muted-foreground">Execution: {formatCurrency(rootCause.executionVariance)}</span>
            </div>
          </div>
        </div>

        {/* Execution Cost Breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Execution Cost Overruns by Category</h3>
          <p className="mb-4 text-xs text-muted-foreground">Which cost categories drove execution variance (vs revised estimate)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} width={70} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                  formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {costBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.value > 0 ? 'var(--color-fade)' : 'var(--color-gain)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground text-center">Red = cost overrun, Green = under budget</p>
        </div>
      </div>

      {/* Worst Faders with Decomposition */}
      {worstFaders.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-1">Top Fade Contributors — Root Cause Breakdown</h3>
          <p className="mb-4 text-xs text-muted-foreground">What drove the fade for your worst-performing projects</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Project</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Total Fade</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Change Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Execution</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Primary Driver</th>
                </tr>
              </thead>
              <tbody>
                {worstFaders.map((p) => {
                  const primaryDriver = Math.abs(p.changeOrderImpact) > Math.abs(p.executionVariance) ? 'Change Orders' : 'Execution';
                  return (
                    <tr
                      key={p.projectNumber}
                      onClick={() => navigate(`/project/${p.projectNumber}`)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{p.projectName}</td>
                      <td className="px-4 py-3 text-right text-fade font-medium">{formatCurrency(p.totalGainFade)}</td>
                      <td className={cn('px-4 py-3 text-right', p.changeOrderImpact < 0 ? 'text-fade' : 'text-gain')}>
                        {formatCurrency(p.changeOrderImpact)}
                      </td>
                      <td className={cn('px-4 py-3 text-right', p.executionVariance < 0 ? 'text-fade' : 'text-gain')}>
                        {formatCurrency(p.executionVariance)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          primaryDriver === 'Execution' ? 'bg-fade/10 text-fade' : 'bg-chart-3/10 text-chart-3'
                        )}>
                          {primaryDriver}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
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

function GainFadeExecutiveCallout({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const fadedProjects = projects.filter((p) => p.overallGainFade === 'Fade');
  const totalFadeDollars = fadedProjects.reduce((s, p) => s + Math.abs(p.gainFadeOrgFinalDollars), 0);

  if (fadedProjects.length === 0) return null;

  return (
    <div className="rounded-xl border border-fade/20 bg-fade/5 p-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-fade/10 p-2 mt-0.5">
          <AlertTriangle className="h-4 w-4 text-fade" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Why This Matters to Your Bottom Line</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Every faded project represents a failure in one of three areas: <span className="font-medium text-foreground">estimating accuracy</span>, <span className="font-medium text-foreground">change order capture</span>, or <span className="font-medium text-foreground">execution discipline</span>.
            Your {fadedProjects.length} faded projects lost {formatCurrency(totalFadeDollars)} — an average of {formatCurrency(totalFadeDollars / fadedProjects.length)} per project.
            With a structured close-out review feeding back into estimating, contractors typically recover 40-60% of fade losses within 12 months.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-gain/10 px-2.5 py-1 text-xs font-medium text-gain">
            <RefreshCw className="h-3 w-3" />
            Potential annual recovery: {formatCurrency(totalFadeDollars * 0.4)} - {formatCurrency(totalFadeDollars * 0.6)}
          </div>
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

      <GainFadeExecutiveCallout projects={filteredProjects} />

      <WaterfallChart projects={filteredProjects} />

      <RootCauseBreakdown projects={filteredProjects} />

      <div className="grid gap-6 lg:grid-cols-2">
        <GainFadePieChart projects={filteredProjects} />
        <GainFadeByDivisionChart projects={filteredProjects} />
      </div>

      <GainFadeBySegmentChart projects={filteredProjects} />

      <ProjectGainFadeList projects={filteredProjects} />
    </div>
  );
}
