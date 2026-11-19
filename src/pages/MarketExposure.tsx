import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts';
import { ExternalLink } from 'lucide-react';
import { useProjectData } from '@/hooks/useProjectData';
import {
  DEFAULT_MATERIALS_SERIES, MARKET_SNAPSHOT, MATERIALS_SERIES, WAGE_SERIES,
  getMarketSeries, portfolioMarketExposure,
} from '@/lib/marketExposure';
import type { ProjectMarketExposure } from '@/lib/marketExposure';
import { formatCurrency, formatCurrencyFull, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';

const tooltipStyle = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: 12,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2021-06" to "Jun 2021". */
function monthLabel(month: string): string {
  const [y, m] = month.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

function signedPct(v: number): string {
  return `${v > 0 ? '+' : ''}${formatPercent(v)}`;
}

function signedCurrency(v: number): string {
  return `${v > 0 ? '+' : ''}${formatCurrency(v)}`;
}

/** Links to the series on data.cainmenard.com, tagged so the visit shows where it came from. */
function seriesLink(page: string): string {
  return `${page}?utm_source=project-performance-analysis&utm_medium=referral`;
}

function Tile({ label, value, detail, tone = 'neutral' }: {
  label: string; value: string; detail: string; tone?: 'neutral' | 'fade' | 'gain';
}) {
  return (
    <div className={cn(
      'rounded-xl border bg-card p-4 shadow-sm',
      tone === 'fade' ? 'border-fade/20' : tone === 'gain' ? 'border-gain/20' : 'border-border',
    )}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold', tone === 'fade' && 'text-fade', tone === 'gain' && 'text-gain')}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{detail}</p>
    </div>
  );
}

/** Index move and materials variance by completion year: does the level of variance follow the market? */
function YearChart({ rows }: { rows: ProjectMarketExposure[] }) {
  const data = useMemo(() => {
    const years = [...new Set(rows.map((r) => r.project.yearCompleted))].sort();
    return years.map((year) => {
      const prjs = rows.filter((r) => r.project.yearCompleted === year);
      const budget = prjs.reduce((s, r) => s + r.budgetMaterials, 0);
      return {
        year: String(year),
        jobs: prjs.length,
        // Both weighted by budgeted materials dollars, so a large job counts for more.
        indexChange: budget > 0 ? (prjs.reduce((s, r) => s + r.materialsExposure, 0) / budget) * 100 : 0,
        variance: budget > 0 ? (prjs.reduce((s, r) => s + r.materialsVariance, 0) / budget) * 100 : 0,
      };
    });
  }, [rows]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">By Completion Year: Index Move vs Materials Variance</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        If materials variance rises and falls with the index from year to year, the market is setting the level.
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
            <ReferenceLine y={0} stroke="var(--color-muted-foreground)" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: unknown, name?: string) => [`${Number(value ?? 0) > 0 ? '+' : ''}${Number(value ?? 0).toFixed(1)}%`, name]}
              labelFormatter={(label: unknown, payload: unknown) => {
                const jobs = (payload as { payload?: { jobs?: number } }[] | undefined)?.[0]?.payload?.jobs;
                return jobs ? `Completed ${label} (${jobs} jobs)` : `Completed ${label}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} itemSorter={null} />
            <Bar dataKey="indexChange" name="Index move over the jobs" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="variance" name="Materials variance vs budget" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** One dot per job: index change over the job against the job's own materials variance. */
function JobScatter({ rows, onSelect }: { rows: ProjectMarketExposure[]; onSelect: (projectNumber: string) => void }) {
  const points = rows.filter((r) => r.budgetMaterials > 0).map((r) => ({
    x: r.materials.meanChangePct * 100,
    y: r.materialsVariancePct * 100,
    z: r.budgetMaterials,
    name: r.project.projectName,
    number: r.project.projectNumber,
    fade: r.project.overallGainFade === 'Fade',
  }));
  const all = points.flatMap((p) => [p.x, p.y]);
  const lo = Math.floor(Math.min(0, ...all) / 5) * 5;
  const hi = Math.ceil(Math.max(0, ...all) / 5) * 5;
  // Same ticks on both axes, on round numbers, so the diagonal reads as "equal" at a glance.
  // Steps of 5 points, or 10 once the range is wide enough that 5 would crowd the axis.
  const step = hi - lo > 60 ? 10 : 5;
  const ticks = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Job by Job: Does the Index Explain Who Ran Over?</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Each dot is a job. On the diagonal, materials variance equaled the index move. Below it, prices were held better
        than the market. Above it, the job ran over by more than the market moved, which points at quantity, waste or the takeoff.
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 15, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              type="number" dataKey="x" domain={[lo, hi]} ticks={ticks}
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickFormatter={(v: number) => `${v}%`}
              label={{ value: 'Index change, bid month to job average', position: 'insideBottom', offset: -12, fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            />
            <YAxis
              type="number" dataKey="y" domain={[lo, hi]} ticks={ticks}
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <ZAxis type="number" dataKey="z" range={[40, 320]} />
            <ReferenceLine y={0} stroke="var(--color-muted-foreground)" />
            <ReferenceLine
              segment={[{ x: lo, y: lo }, { x: hi, y: hi }]}
              stroke="var(--color-muted-foreground)" strokeDasharray="4 4"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as (typeof points)[number] | undefined;
                if (!active || !p) return null;
                return (
                  <div style={tooltipStyle} className="p-2">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-muted-foreground">#{p.number}</p>
                    <p>Index change: {p.x > 0 ? '+' : ''}{p.x.toFixed(1)}%</p>
                    <p>Materials variance: {p.y > 0 ? '+' : ''}{p.y.toFixed(1)}%</p>
                    <p>Budgeted materials: {formatCurrencyFull(p.z)}</p>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="top" itemSorter={null} />
            <Scatter name="Gained" data={points.filter((p) => !p.fade)} fill="var(--color-gain)" fillOpacity={0.7}
              onClick={(p: { number?: string }) => p.number && onSelect(p.number)} cursor="pointer" />
            <Scatter name="Faded" data={points.filter((p) => p.fade)} fill="var(--color-fade)" fillOpacity={0.7}
              onClick={(p: { number?: string }) => p.number && onSelect(p.number)} cursor="pointer" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function JobTable({ rows, onSelect }: { rows: ProjectMarketExposure[]; onSelect: (projectNumber: string) => void }) {
  // Largest exposure first: the jobs where the market had the most room to matter.
  const sorted = [...rows].sort((a, b) => Math.abs(b.materialsExposure) - Math.abs(a.materialsExposure));
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Exposure by Job</h3>
      <p className="mb-4 text-xs text-muted-foreground">Sorted by exposure. Click a job for its full cost breakdown.</p>
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border">
              <th className="py-2 text-left font-semibold text-muted-foreground">Project</th>
              <th className="py-2 text-left font-semibold text-muted-foreground">Bid</th>
              <th className="py-2 text-left font-semibold text-muted-foreground">Completed</th>
              <th className="py-2 text-right font-semibold text-muted-foreground">Index change</th>
              <th className="py-2 text-right font-semibold text-muted-foreground">Budgeted materials</th>
              <th className="py-2 text-right font-semibold text-muted-foreground">Exposure</th>
              <th className="py-2 text-right font-semibold text-muted-foreground">Actual variance</th>
              <th className="py-2 text-right font-semibold text-muted-foreground">Variance %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr
                key={r.project.projectNumber}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                onClick={() => onSelect(r.project.projectNumber)}
              >
                <td className="py-2 pr-3">
                  <span className="font-medium">{r.project.projectName}</span>
                  <span className="ml-1.5 text-muted-foreground">#{r.project.projectNumber}</span>
                </td>
                <td className="py-2 text-muted-foreground whitespace-nowrap">{monthLabel(r.materials.bidMonth)}</td>
                <td className="py-2 text-muted-foreground whitespace-nowrap">
                  {monthLabel(r.materials.endMonth)}{r.materials.truncated && '*'}
                </td>
                <td className="py-2 text-right">{signedPct(r.materials.meanChangePct)}</td>
                <td className="py-2 text-right text-muted-foreground">{formatCurrencyFull(r.budgetMaterials)}</td>
                <td className="py-2 text-right">{r.materialsExposure > 0 ? '+' : ''}{formatCurrencyFull(Math.round(r.materialsExposure))}</td>
                <td className={cn('py-2 text-right font-medium', r.materialsVariance > 0 ? 'text-fade' : r.materialsVariance < 0 ? 'text-gain' : '')}>
                  {r.materialsVariance > 0 ? '+' : ''}{formatCurrencyFull(r.materialsVariance)}
                </td>
                <td className={cn('py-2 text-right', r.materialsVariancePct > 0 ? 'text-fade' : r.materialsVariancePct < 0 ? 'text-gain' : '')}>
                  {signedPct(r.materialsVariancePct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MarketExposure() {
  const { filteredProjects } = useProjectData();
  const navigate = useNavigate();
  const [seriesKey, setSeriesKey] = useState(DEFAULT_MATERIALS_SERIES);

  const market = useMemo(() => portfolioMarketExposure(filteredProjects, seriesKey), [filteredProjects, seriesKey]);
  const series = getMarketSeries(seriesKey);
  const wages = getMarketSeries(WAGE_SERIES);
  const openProject = (projectNumber: string) => navigate(`/project/${encodeURIComponent(projectNumber)}`);
  const snapshotDate = MARKET_SNAPSHOT.generatedAt.slice(0, 10);

  if (!series) return null;

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Market Exposure</h2>
        <p className="text-sm text-muted-foreground">
          How far a price index moved over each job, next to what the job's materials cost actually did.
        </p>
      </div>
      <label className="text-xs text-muted-foreground">
        Materials index
        <select
          value={seriesKey}
          onChange={(e) => setSeriesKey(e.target.value)}
          className="ml-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground"
        >
          {MATERIALS_SERIES.map((s) => (
            <option key={s.key} value={s.key}>{s.title}</option>
          ))}
        </select>
      </label>
    </div>
  );

  if (market.projectsWithDates === 0) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">No jobs with a bid date and a completion date</h3>
          <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground leading-relaxed">
            This page measures an index from the month a job was bid to the month it finished, so it needs both dates.
            Add "Bid Date" and "Completion Date" columns to the file (YYYY-MM-DD or M/D/YYYY). The index history
            runs from {monthLabel(series.firstMonth)} to {monthLabel(series.lastMonth)}; jobs bid outside that range are left out.
          </p>
        </div>
      </div>
    );
  }

  const overExposure = market.materialsExposure > 0;

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Index move over the jobs"
          value={signedPct(market.weightedIndexChangePct)}
          detail={`${series.title}, from each job's bid month to its average month, weighted by budgeted materials`}
        />
        <Tile
          label="Materials exposure estimate"
          value={signedCurrency(market.materialsExposure)}
          detail={`What ${formatCurrency(market.budgetMaterials)} of budgeted materials would have cost ${overExposure ? 'extra' : 'less'} if bought evenly over each job at index prices, with nothing locked at bid`}
        />
        <Tile
          label="Actual materials variance"
          value={signedCurrency(market.materialsVariance)}
          tone={market.materialsVariance > 0 ? 'fade' : market.materialsVariance < 0 ? 'gain' : 'neutral'}
          detail={`${signedPct(market.budgetMaterials > 0 ? market.materialsVariance / market.budgetMaterials : 0)} against budget on the same ${market.projectsWithDates} jobs. Includes price, quantity and waste.`}
        />
        {market.projectsWithLabor > 0 && wages ? (
          <Tile
            label="Labor rate effect vs wage drift"
            value={`${signedCurrency(market.rateEffect)} vs ${signedCurrency(market.wageDrift)}`}
            detail="Rate effect from the hours and rate split, next to what it would be had pay moved with BLS average hourly earnings in construction and the bid carried no raises"
          />
        ) : (
          <Tile label="Labor rate effect vs wage drift" value="n/a" detail="Needs labor hours on the same jobs" />
        )}
      </div>

      {market.fit && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed">
          Across {market.fit.n} jobs, materials variance moved{' '}
          <span className="font-semibold">{market.fit.slope.toFixed(2)} points for each point of index change</span>,
          and the index move lines up with{' '}
          <span className="font-semibold">{formatPercent(market.fit.rSquared)}</span> of the job-to-job spread in materials variance.
          <span className="text-muted-foreground">
            {' '}A high share means the market explains who ran over. A low share means the overruns sit with particular jobs,
            whatever the market did. This is a correlation across jobs and says nothing certain about any one of them.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <YearChart rows={market.rows} />
        <JobScatter rows={market.rows} onSelect={openProject} />
      </div>

      <JobTable rows={market.rows} onSelect={openProject} />

      <div className="rounded-xl border border-border bg-card p-5 text-xs leading-relaxed text-muted-foreground shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-foreground">How to read this, and what it cannot tell you</h3>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>
            <span className="font-medium text-foreground">Exposure is an estimate, not a cause.</span>{' '}
            It assumes materials were bought evenly from bid to completion at index prices. A job that locked its quotes
            at bid felt none of the move. A job that bought late felt more than the average.
          </li>
          <li>
            <span className="font-medium text-foreground">The index is what producers charged, nationally.</span>{' '}
            A BLS Producer Price Index tracks the average selling price domestic producers received. It is not a regional
            price and not what any one contractor paid; a buyer's price also carries sales tax and distribution costs.
          </li>
          <li>
            <span className="font-medium text-foreground">The wage series is earnings, not a wage rate.</span>{' '}
            BLS average hourly earnings is gross pay divided by hours paid, so it also moves with overtime and with who is on the payroll.
          </li>
          <li>
            <span className="font-medium text-foreground">Budget is the revised estimate.</span>{' '}
            Change-order materials were priced when the change order was written, later than the bid month, so exposure
            on those dollars is somewhat overstated.
          </li>
          {market.projectsWithDates < market.projectCount && (
            <li>
              {market.projectCount - market.projectsWithDates} of {market.projectCount} jobs are left out: no usable bid and
              completion dates, or a bid month outside the index history.
            </li>
          )}
          {market.truncatedCount > 0 && (
            <li>
              * {market.truncatedCount} {market.truncatedCount === 1 ? 'job ran' : 'jobs ran'} past {monthLabel(series.lastMonth)},
              the last published month, so the window stops there.
            </li>
          )}
        </ul>
        <p className="mt-3">
          {series.credit} (series {series.sourceId}).{' '}
          {wages && <>Wages: {wages.credit} (series {wages.sourceId}). </>}
          Values as of {snapshotDate}, copied without change from{' '}
          <a href={seriesLink(series.page)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            data.cainmenard.com <ExternalLink className="h-3 w-3" />
          </a>
          , where the full series and its revisions are charted.
        </p>
      </div>
    </div>
  );
}
