import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import type { ProjectRecord } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';

interface ScatterDataPoint {
  x: number;
  y: number;
  z: number;
  name: string;
  projectNumber: string;
  gainFade: 'Gain' | 'Fade';
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterDataPoint }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{d.name}</p>
      <p className="text-muted-foreground">Contract: {formatCurrency(d.x)}</p>
      <p className="text-muted-foreground">Margin: {formatPercent(d.y)}</p>
      <p className={d.gainFade === 'Gain' ? 'text-gain font-medium' : 'text-fade font-medium'}>
        {d.gainFade}
      </p>
    </div>
  );
}

export function ProjectScatterPlot({ projects, onSelectProject }: {
  projects: ProjectRecord[];
  onSelectProject?: (projectNumber: string) => void;
}) {
  const navigate = useNavigate();

  const gainData: ScatterDataPoint[] = projects
    .filter((p) => p.overallGainFade === 'Gain')
    .map((p) => ({
      x: p.finalContractValue,
      y: p.finalGrossProfitMargin,
      z: Math.abs(p.gainFadeOrgFinalDollars) + 100,
      name: p.projectName,
      projectNumber: p.projectNumber,
      gainFade: 'Gain' as const,
    }));

  const fadeData: ScatterDataPoint[] = projects
    .filter((p) => p.overallGainFade === 'Fade')
    .map((p) => ({
      x: p.finalContractValue,
      y: p.finalGrossProfitMargin,
      z: Math.abs(p.gainFadeOrgFinalDollars) + 100,
      name: p.projectName,
      projectNumber: p.projectNumber,
      gainFade: 'Fade' as const,
    }));

  const handleClick = (data: ScatterDataPoint) => {
    if (onSelectProject) {
      onSelectProject(data.projectNumber);
    } else {
      navigate(`/project/${data.projectNumber}`);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Project Portfolio Map</h3>
      <p className="mb-4 text-xs text-muted-foreground">Contract value vs profit margin (click a project to drill down)</p>
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
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Profit Margin"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickFormatter={(v: number) => formatPercent(v)}
            />
            <ZAxis type="number" dataKey="z" range={[40, 400]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              name="Gain"
              data={gainData}
              fill="var(--color-gain)"
              fillOpacity={0.7}
              cursor="pointer"
              onClick={handleClick}
            />
            <Scatter
              name="Fade"
              data={fadeData}
              fill="var(--color-fade)"
              fillOpacity={0.7}
              cursor="pointer"
              onClick={handleClick}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-gain" /> Gain</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-fade" /> Fade</span>
      </div>
    </div>
  );
}
