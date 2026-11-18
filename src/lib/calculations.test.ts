import { describe, it, expect } from 'vitest';
import {
  analyzePortfolioCostDrivers,
  analyzeProjectCostDrivers,
  calculateCostBreakdown,
  calculatePortfolioCostTotals,
  calculatePortfolioSummary,
  calculateSegmentMetrics,
  portfolioLaborSplit,
  projectBudget,
  projectLaborSplit,
  splitLaborVariance,
  weightedMargin,
} from './calculations';
import { sampleData } from './sampleData';
import { makeProject } from './testFixtures';

const base = { labor: 100_000, hours: 2_000, materials: 50_000, equipment: 20_000, subs: 20_000, other: 10_000 };

describe('budget baseline', () => {
  it('does not count approved change-order cost as overrun', () => {
    // Change order adds $30K of labor and 600 hours. The job then lands exactly on that budget.
    const withCo = { ...base, labor: 130_000, hours: 2_600 };
    const p = makeProject({ originalValue: 250_000, revisedValue: 290_000, original: base, revised: withCo, final: withCo });
    const a = analyzeProjectCostDrivers(p);
    expect(a.budgetSource).toBe('revised');
    expect(a.totalCostVariance).toBe(0);
    expect(a.totalScopeChange).toBe(30_000);
    const labor = a.drivers.find((d) => d.category === 'Labor')!;
    expect(labor.varianceDollars).toBe(0);
    expect(labor.hoursVariance).toBe(0);
    expect(labor.scopeHours).toBe(600);
  });

  it('falls back to the original estimate when a project has no revised estimate', () => {
    const p = makeProject({ originalValue: 250_000, original: base, revised: null, final: { ...base, labor: 120_000, hours: 2_400 } });
    expect(projectBudget(p).source).toBe('original');
    const a = analyzeProjectCostDrivers(p);
    expect(a.budgetLabel).toBe('original estimate');
    expect(a.totalCostVariance).toBe(20_000);
    expect(calculatePortfolioCostTotals([p]).projectsWithoutRevisedBudget).toBe(1);
  });

  it('separates scope change from execution variance in the portfolio totals', () => {
    const t = calculatePortfolioCostTotals(sampleData);
    expect(t.originalCost + t.scopeChange).toBeCloseTo(t.budgetCost, 2);
    expect(t.budgetCost + t.executionVariance).toBeCloseTo(t.finalCost, 2);
    // The bug this replaces reported final minus original as the overrun.
    expect(t.executionVariance).toBeLessThan(t.finalCost - t.originalCost);
    const byCategory = calculateCostBreakdown(sampleData);
    expect(byCategory.reduce((s, c) => s + c.variance, 0)).toBeCloseTo(t.executionVariance, 2);
    expect(byCategory.reduce((s, c) => s + c.scopeChange, 0)).toBeCloseTo(t.scopeChange, 2);
  });
});

describe('diagnosis', () => {
  it('never describes an overrun as a saving, on any sample project', () => {
    for (const p of sampleData) {
      const a = analyzeProjectCostDrivers(p);
      if (/savings|efficiency|fewer hours/.test(a.diagnosis)) {
        expect(a.primaryDriver.varianceDollars, `${p.projectNumber}: ${a.diagnosis}`).toBeLessThan(0);
      }
      if (/primary cost driver|drove the fade|over the/.test(a.diagnosis) && p.overallGainFade === 'Fade' && a.primaryExplainsOutcome) {
        expect(a.primaryDriver.varianceDollars, `${p.projectNumber}: ${a.diagnosis}`).toBeGreaterThan(0);
      }
    }
  });

  it('attributes a gain with cost over budget to change-order pricing, not to savings', () => {
    // Change order worth $60K of revenue for $20K of budgeted cost, then labor runs $5K over.
    const revised = { ...base, labor: 120_000, hours: 2_400 };
    const p = makeProject({ originalValue: 250_000, revisedValue: 310_000, original: base, revised, final: { ...revised, labor: 125_000, hours: 2_500 } });
    expect(p.overallGainFade).toBe('Gain');
    const a = analyzeProjectCostDrivers(p);
    expect(a.primaryExplainsOutcome).toBe(false);
    expect(a.diagnosis).toMatch(/change orders priced above the original margin/);
    expect(a.diagnosis).not.toMatch(/savings/);
  });

  it('does not name a cost driver for a fade that is on budget', () => {
    // Change order adds $20K of cost for only $10K of revenue; the field hits the budget.
    const revised = { ...base, labor: 120_000, hours: 2_400 };
    const p = makeProject({ originalValue: 250_000, revisedValue: 260_000, original: base, revised, final: revised });
    expect(p.overallGainFade).toBe('Fade');
    const a = analyzeProjectCostDrivers(p);
    expect(a.primaryExplainsOutcome).toBe(false);
    expect(a.diagnosis).toMatch(/contract side/);
    const portfolio = analyzePortfolioCostDrivers([p]);
    expect(portfolio.pricingDrivenFadeCount).toBe(1);
    expect(portfolio.fadeDriverPatterns).toHaveLength(0);
  });

  it('calls a labor overrun with flat hours a rate problem', () => {
    const p = makeProject({ originalValue: 250_000, original: base, final: { ...base, labor: 115_000 } });
    expect(analyzeProjectCostDrivers(p).diagnosis).toMatch(/rate \(wages, overtime or crew mix\)/);
  });
});

