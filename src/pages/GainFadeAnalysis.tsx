import { useNavigate } from 'react-router-dom';
import { useProjectData } from '@/hooks/useProjectData';
import { GainFadePieChart, GainFadeBySegmentChart, GainFadeByDivisionChart, GainFadeByCustomerChart } from '@/components/charts/GainFadeChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, formatCurrencyFull, formatPercent } from '@/lib/formatters';
import { calculatePortfolioSummary } from '@/lib/calculations';
import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

function WaterfallChart({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const totalOrigProfit = projects.reduce((s, p) => s + p.originalEstimatedProfit, 0);
  const totalRevisedProfit = projects.reduce((s, p) => s + p.revisedEstimatedProfit, 0);
  const totalFinalProfit = projects.reduce((s, p) => s + p.finalProfit, 0);
  const changeOrderImpact = totalRevisedProfit - totalOrigProfit;
  const executionImpact = totalFinalProfit - totalRevisedProfit;

  const totalOrigValue = projects.reduce((s, p) => s + p.originalContractValue, 0);
  const totalFinalValue = projects.reduce((s, p) => s + p.finalContractValue, 0);
  const origMargin = totalOrigValue > 0 ? totalOrigProfit / totalOrigValue : 0;
  const finalMargin = totalFinalValue > 0 ? totalFinalProfit / totalFinalValue : 0;

  // For the waterfall, we use absolute positioning with base + value stacking
  const data = [
    {
      name: 'Original Estimated Profit',
      value: totalOrigProfit,
      base: 0,
      fill: 'var(--color-chart-1)',
      label: `${formatCurrency(totalOrigProfit)} (${formatPercent(origMargin)} margin)`,
    },
    {
      name: 'Change Order Impact',
      value: changeOrderImpact,
      base: changeOrderImpact >= 0 ? totalOrigProfit : totalOrigProfit + changeOrderImpact,
      fill: changeOrderImpact >= 0 ? 'var(--color-gain)' : 'var(--color-fade)',
      label: `${changeOrderImpact >= 0 ? '+' : ''}${formatCurrency(changeOrderImpact)}`,
    },
    {
      name: 'Execution Variance',
      value: Math.abs(executionImpact),
      base: executionImpact >= 0 ? totalRevisedProfit : totalRevisedProfit + executionImpact,
      fill: executionImpact >= 0 ? 'var(--color-gain)' : 'var(--color-fade)',
      label: `${executionImpact >= 0 ? '+' : ''}${formatCurrency(executionImpact)}`,
    },
    {
      name: 'Final Actual Profit',
      value: totalFinalProfit,
      base: 0,
      fill: totalFinalProfit >= totalOrigProfit ? 'var(--color-chart-2)' : 'var(--color-chart-5)',
      label: `${formatCurrency(totalFinalProfit)} (${formatPercent(finalMargin)} margin)`,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Profit Bridge: How Did We Get From Estimate to Actual?</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        From original estimated profit to final actual — what drove the change?
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(_: unknown, _name: unknown, entry: { payload?: (typeof data)[number] }) => {
                if (!entry.payload) return ['', ''];
                return [entry.payload.label, entry.payload.name];
              }}
            />
            <Bar dataKey="base" stackId="waterfall" fill="transparent" />
            <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Original Est. Profit</p>
          <p className="text-sm font-bold">{formatCurrency(totalOrigProfit)}</p>
        </div>
        <div className={cn('rounded-lg p-2 text-center', changeOrderImpact >= 0 ? 'bg-gain/10' : 'bg-fade/10')}>
          <p className="text-[10px] text-muted-foreground">Change Orders</p>
          <p className={cn('text-sm font-bold', changeOrderImpact >= 0 ? 'text-gain' : 'text-fade')}>
            {changeOrderImpact >= 0 ? '+' : ''}{formatCurrency(changeOrderImpact)}
          </p>
        </div>
        <div className={cn('rounded-lg p-2 text-center', executionImpact >= 0 ? 'bg-gain/10' : 'bg-fade/10')}>
          <p className="text-[10px] text-muted-foreground">Execution Variance</p>
          <p className={cn('text-sm font-bold', executionImpact >= 0 ? 'text-gain' : 'text-fade')}>
            {executionImpact >= 0 ? '+' : ''}{formatCurrency(executionImpact)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Final Actual Profit</p>
          <p className="text-sm font-bold">{formatCurrency(totalFinalProfit)}</p>
        </div>
      </div>
    </div>
  );
}

function ProjectGainFadeList({ projects }: { projects: import('@/lib/types').ProjectRecord[] }) {
  const navigate = useNavigate();
  const sorted = [...projects]
    .filter((p) => p.gainFadeOrgFinalDollars !== 0)
    .sort((a, b) => b.gainFadeOrgFinalDollars - a.gainFadeOrgFinalDollars);

  const top5Gain = sorted.filter((p) => p.overallGainFade === 'Gain').slice(0, 5);
  const top5Fade = sorted.filter((p) => p.overallGainFade === 'Fade').slice(-5).reverse();

  // Combine for horizontal bar chart
  const gainChartData = top5Gain.map((p) => ({
    name: p.projectName.length > 30 ? p.projectName.slice(0, 30) + '...' : p.projectName,
    value: p.gainFadeOrgFinalDollars,
    margin: p.finalGrossProfitMargin,
    origMargin: p.originalEstimatedProfitMargin,
    customer: p.customerName,
    projectNumber: p.projectNumber,
  }));

  const fadeChartData = top5Fade.map((p) => ({
    name: p.projectName.length > 30 ? p.projectName.slice(0, 30) + '...' : p.projectName,
    value: Math.abs(p.gainFadeOrgFinalDollars),
    actualValue: p.gainFadeOrgFinalDollars,
    margin: p.finalGrossProfitMargin,
    origMargin: p.originalEstimatedProfitMargin,
    customer: p.customerName,
    projectNumber: p.projectNumber,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-gain" />
          <h3 className="text-sm font-semibold text-foreground">Top 5 Margin Gains</h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Projects that exceeded their original profit estimate the most</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gainChartData} layout="vertical" margin={{ top: 0, right: 10, left: 120, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }} width={115} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                formatter={(_: unknown, _name: unknown, entry: { payload?: (typeof gainChartData)[number] }) => {
                  const d = entry.payload;
                  if (!d) return ['', ''];
                  return [`+${formatCurrencyFull(d.value)} | Est: ${formatPercent(d.origMargin)} → Final: ${formatPercent(d.margin)} | ${d.customer}`, 'Gain'];
                }}
              />
              <Bar
                dataKey="value"
                fill="var(--color-gain)"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(_data: unknown, _index: unknown, e: unknown) => {
                  const ev = e as { projectNumber?: string };
                  if (ev?.projectNumber) navigate(`/project/${ev.projectNumber}`);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="h-4 w-4 text-fade" />
          <h3 className="text-sm font-semibold text-foreground">Top 5 Margin Fades</h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Projects that fell short of their original profit estimate the most</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fadeChartData} layout="vertical" margin={{ top: 0, right: 10, left: 120, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }} width={115} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                formatter={(_: unknown, _name: unknown, entry: { payload?: (typeof fadeChartData)[number] }) => {
                  const d = entry.payload;
                  if (!d) return ['', ''];
                  return [`${formatCurrencyFull(d.actualValue)} | Est: ${formatPercent(d.origMargin)} → Final: ${formatPercent(d.margin)} | ${d.customer}`, 'Fade'];
                }}
              />
              <Bar
                dataKey="value"
                fill="var(--color-fade)"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(_data: unknown, _index: unknown, e: unknown) => {
                  const ev = e as { projectNumber?: string };
                  if (ev?.projectNumber) navigate(`/project/${ev.projectNumber}`);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function GainFadeAnalysis() {
  const { filteredProjects } = useProjectData();
  const summary = calculatePortfolioSummary(filteredProjects);
  const netGainFade = summary.totalGainFadeDollars;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Gain / Fade Analysis</h2>
        <p className="text-sm text-muted-foreground">
          How well are you estimating? {summary.gainCount} gains, {summary.fadeCount} fades — {formatPercent(summary.gainRate)} gain rate
        </p>
      </div>

      {/* Narrative callout */}
      <div className={cn(
        'rounded-xl border p-4 flex items-start gap-3',
        netGainFade >= 0 ? 'border-gain/20 bg-gain/5' : 'border-fade/20 bg-fade/5'
      )}>
        {netGainFade >= 0 ? (
          <TrendingUp className="h-5 w-5 text-gain shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-fade shrink-0 mt-0.5" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            Net Portfolio {netGainFade >= 0 ? 'Gain' : 'Fade'}: {netGainFade >= 0 ? '+' : ''}{formatCurrencyFull(netGainFade)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {netGainFade >= 0
              ? 'Your portfolio is generating more profit than originally estimated. Drill into the data below to understand which segments, customers, and projects are driving this gain — and where you can improve further.'
              : 'Your portfolio is generating less profit than originally estimated. The analysis below identifies where margin is being lost so you can take corrective action on estimating, project selection, and execution.'
            }
          </p>
        </div>
      </div>

      {/* Section: The Big Picture */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">The Big Picture</h3>
        <WaterfallChart projects={filteredProjects} />
      </div>

      {/* Section: Where is margin being gained/lost? */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Where Is Margin Being Gained & Lost?</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <GainFadePieChart projects={filteredProjects} />
          <GainFadeByDivisionChart projects={filteredProjects} />
        </div>
        <GainFadeBySegmentChart projects={filteredProjects} />
        <GainFadeByCustomerChart projects={filteredProjects} />
      </div>

      {/* Section: Individual Projects */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Biggest Winners & Losers</h3>
        <ProjectGainFadeList projects={filteredProjects} />
      </div>
    </div>
  );
}
