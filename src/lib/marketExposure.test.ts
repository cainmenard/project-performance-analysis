import { describe, it, expect } from 'vitest';
import snapshot from '../data/marketIndices.json';
import {
  DEFAULT_MATERIALS_SERIES, MATERIALS_SERIES, WAGE_SERIES, fitMarketLine, getMarketSeries,
  indexWindowChange, monthKey, monthsBetween, portfolioMarketExposure, projectMarketExposure,
} from './marketExposure';
import { sampleData } from './sampleData';
import { makeProject } from './testFixtures';

type Obs = [string, number][];
const raw = snapshot as unknown as { generated_at: string; series: Record<string, { observations: Obs; credit: string; source_id: string }> };
const materials = new Map(raw.series[DEFAULT_MATERIALS_SERIES].observations);

describe('index snapshot', () => {
  it('has every series the app uses, each with a credit line and source ID', () => {
    expect(getMarketSeries(DEFAULT_MATERIALS_SERIES)).toBeDefined();
    expect(getMarketSeries(WAGE_SERIES)).toBeDefined();
    expect(MATERIALS_SERIES.length).toBeGreaterThanOrEqual(5);
    for (const s of Object.values(raw.series)) {
      expect(s.credit).toMatch(/Bureau of Labor Statistics/);
      expect(s.source_id.length).toBeGreaterThan(0);
    }
    expect(raw.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('holds months in order with finite positive values and no duplicates', () => {
    for (const [key, s] of Object.entries(raw.series)) {
      const months = s.observations.map(([m]) => m);
      expect([...months].sort(), key).toEqual(months);
      expect(new Set(months).size, key).toBe(months.length);
      for (const [month, value] of s.observations) {
        expect(month, key).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
        expect(Number.isFinite(value) && value > 0, `${key} ${month}`).toBe(true);
      }
    }
  });
});

describe('month helpers', () => {
  it('reads a month from a date and rejects junk', () => {
    expect(monthKey('2021-06-15')).toBe('2021-06');
    expect(monthKey('2021-06')).toBe('2021-06');
    expect(monthKey('2021-13-01')).toBeNull();
    expect(monthKey('June 2021')).toBeNull();
    expect(monthKey(undefined)).toBeNull();
  });

  it('lists months across a year boundary, both ends included', () => {
    expect(monthsBetween('2021-11', '2022-02')).toEqual(['2021-11', '2021-12', '2022-01', '2022-02']);
    expect(monthsBetween('2022-02', '2021-11')).toEqual([]);
  });
});

describe('index change over a job', () => {
  it('is the mean of the window over the bid-month value', () => {
    const w = indexWindowChange(DEFAULT_MATERIALS_SERIES, '2021-01-20', '2021-03-05')!;
    const [a, b, c] = ['2021-01', '2021-02', '2021-03'].map((m) => materials.get(m)!);
    expect(w.bidValue).toBe(a);
    expect(w.endValue).toBe(c);
    expect(w.monthsUsed).toBe(3);
    expect(w.meanChangePct).toBeCloseTo((a + b + c) / 3 / a - 1, 12);
    expect(w.endChangePct).toBeCloseTo(c / a - 1, 12);
    expect(w.truncated).toBe(false);
  });

  it('is zero for a job bid and finished in the same month', () => {
    expect(indexWindowChange(DEFAULT_MATERIALS_SERIES, '2022-05-01', '2022-05-28')!.meanChangePct).toBe(0);
  });

  it('returns null without both dates, with dates out of order, or before the history starts', () => {
    expect(indexWindowChange(DEFAULT_MATERIALS_SERIES, undefined, '2022-05-01')).toBeNull();
    expect(indexWindowChange(DEFAULT_MATERIALS_SERIES, '2022-05-01', undefined)).toBeNull();
    expect(indexWindowChange(DEFAULT_MATERIALS_SERIES, '2022-05-01', '2022-01-01')).toBeNull();
    expect(indexWindowChange(DEFAULT_MATERIALS_SERIES, '1999-01-01', '2000-01-01')).toBeNull();
    expect(indexWindowChange('no_such_series', '2021-01-01', '2021-06-01')).toBeNull();
  });

  it('stops at the last published month and says so when a job runs past it', () => {
    const last = getMarketSeries(DEFAULT_MATERIALS_SERIES)!.lastMonth;
    const w = indexWindowChange(DEFAULT_MATERIALS_SERIES, `${last}-01`, '2099-01-01')!;
    expect(w.endMonth).toBe(last);
    expect(w.truncated).toBe(true);
    expect(w.monthsUsed).toBe(1);
  });
});

describe('project and portfolio exposure', () => {
  const costs = { labor: 100_000, hours: 2_000, materials: 50_000, equipment: 20_000, subs: 20_000, other: 10_000 };

  it('is budgeted materials times the index change, next to the actual variance', () => {
    const p = { ...makeProject({ originalValue: 250_000, original: costs, final: { ...costs, materials: 56_000 } }), bidDate: '2021-01-01', completionDate: '2021-12-01' };
    const e = projectMarketExposure(p, DEFAULT_MATERIALS_SERIES)!;
    const w = indexWindowChange(DEFAULT_MATERIALS_SERIES, p.bidDate, p.completionDate)!;
    expect(e.budgetMaterials).toBe(50_000);
    expect(e.materialsVariance).toBe(6_000);
    expect(e.materialsExposure).toBeCloseTo(50_000 * w.meanChangePct, 6);
    // Wage drift: budget rate ($50/hr) x wage index change x hours worked.
    const wages = indexWindowChange(WAGE_SERIES, p.bidDate, p.completionDate)!;
    expect(e.wageDrift).toBeCloseTo(50 * wages.meanChangePct * 2_000, 6);
    expect(e.rateEffect).toBe(0);
  });

  it('leaves out jobs with no dates and counts them', () => {
    const dated = { ...makeProject({ id: 'A', originalValue: 250_000, original: costs, final: costs }), bidDate: '2021-01-01', completionDate: '2021-12-01' };
    const undated = makeProject({ id: 'B', originalValue: 250_000, original: costs, final: costs });
    expect(projectMarketExposure(undated, DEFAULT_MATERIALS_SERIES)).toBeNull();
    const m = portfolioMarketExposure([dated, undated], DEFAULT_MATERIALS_SERIES);
    expect(m.projectCount).toBe(2);
    expect(m.projectsWithDates).toBe(1);
    expect(m.fit).toBeNull(); // fewer than 8 jobs: no line is fitted
  });

  it('covers every sample project and its totals add up from the rows', () => {
    const m = portfolioMarketExposure(sampleData, DEFAULT_MATERIALS_SERIES);
    expect(m.projectsWithDates).toBe(sampleData.length);
    expect(m.truncatedCount).toBe(0);
    expect(m.materialsExposure).toBeCloseTo(m.rows.reduce((s, r) => s + r.materialsExposure, 0), 4);
    expect(m.weightedIndexChangePct).toBeCloseTo(m.materialsExposure / m.budgetMaterials, 12);
    expect(m.fit).not.toBeNull();
  });
});

describe('fit across jobs', () => {
  const row = (x: number, y: number) => ({ budgetMaterials: 1, materials: { meanChangePct: x }, materialsVariancePct: y }) as never;

  it('recovers a known pass-through rate', () => {
    // Variance is exactly 0.3 x index change plus 1 point: slope 0.3, perfect fit.
    const rows = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35].map((x) => row(x, 0.3 * x + 0.01));
    const fit = fitMarketLine(rows)!;
    expect(fit.slope).toBeCloseTo(0.3, 10);
    expect(fit.rSquared).toBeCloseTo(1, 10);
    expect(fit.n).toBe(8);
  });

  it('declines to fit fewer than 8 jobs or jobs that all saw the same index move', () => {
    expect(fitMarketLine([row(0.1, 0.02), row(0.2, 0.05)])).toBeNull();
    expect(fitMarketLine(Array.from({ length: 10 }, (_, i) => row(0.1, i / 100)))).toBeNull();
  });
});
