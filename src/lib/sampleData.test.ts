import { describe, it, expect } from 'vitest';
import { sampleData } from './sampleData';

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

  it('has unique project numbers', () => {
    expect(new Set(sampleData.map((p) => p.projectNumber)).size).toBe(sampleData.length);
  });
});
