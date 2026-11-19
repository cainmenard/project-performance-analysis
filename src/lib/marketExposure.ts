import snapshot from '../data/marketIndices.json';
import type { ProjectRecord } from './types';
import { projectBudget, projectLaborSplit } from './calculations';

// ============================================================
// MARKET EXPOSURE
//
// Question this answers: over the months a job ran, how far did the price of what it buys
// move, and how does the job's own variance compare to that move?
//
// What it is not: a measure of what this contractor paid. The indexes are national
// averages of what domestic producers charged. A job that locked a quote at bid never
// felt the move; a job that bought late felt all of it. The output is an exposure
// estimate to hold next to the actual variance, never a cause.
// ============================================================

interface SnapshotSeries {
  role: string;
  title: string;
  units: string;
  seasonal: string;
  source_id: string;
  source_url: string;
  credit: string;
  page: string;
  observations: [string, number][];
}

export interface MarketSeries {
  key: string;
  role: 'materials' | 'wages';
  title: string;
  units: string;
  sourceId: string;
  sourceUrl: string;
  credit: string;
  /** The series page on data.cainmenard.com. */
  page: string;
  firstMonth: string;
  lastMonth: string;
  byMonth: Map<string, number>;
}

const RAW = snapshot as unknown as {
  source: string;
  generated_at: string;
  launch_date: string;
  history_note: string;
  series: Record<string, SnapshotSeries>;
};

export const MARKET_SNAPSHOT = {
  source: RAW.source,
  generatedAt: RAW.generated_at,
  historyNote: RAW.history_note,
};

const SERIES = new Map<string, MarketSeries>(
  Object.entries(RAW.series).map(([key, s]) => [key, {
    key,
    role: s.role === 'wages' ? 'wages' : 'materials',
    title: s.title,
    units: s.units,
    sourceId: s.source_id,
    sourceUrl: s.source_url,
    credit: s.credit,
    page: s.page,
    firstMonth: s.observations[0][0],
    lastMonth: s.observations[s.observations.length - 1][0],
    byMonth: new Map(s.observations),
  }]),
);

/** Materials price indexes the user can pick from, in snapshot order. */
export const MATERIALS_SERIES: MarketSeries[] = [...SERIES.values()].filter((s) => s.role === 'materials');

/**
 * Default materials index: BLS's construction materials special index (WPUSI012011), a
 * broad basket. It is the safest default for a file that mixes trades; a mechanical or
 * electrical contractor will get a closer read from copper or steel, which is why the
 * page lets the user switch.
 */
export const DEFAULT_MATERIALS_SERIES = 'ppi_construction_materials';

/** Wage series: BLS average hourly earnings of all employees in construction (CES2000000003). */
export const WAGE_SERIES = 'construction_ahe';

export function getMarketSeries(key: string): MarketSeries | undefined {
  return SERIES.get(key);
}

/** "2021-06-15" or "2021-06" to "2021-06". Null when the text is not a usable date. */
export function monthKey(date: string | undefined): string | null {
  if (!date) return null;
  const m = /^(\d{4})-(\d{2})/.exec(date);
  if (!m) return null;
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? `${m[1]}-${m[2]}` : null;
}