describe('labor variance split', () => {
  it('adds up to the total variance', () => {
    // Budget: 2,000 hrs at $50. Actual: 2,300 hrs at $52.
    const s = splitLaborVariance(100_000, 2_000, 119_600, 2_300);
    expect(s.hoursEffect).toBeCloseTo(15_000, 6); // 300 extra hours x $50
    expect(s.rateEffect).toBeCloseTo(4_600, 6);   // $2 more per hour x 2,300 hours
    expect(s.hoursEffect + s.rateEffect).toBeCloseTo(s.totalVariance, 6);
  });

  it('adds up on every sample project and across the portfolio', () => {
    for (const p of sampleData) {
      const s = projectLaborSplit(p);
      expect(s.available).toBe(true);
      expect(s.hoursEffect + s.rateEffect).toBeCloseTo(s.totalVariance, 4);
    }
    const total = portfolioLaborSplit(sampleData);
    expect(total.hoursEffect + total.rateEffect).toBeCloseTo(total.totalVariance, 2);
  });

  it('is marked unavailable when hours are missing', () => {
    const s = splitLaborVariance(100_000, 0, 120_000, 0);
    expect(s.available).toBe(false);
    expect(s.totalVariance).toBe(20_000);
  });
});

describe('margin', () => {
  it('is profit over revenue, not the mean of project margins', () => {
    const small = makeProject({ id: 'S', originalValue: 100_000, original: { labor: 30_000, hours: 600, materials: 20_000, equipment: 5_000, subs: 3_000, other: 2_000 }, final: { labor: 30_000, hours: 600, materials: 20_000, equipment: 5_000, subs: 3_000, other: 2_000 } });
    const large = makeProject({ id: 'L', originalValue: 1_000_000, original: { labor: 400_000, hours: 8_000, materials: 300_000, equipment: 100_000, subs: 80_000, other: 20_000 }, final: { labor: 400_000, hours: 8_000, materials: 300_000, equipment: 100_000, subs: 80_000, other: 20_000 } });
    // Small job: 40% margin. Large job: 10% margin. Mean is 25%; the company earned 12.7%.
    expect(weightedMargin([small, large])).toBeCloseTo(140_000 / 1_100_000, 10);
    expect(calculatePortfolioSummary([small, large]).portfolioMargin).toBeCloseTo(140_000 / 1_100_000, 10);
  });

  it('ties to total profit and revenue on the sample portfolio, for the whole and each segment', () => {
    const s = calculatePortfolioSummary(sampleData);
    expect(s.portfolioMargin).toBeCloseTo(s.totalProfit / s.totalRevenue, 10);
    for (const seg of calculateSegmentMetrics(sampleData)) {
      const prjs = sampleData.filter((p) => p.marketSegment === seg.segment);
      const profit = prjs.reduce((a, p) => a + p.finalProfit, 0);
      expect(seg.weightedMargin).toBeCloseTo(profit / seg.totalRevenue, 10);
    }
  });
});
