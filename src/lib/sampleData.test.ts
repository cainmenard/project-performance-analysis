import { describe, it, expect } from 'vitest';
import { sampleData } from './sampleData';
import { calculatePortfolioCostTotals, calculatePortfolioSummary, portfolioLaborSplit } from './calculations';

// Real firms that must not appear in synthetic data. The sample portfolio pairs each customer
// with invented fade results, so a real name here would publish made-up performance about a
// real company. This list is the names the file used before; add to it if another slips in.
const REAL_FIRM_TOKENS = [
  'Turner', 'Whiting', 'Webcor', 'Swinerton', 'Suffolk', 'Skanska', 'Sletten', 'McCarthy',
  'Lincoln Property', 'Holder', 'Hines', 'Hensel', 'Phelps', 'Greystar', 'DPR', 'Clark',
];

describe('sample data', () => {
  it('uses no real contractor or developer names', () => {
    for (const p of sampleData) {
      for (const token of REAL_FIRM_TOKENS) {
        expect(p.customerName, `${p.projectNumber} customer`).not.toContain(token);
      }
    }
  });

  it('foots on every project', () => {
    for (const p of sampleData) {
      const original = p.originalEstimatedLabor + p.originalEstimatedMaterials + p.originalEstimatedEquipment + p.originalEstimatedSubcontracts + p.originalEstimatedOther;
      const final = p.finalLabor + p.finalMaterials + p.finalEquipment + p.finalSubcontracts + p.finalOther;
      expect(p.originalEstimatedCost).toBeCloseTo(original, 2);
      expect(p.finalCost).toBeCloseTo(final, 2);
      expect(p.finalProfit).toBeCloseTo(p.finalContractValue - p.finalCost, 2);
      expect(p.gainFadeOrgFinalDollars).toBeCloseTo(p.finalProfit - p.originalEstimatedProfit, 2);
    }
  });

  it('gives every project a bid date before its completion date, in its completion year', () => {
    for (const p of sampleData) {
      expect(p.bidDate, p.projectNumber).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.completionDate, p.projectNumber).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.bidDate! < p.completionDate!, p.projectNumber).toBe(true);
      expect(Number(p.completionDate!.slice(0, 4)), p.projectNumber).toBe(p.yearCompleted);
    }
  });

  it('still supports every sentence on the landing page', () => {
    // The landing page builds its three findings from this data and words them with a
    // fixed direction ("ran over", "overstates"). If a change to the sample data flips
    // one of these, the copy would be false, so the build fails here first.
    const cost = calculatePortfolioCostTotals(sampleData);
    const labor = portfolioLaborSplit(sampleData);
    const summary = calculatePortfolioSummary(sampleData);
    const meanMargin = sampleData.reduce((s, p) => s + p.finalGrossProfitMargin, 0) / sampleData.length;
    expect(cost.scopeChange).toBeGreaterThan(0);
    expect(cost.executionVariance).toBeGreaterThan(0);
    expect(cost.finalCost - cost.originalCost).toBeGreaterThan(cost.executionVariance);
    expect(labor.totalVariance).toBeGreaterThan(0);
    expect(labor.hoursEffect).toBeGreaterThan(labor.rateEffect);
    expect(labor.rateEffect).toBeGreaterThan(0);
    expect(meanMargin).toBeGreaterThan(summary.portfolioMargin);
  });

  it('has unique project numbers', () => {
    expect(new Set(sampleData.map((p) => p.projectNumber)).size).toBe(sampleData.length);
  });
});
