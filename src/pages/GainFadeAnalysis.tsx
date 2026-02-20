import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectData } from '@/hooks/useProjectData';
import { GainFadePieChart, GainFadeBySegmentChart, GainFadeByDivisionChart, GainFadeByCustomerChart } from '@/components/charts/GainFadeChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, formatCurrencyFull, formatPercent } from '@/lib/formatters';
import { calculatePortfolioSummary, analyzePortfolioCostDrivers, analyzeProjectCostDrivers } from '@/lib/calculations';
import type { ProjectRecord } from '@/lib/types';
import type { ProjectCostDrivers, CostDriverDetail } from '@/lib/calculations';
import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, AlertTriangle, ArrowLeft, ChevronRight, User, Calculator } from 'lucide-react';

function WaterfallChart({ projects }: { projects: ProjectRecord[] }) {
  const totalOrigProfit = projects.reduce((s, p) => s + p.originalEstimatedProfit, 0);
  const totalRevisedProfit = projects.reduce((s, p) => s + p.revisedEstimatedProfit, 0);
  const totalFinalProfit = projects.reduce((s, p) => s + p.finalProfit, 0);
  const changeOrderImpact = totalRevisedProfit - totalOrigProfit;
  const executionImpact = totalFinalProfit - totalRevisedProfit;

  const totalOrigValue = projects.reduce((s, p) => s + p.originalContractValue, 0);
  const totalFinalValue = projects.reduce((s, p) => s + p.finalContractValue, 0);
  const origMargin = totalOrigValue > 0 ? totalOrigProfit / totalOrigValue : 0;
  const finalMargin = totalFinalValue > 0 ? totalFinalProfit / totalFinalValue : 0;

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

function CostDriverBreakdown({ drivers }: { drivers: ProjectCostDrivers[] }) {
  // Aggregate cost drivers across all provided projects
  const categories = ['Labor', 'Materials', 'Equipment', 'Subcontracts', 'Other'];
  const aggregated = categories.map((cat) => {
    let totalVariance = 0;
    let timesPrimary = 0;
    for (const d of drivers) {
      const driver = d.drivers.find((dd) => dd.category === cat);
      if (driver) totalVariance += driver.varianceDollars;
      if (d.primaryDriver.category === cat) timesPrimary++;
    }
    return { category: cat, totalVariance, timesPrimary };
  });

  const chartData = aggregated
    .filter((a) => a.totalVariance !== 0)
    .sort((a, b) => b.totalVariance - a.totalVariance);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">What's Driving the Fade? Cost Category Breakdown</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Which direct cost categories are overrunning across faded projects
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
              formatter={(value: unknown, _name: unknown, entry: { payload?: (typeof chartData)[number] }) => {
                const d = entry?.payload;
                if (!d) return ['', ''];
                return [`${formatCurrencyFull(Number(value ?? 0))} | Primary driver in ${d.timesPrimary} projects`, d.category];
              }}
            />
            <Bar dataKey="totalVariance" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.totalVariance > 0 ? 'var(--color-fade)' : 'var(--color-gain)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {aggregated.filter((a) => a.timesPrimary > 0).sort((a, b) => b.timesPrimary - a.timesPrimary).map((a) => (
          <div key={a.category} className="rounded-lg bg-muted/30 px-3 py-1.5 text-xs">
            <span className="font-medium">{a.category}</span>
            <span className="text-muted-foreground"> — primary driver in </span>
            <span className="font-semibold text-fade">{a.timesPrimary}</span>
            <span className="text-muted-foreground"> projects</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CostDriverBarForProject({ drivers, label }: { drivers: CostDriverDetail[]; label?: string }) {
  const totalAbs = drivers.reduce((s, d) => s + Math.abs(d.varianceDollars), 0);
  if (totalAbs === 0) return null;

  return (
    <div className="mt-1.5">
      {label && <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
        {drivers.filter((d) => d.varianceDollars > 0).map((d) => {
          const width = (Math.abs(d.varianceDollars) / totalAbs) * 100;
          const colors: Record<string, string> = {
            Labor: 'bg-chart-1',
            Materials: 'bg-chart-2',
            Equipment: 'bg-chart-3',
            Subcontracts: 'bg-chart-4',
            Other: 'bg-chart-5',
          };
          return (
            <div
              key={d.category}
              className={cn('h-full', colors[d.category] ?? 'bg-chart-5')}
              style={{ width: `${width}%` }}
              title={`${d.category}: ${formatCurrencyFull(d.varianceDollars)} (${(d.shareOfTotalVariance * 100).toFixed(0)}%)`}
            />
          );
        })}
      </div>
    </div>
  );
}

function FadedProjectsDrillDown({ projects, onSelectProject }: {
  projects: ProjectRecord[];
  onSelectProject: (p: ProjectCostDrivers) => void;
}) {
  const analyzed = projects.map(analyzeProjectCostDrivers);
  const sorted = [...analyzed].sort((a, b) => a.project.gainFadeOrgFinalDollars - b.project.gainFadeOrgFinalDollars);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">All Faded Projects — with Cost Drivers</h3>
        <p className="text-xs text-muted-foreground">Click a project to drill into its direct cost breakdown</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Project</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">PM</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Gain/Fade $</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Primary Driver</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Cost Driver Breakdown</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Diagnosis</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => (
              <tr
                key={d.project.projectNumber}
                onClick={() => onSelectProject(d)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{d.project.projectName}</p>
                  <p className="text-[10px] text-muted-foreground">{d.project.customerName} · {d.project.marketSegment} · {d.project.yearCompleted}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{d.project.projectManager}</td>
                <td className="px-4 py-3 text-right font-medium text-fade whitespace-nowrap">
                  {formatCurrency(d.project.gainFadeOrgFinalDollars)}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-fade/10 px-2 py-0.5 text-xs font-medium text-fade">
                    {d.primaryDriver.category}
                  </span>
                </td>
                <td className="px-4 py-3 min-w-[180px]">
                  <CostDriverBarForProject drivers={d.drivers} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[250px]">
                  <p className="line-clamp-2">{d.diagnosis}</p>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectCostDrillDown({ analysis, onBack }: {
  analysis: ProjectCostDrivers;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const p = analysis.project;

  const costData = analysis.drivers.map((d) => ({
    category: d.category,
    variance: d.varianceDollars,
    variancePct: d.variancePct,
    share: d.shareOfTotalVariance,
    hoursVariance: d.hoursVariance,
    hoursVariancePct: d.hoursVariancePct,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to faded projects
        </button>
      </div>

      <div className="rounded-xl border border-fade/20 bg-fade/5 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{p.projectName}</h3>
            <p className="text-xs text-muted-foreground">
              {p.customerName} · #{p.projectNumber} · {p.marketSegment} · {p.yearCompleted}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {p.projectManager}</span>
              <span className="inline-flex items-center gap-1"><Calculator className="h-3 w-3" /> {p.estimator}</span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/project/${p.projectNumber}`)}
            className="text-xs text-primary hover:underline"
          >
            Full project detail →
          </button>
        </div>

        <p className="mt-3 text-sm text-foreground font-medium">{analysis.diagnosis}</p>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-card p-2 text-center border border-border">
            <p className="text-[10px] text-muted-foreground">Gain/Fade</p>
            <p className="text-sm font-bold text-fade">{formatCurrencyFull(p.gainFadeOrgFinalDollars)}</p>
          </div>
          <div className="rounded-lg bg-card p-2 text-center border border-border">
            <p className="text-[10px] text-muted-foreground">Cost Overrun</p>
            <p className="text-sm font-bold text-fade">{formatCurrencyFull(analysis.totalCostVariance)}</p>
          </div>
          <div className="rounded-lg bg-card p-2 text-center border border-border">
            <p className="text-[10px] text-muted-foreground">Margin Change</p>
            <p className="text-sm font-bold text-fade">
              {formatPercent(p.originalEstimatedProfitMargin)} → {formatPercent(p.finalGrossProfitMargin)}
            </p>
          </div>
        </div>
      </div>

      {/* Direct Cost Breakdown Table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Direct Cost Breakdown</h3>
        <p className="mb-4 text-xs text-muted-foreground">Which cost categories drove the variance — and by how much</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left text-xs font-semibold text-muted-foreground">Category</th>
              <th className="py-2 text-right text-xs font-semibold text-muted-foreground">Original Est.</th>
              <th className="py-2 text-right text-xs font-semibold text-muted-foreground">Final Actual</th>
              <th className="py-2 text-right text-xs font-semibold text-muted-foreground">Variance ($)</th>
              <th className="py-2 text-right text-xs font-semibold text-muted-foreground">Variance (%)</th>
              <th className="py-2 text-right text-xs font-semibold text-muted-foreground">Share of Overrun</th>
            </tr>
          </thead>
          <tbody>
            {[
              { cat: 'Labor', orig: p.originalEstimatedLabor, final: p.finalLabor },
              { cat: 'Materials', orig: p.originalEstimatedMaterials, final: p.finalMaterials },
              { cat: 'Equipment', orig: p.originalEstimatedEquipment, final: p.finalEquipment },
              { cat: 'Subcontracts', orig: p.originalEstimatedSubcontracts, final: p.finalSubcontracts },
              { cat: 'Other', orig: p.originalEstimatedOther, final: p.finalOther },
            ].map((row) => {
              const driver = costData.find((d) => d.category === row.cat);
              const isPrimary = analysis.primaryDriver.category === row.cat;
              return (
                <tr key={row.cat} className={cn('border-b border-border last:border-0', isPrimary && 'bg-fade/5')}>
                  <td className="py-2.5 font-medium">
                    {row.cat}
                    {isPrimary && <span className="ml-1.5 text-[10px] text-fade font-semibold">PRIMARY</span>}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{formatCurrencyFull(row.orig)}</td>
                  <td className="py-2.5 text-right">{formatCurrencyFull(row.final)}</td>
                  <td className={cn('py-2.5 text-right font-medium', (driver?.variance ?? 0) > 0 ? 'text-fade' : (driver?.variance ?? 0) < 0 ? 'text-gain' : '')}>
                    {(driver?.variance ?? 0) > 0 ? '+' : ''}{formatCurrencyFull(driver?.variance ?? 0)}
                  </td>
                  <td className={cn('py-2.5 text-right', (driver?.variancePct ?? 0) > 0 ? 'text-fade' : (driver?.variancePct ?? 0) < 0 ? 'text-gain' : '')}>
                    {(driver?.variancePct ?? 0) > 0 ? '+' : ''}{formatPercent(driver?.variancePct ?? 0)}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {((driver?.share ?? 0) * 100).toFixed(0)}%
                  </td>
                </tr>
              );
            })}
            <tr className="font-semibold">
              <td className="py-2.5">Total Cost</td>
              <td className="py-2.5 text-right">{formatCurrencyFull(p.originalEstimatedCost)}</td>
              <td className="py-2.5 text-right">{formatCurrencyFull(p.finalCost)}</td>
              <td className={cn('py-2.5 text-right', analysis.totalCostVariance > 0 ? 'text-fade' : 'text-gain')}>
                {analysis.totalCostVariance > 0 ? '+' : ''}{formatCurrencyFull(analysis.totalCostVariance)}
              </td>
              <td className={cn('py-2.5 text-right', analysis.totalCostVariancePct > 0 ? 'text-fade' : 'text-gain')}>
                {analysis.totalCostVariancePct > 0 ? '+' : ''}{formatPercent(analysis.totalCostVariancePct)}
              </td>
              <td className="py-2.5 text-right">100%</td>
            </tr>
          </tbody>
        </table>
        {/* Labor hours detail if available */}
        {p.originalEstimatedLaborHours > 0 && (
          <div className="mt-3 rounded-lg bg-muted/30 p-3 text-xs">
            <span className="font-medium">Labor Hours:</span>{' '}
            <span className="text-muted-foreground">
              Estimated {p.originalEstimatedLaborHours.toLocaleString()} hrs → Actual {p.finalLaborHours.toLocaleString()} hrs
              {' '}
            </span>
            <span className={cn('font-medium', p.finalLaborHours > p.originalEstimatedLaborHours ? 'text-fade' : 'text-gain')}>
              ({p.finalLaborHours > p.originalEstimatedLaborHours ? '+' : ''}
              {(p.finalLaborHours - p.originalEstimatedLaborHours).toLocaleString()} hrs,{' '}
              {p.finalLaborHours > p.originalEstimatedLaborHours ? '+' : ''}
              {formatPercent((p.finalLaborHours - p.originalEstimatedLaborHours) / p.originalEstimatedLaborHours)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectGainFadeList({ projects }: { projects: ProjectRecord[] }) {
  const navigate = useNavigate();
  const sorted = [...projects]
    .filter((p) => p.gainFadeOrgFinalDollars !== 0)
    .sort((a, b) => b.gainFadeOrgFinalDollars - a.gainFadeOrgFinalDollars);

  const top5Gain = sorted.filter((p) => p.overallGainFade === 'Gain').slice(0, 5);
  const top5Fade = sorted.filter((p) => p.overallGainFade === 'Fade').slice(-5).reverse();

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

type DrillDownView = 'overview' | 'faded-projects' | 'project-costs';

export function GainFadeAnalysis() {
  const { filteredProjects } = useProjectData();
  const summary = calculatePortfolioSummary(filteredProjects);
  const netGainFade = summary.totalGainFadeDollars;
  const costDriverAnalysis = analyzePortfolioCostDrivers(filteredProjects);

  const [drillDown, setDrillDown] = useState<DrillDownView>('overview');
  const [selectedProject, setSelectedProject] = useState<ProjectCostDrivers | null>(null);

  const fadedProjects = filteredProjects.filter((p) => p.overallGainFade === 'Fade');
  const totalFadeDollars = fadedProjects.reduce((s, p) => s + Math.abs(p.gainFadeOrgFinalDollars), 0);

  const handleDrillToFaded = () => setDrillDown('faded-projects');
  const handleDrillToProject = (d: ProjectCostDrivers) => {
    setSelectedProject(d);
    setDrillDown('project-costs');
  };
  const handleBackToFaded = () => {
    setSelectedProject(null);
    setDrillDown('faded-projects');
  };
  const handleBackToOverview = () => {
    setSelectedProject(null);
    setDrillDown('overview');
  };

  // Drill-down: Project Cost Detail
  if (drillDown === 'project-costs' && selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Gain / Fade Analysis</h2>
          <p className="text-sm text-muted-foreground">Drill-down: Project Direct Cost Breakdown</p>
        </div>
        <ProjectCostDrillDown analysis={selectedProject} onBack={handleBackToFaded} />
      </div>
    );
  }

  // Drill-down: All Faded Projects
  if (drillDown === 'faded-projects') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Gain / Fade Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Drill-down: {fadedProjects.length} faded projects — {formatCurrency(totalFadeDollars)} in total margin erosion
          </p>
        </div>

        <button
          onClick={handleBackToOverview}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to overview
        </button>

        {/* Cost driver summary for faded projects */}
        <CostDriverBreakdown drivers={costDriverAnalysis.fadedProjectDrivers} />

        {/* All faded projects table with cost drivers */}
        <FadedProjectsDrillDown projects={fadedProjects} onSelectProject={handleDrillToProject} />
      </div>
    );
  }

  // Main overview
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Gain / Fade Analysis</h2>
        <p className="text-sm text-muted-foreground">
          How well are you estimating? {summary.gainCount} gains, {summary.fadeCount} fades — {formatPercent(summary.gainRate)} gain rate
        </p>
      </div>

      {/* Narrative callout with drill-down */}
      <div className={cn(
        'rounded-xl border p-4 flex items-start gap-3',
        netGainFade >= 0 ? 'border-gain/20 bg-gain/5' : 'border-fade/20 bg-fade/5'
      )}>
        {netGainFade >= 0 ? (
          <TrendingUp className="h-5 w-5 text-gain shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-fade shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Net Portfolio {netGainFade >= 0 ? 'Gain' : 'Fade'}: {netGainFade >= 0 ? '+' : ''}{formatCurrencyFull(netGainFade)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {netGainFade >= 0
              ? 'Your portfolio is generating more profit than originally estimated. Drill into the data below to understand which segments, customers, and projects are driving this gain — and where you can improve further.'
              : `Your portfolio is generating less profit than originally estimated. ${fadedProjects.length} projects faded a total of ${formatCurrency(totalFadeDollars)}. The primary cost driver across faded projects is ${costDriverAnalysis.overallPrimaryFadeDriver.toLowerCase()}.`
            }
          </p>
          {fadedProjects.length > 0 && (
            <button
              onClick={handleDrillToFaded}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-fade/10 px-3 py-1.5 text-xs font-medium text-fade hover:bg-fade/20 transition-colors"
            >
              Drill into {fadedProjects.length} faded projects <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Cost Driver Summary */}
      {fadedProjects.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">What's Driving the Fades?</h3>
          <CostDriverBreakdown drivers={costDriverAnalysis.fadedProjectDrivers} />
        </div>
      )}

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