/** Every month from start to end, both included. Empty when end is before start. */
export function monthsBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let [y, m] = start.split('-').map(Number);
  const [endY, endM] = end.split('-').map(Number);
  while (y < endY || (y === endY && m <= endM)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

export interface WindowChange {
  seriesKey: string;
  bidMonth: string;
  /** Last month used. Earlier than the completion month when the series ends first. */
  endMonth: string;
  /** Months in the window that have a published value. */
  monthsUsed: number;
  bidValue: number;
  /** Mean of the index over the window. */
  meanValue: number;
  endValue: number;
  /** meanValue / bidValue - 1. The move a buyer spending evenly over the job would have met. */
  meanChangePct: number;
  /** endValue / bidValue - 1. The move a buyer who bought everything in the last month would have met. */
  endChangePct: number;
  /** True when the job ran past the last published month, so the window was cut short. */
  truncated: boolean;
}

/**
 * How an index moved over a job, from the bid month to the completion month.
 *
 * Why the mean over the window and not the end value: the app has no buyout dates, so it
 * assumes purchases were spread evenly from bid to completion. A buyer on that schedule
 * pays the average price over the window. The end-of-job change is kept alongside as the
 * upper bound (everything bought in the last month).
 *
 * Returns null when either date is missing, the dates are out of order, or the series has
 * no value for the bid month (the base of every ratio here).
 */
export function indexWindowChange(
  seriesKey: string,
  bidDate: string | undefined,
  completionDate: string | undefined,
): WindowChange | null {
  const series = SERIES.get(seriesKey);
  const bidMonth = monthKey(bidDate);
  const completionMonth = monthKey(completionDate);
  if (!series || !bidMonth || !completionMonth || completionMonth < bidMonth) return null;

  const bidValue = series.byMonth.get(bidMonth);
  if (bidValue === undefined || bidValue <= 0) return null;

  // A series can have a gap (BLS did not publish a month). Missing months are left out of
  // the mean and are never filled in or interpolated.
  const values: [string, number][] = [];
  for (const month of monthsBetween(bidMonth, completionMonth)) {
    const v = series.byMonth.get(month);
    if (v !== undefined) values.push([month, v]);
  }
  const [endMonth, endValue] = values[values.length - 1];
  const meanValue = values.reduce((s, [, v]) => s + v, 0) / values.length;

  return {
    seriesKey,
    bidMonth,
    endMonth,
    monthsUsed: values.length,
    bidValue,
    meanValue,
    endValue,
    meanChangePct: meanValue / bidValue - 1,
    endChangePct: endValue / bidValue - 1,
    truncated: completionMonth > series.lastMonth,
  };
}

export interface ProjectMarketExposure {
  project: ProjectRecord;
  materials: WindowChange;
  budgetMaterials: number;
  /** Final materials cost minus budget: what the job actually ran over or under. */
  materialsVariance: number;
  materialsVariancePct: number;
  /**
   * Budgeted materials times the mean index change over the job. What the same materials
   * would have cost extra (or less) if bought evenly over the job at index prices with
   * nothing locked at bid.
   */
  materialsExposure: number;
  wages: WindowChange | null;
  /** Labor rate effect from the hours and rate split. Null when the job has no hours. */
  rateEffect: number | null;
  /**
   * Budgeted rate times the mean wage-index change, on the hours worked: the rate effect
   * the job would show if its wages had moved with the national construction average and
   * the bid carried no allowance for raises.
   */
  wageDrift: number | null;
}

export function projectMarketExposure(p: ProjectRecord, materialsSeriesKey: string): ProjectMarketExposure | null {
  const materials = indexWindowChange(materialsSeriesKey, p.bidDate, p.completionDate);
  if (!materials) return null;

  const budget = projectBudget(p);
  const budgetMaterials = budget.costs.Materials;
  const materialsVariance = p.finalMaterials - budgetMaterials;

  const wages = indexWindowChange(WAGE_SERIES, p.bidDate, p.completionDate);
  const labor = projectLaborSplit(p);
  const hasLabor = labor.available && wages !== null;

  return {
    project: p,
    materials,
    budgetMaterials,
    materialsVariance,
    materialsVariancePct: budgetMaterials > 0 ? materialsVariance / budgetMaterials : 0,
    materialsExposure: budgetMaterials * materials.meanChangePct,
    wages,
    rateEffect: hasLabor ? labor.rateEffect : null,
    wageDrift: hasLabor ? labor.budgetRate * wages.meanChangePct * labor.actualHours : null,
  };
}

export interface PortfolioMarketExposure {
  rows: ProjectMarketExposure[];
  projectCount: number;
  /** Projects with usable bid and completion dates inside the index history. */
  projectsWithDates: number;
  budgetMaterials: number;
  materialsVariance: number;
  materialsExposure: number;
  /** Exposure over budget: the index move weighted by each job's materials dollars. */
  weightedIndexChangePct: number;
  rateEffect: number;
  wageDrift: number;
  /** Jobs included in the two labor totals. */
  projectsWithLabor: number;
  /** Jobs whose window was cut short because they ran past the last published month. */
  truncatedCount: number;
  fit: MarketFit | null;
}

export interface MarketFit {
  /** Points of materials variance per point of index change, across jobs. */
  slope: number;
  /** Share of the job-to-job spread in materials variance that the index move lines up with. */
  rSquared: number;
  n: number;
}

/**
 * Least-squares line of materials variance (%) on index change (%), one point per job.
 *
 * Why it is here: the slope reads as a pass-through rate. A slope near 1 means variance
 * tracked the index point for point (little was locked). Near 0 means the jobs were
 * insulated. It is a correlation across jobs and says nothing about any one of them.
 *
 * Why the floor of 8 jobs: below that a line through the points is noise, and a tidy
 * number on screen would suggest precision that is not there.
 */
export function fitMarketLine(rows: ProjectMarketExposure[]): MarketFit | null {
  const pts = rows.filter((r) => r.budgetMaterials > 0).map((r) => [r.materials.meanChangePct, r.materialsVariancePct]);
  const n = pts.length;
  if (n < 8) return null;
  const meanX = pts.reduce((s, [x]) => s + x, 0) / n;
  const meanY = pts.reduce((s, [, y]) => s + y, 0) / n;
  const sxx = pts.reduce((s, [x]) => s + (x - meanX) ** 2, 0);
  const syy = pts.reduce((s, [, y]) => s + (y - meanY) ** 2, 0);
  const sxy = pts.reduce((s, [x, y]) => s + (x - meanX) * (y - meanY), 0);
  // No spread in the index change (every job ran over the same months) or in the variance
  // means there is no line to fit. The test is "smaller than 1e-12", not "equal to zero",
  // because identical inputs still leave a float residue around 1e-33 that would otherwise
  // produce a slope out of rounding noise. Real spreads here are fractions squared (a
  // tenth of a point across 8 jobs is about 1e-5), far above the cutoff.
  if (sxx < 1e-12 || syy < 1e-12) return null;
  return { slope: sxy / sxx, rSquared: (sxy * sxy) / (sxx * syy), n };
}

export function portfolioMarketExposure(projects: ProjectRecord[], materialsSeriesKey: string): PortfolioMarketExposure {
  const rows = projects
    .map((p) => projectMarketExposure(p, materialsSeriesKey))
    .filter((r): r is ProjectMarketExposure => r !== null);
  const withLabor = rows.filter((r) => r.rateEffect !== null && r.wageDrift !== null);
  const budgetMaterials = rows.reduce((s, r) => s + r.budgetMaterials, 0);
  const materialsExposure = rows.reduce((s, r) => s + r.materialsExposure, 0);

  return {
    rows,
    projectCount: projects.length,
    projectsWithDates: rows.length,
    budgetMaterials,
    materialsVariance: rows.reduce((s, r) => s + r.materialsVariance, 0),
    materialsExposure,
    weightedIndexChangePct: budgetMaterials > 0 ? materialsExposure / budgetMaterials : 0,
    rateEffect: withLabor.reduce((s, r) => s + (r.rateEffect ?? 0), 0),
    wageDrift: withLabor.reduce((s, r) => s + (r.wageDrift ?? 0), 0),
    projectsWithLabor: withLabor.length,
    truncatedCount: rows.filter((r) => r.materials.truncated).length,
    fit: fitMarketLine(rows),
  };
}
