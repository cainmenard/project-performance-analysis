import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { formatCurrency, formatCurrencyFull, formatPercent } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';

interface ScatterDataPoint {
  x: number;
  y: number;
  z: number;
  name: string;
  projectNumber: string;
  gainFade: 'Gain' | 'Fade';
  gainFadeDollars: number;
  customer: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterDataPoint }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs max-w-[250px]">
      <p className="font-semibold text-foreground">{d.name}</p>
      <p className="text-muted-foreground">{d.customer}</p>
      <div className="mt-1.5 space-y-0.5">
        <p className="text-muted-foreground">Contract: {formatCurrencyFull(d.x)}</p>
        <p className="text-muted-foreground">Margin: {formatPercent(d.y)}</p>
        <p className={d.gainFade === 'Gain' ? 'text-gain font-medium' : 'text-fade font-medium'}>
          {d.gainFade}: {d.gainFadeDollars >= 0 ? '+' : ''}{formatCurrencyFull(d.gainFadeDollars)}
        </p>
      </div>
    </div>
  );
}

export function ProjectScatterPlot({ projects, onSelectProject }: {
  projects: ProjectRecord[];
  onSelectProject?: (projectNumber: string) => void;
}) {
  const navigate = useNavigate();

  const avgMargin = projects.length > 0
    ? projects.reduce((s, p) => s + p.finalGrossProfitMargin, 0) / projects.length
    : 0;

  const marginStdDev = projects.length > 1
    ? Math.sqrt(projects.reduce((s, p) => s + Math.pow(p.finalGrossProfitMargin - avgMargin, 2), 0) / (projects.length - 1))
    : 0;

  const gainData: ScatterDataPoint[] = projects
    .filter((p) => p.overallGainFade === 'Gain')
    .map((p) => ({
      x: p.finalContractValue,
      y: p.finalGrossProfitMargin,
      z: Math.abs(p.gainFadeOrgFinalDollars) + 500,
      name: p.projectName,
      projectNumber: p.projectNumber,
      gainFade: 'Gain' as const,
      gainFadeDollars: p.gainFadeOrgFinalDollars,
      customer: p.customerName,
    }));

  const fadeData: ScatterDataPoint[] = projects
    .filter((p) => p.overallGainFade === 'Fade')
    .map((p) => ({
      x: p.finalContractValue,
      y: p.finalGrossProfitMargin,
      z: Math.abs(p.gainFadeOrgFinalDollars) + 500,
      name: p.projectName,
      projectNumber: p.projectNumber,
      gainFade: 'Fade' as const,
      gainFadeDollars: p.gainFadeOrgFinalDollars,
      customer: p.customerName,
    }));

  const handleClick = (data: ScatterDataPoint) => {
    if (onSelectProject) {
      onSelectProject(data.projectNumber);
    } else {
      navigate(`/project/${data.projectNumber}`);
    }
  };

  const minMargin = Math.min(...projects.map((p) => p.finalGrossProfitMargin));
  const maxMargin = Math.max(...projects.map((p) => p.finalGrossProfitMargin));
  const marginSpread = maxMargin - minMargin;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Project Profitability Map</h3>
          <p className="text-xs text-muted-foreground">
            Contract value vs profit margin — bubble size shows gain/fade magnitude. Click to drill down.
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-xs text-muted-foreground">Margin spread</p>
          <p className="text-lg font-bold text-foreground">{formatPercent(marginSpread)}</p>
          <p className="text-[10px] text-muted-foreground">
            {formatPercent(minMargin)} to {formatPercent(maxMargin)} | Std Dev: {formatPercent(marginStdDev)}
          </p>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              type="number"
              dataKey="x"
              name="Contract Value"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickFormatter={(v: number) => formatCurrency(v)}
              label={{ value: 'Contract Value', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: 'var(--color-muted-foreground)' } }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Profit Margin"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickFormatter={(v: number) => formatPercent(v)}
              label={{ value: 'Profit Margin', angle: -90, position: 'insideLeft', offset: 5, style: { fontSize: 10, fill: 'var(--color-muted-foreground)' } }}
            />
            <ZAxis type="number" dataKey="z" range={[60, 600]} />
            <ReferenceLine y={avgMargin} stroke="var(--color-chart-4)" strokeDasharray="5 5" label={{ value: `Avg: ${formatPercent(avgMargin)}`, position: 'right', style: { fontSize: 9, fill: 'var(--color-chart-4)' } }} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              name="Gain"
              data={gainData}
              fill="var(--color-gain)"
              fillOpacity={0.6}
              cursor="pointer"
              onClick={handleClick}
            />
            <Scatter
              name="Fade"
              data={fadeData}
              fill="var(--color-fade)"
              fillOpacity={0.6}
              cursor="pointer"
              onClick={handleClick}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-gain" /> Gain</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-fade" /> Fade</span>
          <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-chart-4" style={{ borderTop: '2px dashed var(--color-chart-4)' }} /> Avg Margin</span>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Wide scatter = inconsistent profitability. The tighter the cluster, the more predictable your outcomes.
        </p>
      </div>
    </div>
  );
}
