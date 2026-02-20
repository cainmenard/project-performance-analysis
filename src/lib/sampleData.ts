import type { ProjectRecord } from './types';

// Builder function to ensure all math is consistent across each record
function buildProject(p: {
  id: string;
  name: string;
  customer: string;
  division: 'Commercial' | 'Healthcare' | 'Residential';
  segment: string;
  year: number;
  pm: string;
  estimator: string;
  origValue: number;
  origCostBreakdown: { labor: number; laborHours: number; materials: number; equipment: number; subs: number; other: number };
  changeOrderDelta: number; // net change to contract value
  revCostBreakdown: { labor: number; laborHours: number; materials: number; equipment: number; subs: number; other: number };
  finalCostBreakdown: { labor: number; laborHours: number; materials: number; equipment: number; subs: number; other: number };
  finalContractAdj?: number; // if final contract differs from revised (rare)
}): ProjectRecord {
  const origCost = p.origCostBreakdown.labor + p.origCostBreakdown.materials + p.origCostBreakdown.equipment + p.origCostBreakdown.subs + p.origCostBreakdown.other;
  const revValue = p.origValue + p.changeOrderDelta;
  const revCost = p.revCostBreakdown.labor + p.revCostBreakdown.materials + p.revCostBreakdown.equipment + p.revCostBreakdown.subs + p.revCostBreakdown.other;
  const finalValue = p.finalContractAdj !== undefined ? p.finalContractAdj : revValue;
  const finalCost = p.finalCostBreakdown.labor + p.finalCostBreakdown.materials + p.finalCostBreakdown.equipment + p.finalCostBreakdown.subs + p.finalCostBreakdown.other;

  const origProfit = p.origValue - origCost;
  const origMargin = p.origValue > 0 ? origProfit / p.origValue : 0;
  const revProfit = revValue - revCost;
  const revMargin = revValue > 0 ? revProfit / revValue : 0;
  const finalProfit = finalValue - finalCost;
  const finalMargin = finalValue > 0 ? finalProfit / finalValue : 0;

  const gfDollars = finalProfit - origProfit;
  const gfPctOrgFinal = finalMargin - origMargin;
  const gfPctRevFinal = finalMargin - revMargin;

  return {
    customerName: p.customer,
    division: p.division,
    projectName: p.name,
    projectNumber: p.id,
    yearCompleted: p.year,
    marketSegment: p.segment,
    projectManager: p.pm,
    estimator: p.estimator,
    originalContractValue: Math.round(p.origValue),
    revisedContractValue: Math.round(revValue),
    finalContractValue: Math.round(finalValue),
    finalCost: Math.round(finalCost * 100) / 100,
    finalLabor: Math.round(p.finalCostBreakdown.labor * 100) / 100,
    finalLaborHours: Math.round(p.finalCostBreakdown.laborHours),
    finalMaterials: Math.round(p.finalCostBreakdown.materials * 100) / 100,
    finalEquipment: Math.round(p.finalCostBreakdown.equipment * 100) / 100,
    finalSubcontracts: Math.round(p.finalCostBreakdown.subs * 100) / 100,
    finalOther: Math.round(p.finalCostBreakdown.other * 100) / 100,
    originalEstimatedCost: Math.round(origCost * 100) / 100,
    originalEstimatedLabor: Math.round(p.origCostBreakdown.labor * 100) / 100,
    originalEstimatedLaborHours: Math.round(p.origCostBreakdown.laborHours),
    originalEstimatedMaterials: Math.round(p.origCostBreakdown.materials * 100) / 100,
    originalEstimatedEquipment: Math.round(p.origCostBreakdown.equipment * 100) / 100,
    originalEstimatedSubcontracts: Math.round(p.origCostBreakdown.subs * 100) / 100,
    originalEstimatedOther: Math.round(p.origCostBreakdown.other * 100) / 100,
    revisedEstimatedCost: Math.round(revCost * 100) / 100,
    revisedEstimatedLabor: Math.round(p.revCostBreakdown.labor * 100) / 100,
    revisedEstimatedLaborHours: Math.round(p.revCostBreakdown.laborHours),
    revisedEstimatedMaterials: Math.round(p.revCostBreakdown.materials * 100) / 100,
    revisedEstimatedEquipment: Math.round(p.revCostBreakdown.equipment * 100) / 100,
    revisedEstimatedSubcontracts: Math.round(p.revCostBreakdown.subs * 100) / 100,
    revisedEstimatedOther: Math.round(p.revCostBreakdown.other * 100) / 100,
    originalEstimatedProfit: Math.round(origProfit * 100) / 100,
    originalEstimatedProfitMargin: Math.round(origMargin * 10000) / 10000,
    revisedEstimatedProfit: Math.round(revProfit * 100) / 100,
    revisedEstimatedProfitMargin: Math.round(revMargin * 10000) / 10000,
    finalProfit: Math.round(finalProfit * 100) / 100,
    finalGrossProfitMargin: Math.round(finalMargin * 10000) / 10000,
    gainFadeOrgFinalDollars: Math.round(gfDollars * 100) / 100,
    gainFadeOrgFinalPercent: Math.round(gfPctOrgFinal * 10000) / 10000,
    gainFadeRevFinalPercent: Math.round(gfPctRevFinal * 10000) / 10000,
    overallGainFade: gfDollars >= 0 ? 'Gain' : 'Fade',
  };
}

export const sampleData: ProjectRecord[] = [
  // ============================================================
  // 2022 PROJECTS (16 projects)
  // ============================================================

  // 1. Large healthcare project - FADE (labor overrun on regulated work)
  buildProject({
    id: '22-001', name: 'Memorial Hospital Central Plant Upgrade', customer: 'Turner Construction',
    division: 'Healthcare', segment: 'Healthcare', year: 2022, pm: 'Mike Rodriguez', estimator: 'Jim Crawford', origValue: 4200000, changeOrderDelta: 380000,
    origCostBreakdown: { labor: 1092000, laborHours: 14560, materials: 546000, equipment: 1050000, subs: 630000, other: 126000 },
    revCostBreakdown: { labor: 1248000, laborHours: 16640, materials: 598000, equipment: 1092000, subs: 682000, other: 138000 },
    finalCostBreakdown: { labor: 1485000, laborHours: 19200, materials: 632000, equipment: 1102000, subs: 695000, other: 152000 },
  }),

  // 2. Data center - GAIN (well-estimated, efficient execution)
  buildProject({
    id: '22-002', name: 'TechVault Data Center Phase 1', customer: 'DPR Construction',
    division: 'Commercial', segment: 'Data Center', year: 2022, pm: 'Sarah Chen', estimator: 'Lisa Martinez', origValue: 8500000, changeOrderDelta: 450000,
    origCostBreakdown: { labor: 2210000, laborHours: 28050, materials: 1445000, equipment: 2125000, subs: 1020000, other: 255000 },
    revCostBreakdown: { labor: 2340000, laborHours: 29700, materials: 1520000, equipment: 2200000, subs: 1100000, other: 268000 },
    finalCostBreakdown: { labor: 2280000, laborHours: 28900, materials: 1490000, equipment: 2180000, subs: 1080000, other: 258000 },
  }),

  // 3. K-12 school HVAC - GAIN (straightforward scope)
  buildProject({
    id: '22-003', name: 'Lincoln Elementary HVAC Modernization', customer: 'Hensel Phelps',
    division: 'Commercial', segment: 'K-12 Education', year: 2022, pm: 'Dave Morrison', estimator: 'Karen Wright', origValue: 620000, changeOrderDelta: 35000,
    origCostBreakdown: { labor: 161200, laborHours: 2150, materials: 93000, equipment: 167400, subs: 68200, other: 18600 },
    revCostBreakdown: { labor: 170500, laborHours: 2275, materials: 97000, equipment: 172000, subs: 72000, other: 19600 },
    finalCostBreakdown: { labor: 164000, laborHours: 2190, materials: 94500, equipment: 170000, subs: 70000, other: 18800 },
  }),

  // 4. Federal courthouse - FADE (scope creep, poor change order management)
  buildProject({
    id: '22-004', name: 'Federal Courthouse MEP Renovation', customer: 'Clark Construction',
    division: 'Commercial', segment: 'Federal Government', year: 2022, pm: 'Tom Williams', estimator: 'Steve Petrov', origValue: 3100000, changeOrderDelta: 290000,
    origCostBreakdown: { labor: 806000, laborHours: 10750, materials: 496000, equipment: 651000, subs: 527000, other: 93000 },
    revCostBreakdown: { labor: 880000, laborHours: 11730, materials: 535000, equipment: 680000, subs: 565000, other: 101000 },
    finalCostBreakdown: { labor: 1020000, laborHours: 13500, materials: 578000, equipment: 712000, subs: 598000, other: 118000 },
  }),

  // 5. Senior living - GAIN (repeat client, good relationship)
  buildProject({
    id: '22-005', name: 'Parkside Senior Living HVAC Install', customer: 'Swinerton',
    division: 'Residential', segment: 'Senior Living', year: 2022, pm: 'Jessica Park', estimator: 'Karen Wright', origValue: 1800000, changeOrderDelta: 120000,
    origCostBreakdown: { labor: 468000, laborHours: 6240, materials: 288000, equipment: 396000, subs: 252000, other: 72000 },
    revCostBreakdown: { labor: 500000, laborHours: 6670, materials: 307000, equipment: 415000, subs: 268000, other: 76800 },
    finalCostBreakdown: { labor: 485000, laborHours: 6470, materials: 298000, equipment: 408000, subs: 260000, other: 74000 },
  }),

  // 6. Life sciences cleanroom - BIG FADE (complexity, contamination protocols)
  buildProject({
    id: '22-006', name: 'Biotech Research Lab Cleanroom MEP', customer: 'McCarthy Building Companies',
    division: 'Healthcare', segment: 'Life Sciences', year: 2022, pm: 'Rachel Kim', estimator: 'Jim Crawford', origValue: 5200000, changeOrderDelta: 680000,
    origCostBreakdown: { labor: 1352000, laborHours: 18030, materials: 832000, equipment: 1196000, subs: 780000, other: 156000 },
    revCostBreakdown: { labor: 1530000, laborHours: 20400, materials: 940000, equipment: 1290000, subs: 870000, other: 176000 },
    finalCostBreakdown: { labor: 1890000, laborHours: 24800, materials: 1045000, equipment: 1350000, subs: 920000, other: 210000 },
  }),

  // 7. Office TI - GAIN (simple scope)
  buildProject({
    id: '22-007', name: '200 Market Street Office Build-Out', customer: 'Hines',
    division: 'Commercial', segment: 'Office / Commercial', year: 2022, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 450000, changeOrderDelta: 28000,
    origCostBreakdown: { labor: 117000, laborHours: 1560, materials: 67500, equipment: 94500, subs: 63000, other: 18000 },
    revCostBreakdown: { labor: 124000, laborHours: 1655, materials: 71500, equipment: 98000, subs: 66000, other: 19000 },
    finalCostBreakdown: { labor: 119000, laborHours: 1590, materials: 68000, equipment: 96000, subs: 64500, other: 18200 },
  }),

  // 8. Multifamily - GAIN (efficient crew, good prefab)
  buildProject({
    id: '22-008', name: 'The Vue Apartments Plumbing & HVAC', customer: 'Greystar Development',
    division: 'Residential', segment: 'Multifamily', year: 2022, pm: 'Jessica Park', estimator: 'Karen Wright', origValue: 2800000, changeOrderDelta: 195000,
    origCostBreakdown: { labor: 728000, laborHours: 9710, materials: 476000, equipment: 560000, subs: 420000, other: 112000 },
    revCostBreakdown: { labor: 780000, laborHours: 10400, materials: 510000, equipment: 590000, subs: 449000, other: 120000 },
    finalCostBreakdown: { labor: 755000, laborHours: 10070, materials: 495000, equipment: 580000, subs: 440000, other: 115000 },
  }),

  // 9. Hotel renovation - FADE (occupied building complications)
  buildProject({
    id: '22-009', name: 'Harbor Hotel Mechanical Renovation', customer: 'Suffolk Construction',
    division: 'Commercial', segment: 'Hospitality', year: 2022, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 890000, changeOrderDelta: 85000,
    origCostBreakdown: { labor: 231400, laborHours: 3085, materials: 133500, equipment: 187000, subs: 124600, other: 35600 },
    revCostBreakdown: { labor: 253000, laborHours: 3375, materials: 146000, equipment: 195000, subs: 136000, other: 39000 },
    finalCostBreakdown: { labor: 298000, laborHours: 3940, materials: 158000, equipment: 202000, subs: 142000, other: 42000 },
  }),

  // 10. Municipal - GAIN (clear specs, stable scope)
  buildProject({
    id: '22-010', name: 'City Water Treatment Plant HVAC', customer: 'Skanska USA',
    division: 'Commercial', segment: 'Municipal Government', year: 2022, pm: 'Mark Hansen', estimator: 'Dan Nakamura', origValue: 1500000, changeOrderDelta: 65000,
    origCostBreakdown: { labor: 390000, laborHours: 5200, materials: 240000, equipment: 345000, subs: 210000, other: 60000 },
    revCostBreakdown: { labor: 405000, laborHours: 5400, materials: 250000, equipment: 355000, subs: 218000, other: 62000 },
    finalCostBreakdown: { labor: 395000, laborHours: 5270, materials: 243000, equipment: 350000, subs: 215000, other: 60500 },
  }),

  // 11. Healthcare OR suite - FADE (OSHPD delays, infection control)
  buildProject({
    id: '22-011', name: 'Valley Medical Center OR Suite MEP', customer: 'Webcor Builders',
    division: 'Healthcare', segment: 'Healthcare', year: 2022, pm: 'Mike Rodriguez', estimator: 'Jim Crawford', origValue: 1200000, changeOrderDelta: 110000,
    origCostBreakdown: { labor: 312000, laborHours: 4160, materials: 192000, equipment: 264000, subs: 168000, other: 48000 },
    revCostBreakdown: { labor: 345000, laborHours: 4600, materials: 210000, equipment: 280000, subs: 183000, other: 52000 },
    finalCostBreakdown: { labor: 405000, laborHours: 5320, materials: 234000, equipment: 295000, subs: 198000, other: 58000 },
  }),

  // 12. Corporate chiller - GAIN (equipment replacement, straightforward)
  buildProject({
    id: '22-012', name: 'Corporate Campus Chiller Replacement', customer: 'Lincoln Property Company',
    division: 'Commercial', segment: 'Office / Commercial', year: 2022, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 680000, changeOrderDelta: 0,
    origCostBreakdown: { labor: 108800, laborHours: 1450, materials: 47600, equipment: 299200, subs: 68000, other: 27200 },
    revCostBreakdown: { labor: 108800, laborHours: 1450, materials: 47600, equipment: 299200, subs: 68000, other: 27200 },
    finalCostBreakdown: { labor: 102000, laborHours: 1360, materials: 45000, equipment: 299200, subs: 65000, other: 25500 },
  }),

  // 13. Higher ed science building - GAIN
  buildProject({
    id: '22-013', name: 'State University Science Building MEP', customer: 'Holder Construction',
    division: 'Commercial', segment: 'Higher Education', year: 2022, pm: 'Dave Morrison', estimator: 'Karen Wright', origValue: 3600000, changeOrderDelta: 240000,
    origCostBreakdown: { labor: 936000, laborHours: 12480, materials: 540000, equipment: 792000, subs: 540000, other: 144000 },
    revCostBreakdown: { labor: 1000000, laborHours: 13340, materials: 576000, equipment: 830000, subs: 576000, other: 153600 },
    finalCostBreakdown: { labor: 975000, laborHours: 13000, materials: 560000, equipment: 818000, subs: 565000, other: 148000 },
  }),

  // 14. Industrial HVAC - GAIN
  buildProject({
    id: '22-014', name: 'Distribution Center HVAC Installation', customer: 'Rudolph & Sletten',
    division: 'Commercial', segment: 'Industrial', year: 2022, pm: 'Mark Hansen', estimator: 'Dan Nakamura', origValue: 950000, changeOrderDelta: 45000,
    origCostBreakdown: { labor: 247000, laborHours: 3295, materials: 152000, equipment: 228000, subs: 114000, other: 38000 },
    revCostBreakdown: { labor: 258000, laborHours: 3440, materials: 159000, equipment: 236000, subs: 119000, other: 39800 },
    finalCostBreakdown: { labor: 250000, laborHours: 3335, materials: 155000, equipment: 232000, subs: 116500, other: 38500 },
  }),

  // 15. Retail - FADE (after-hours work, access issues)
  buildProject({
    id: '22-015', name: 'Retail Plaza HVAC Retrofit', customer: 'Turner Construction',
    division: 'Commercial', segment: 'Retail', year: 2022, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 340000, changeOrderDelta: 15000,
    origCostBreakdown: { labor: 88400, laborHours: 1180, materials: 51000, equipment: 74800, subs: 40800, other: 13600 },
    revCostBreakdown: { labor: 92000, laborHours: 1230, materials: 53200, equipment: 77000, subs: 42400, other: 14100 },
    finalCostBreakdown: { labor: 108000, laborHours: 1430, materials: 57000, equipment: 79000, subs: 44500, other: 15200 },
  }),

  // 16. Small healthcare clinic - GAIN (Whiting-Turner well-managed)
  buildProject({
    id: '22-016', name: 'Community Health Clinic MEP', customer: 'Whiting-Turner',
    division: 'Healthcare', segment: 'Healthcare', year: 2022, pm: 'Mike Rodriguez', estimator: 'Jim Crawford', origValue: 780000, changeOrderDelta: 42000,
    origCostBreakdown: { labor: 202800, laborHours: 2705, materials: 117000, equipment: 171600, subs: 93600, other: 31200 },
    revCostBreakdown: { labor: 214000, laborHours: 2855, materials: 123000, equipment: 180000, subs: 98600, other: 32800 },
    finalCostBreakdown: { labor: 208000, laborHours: 2775, materials: 119000, equipment: 176000, subs: 96000, other: 31500 },
  }),

  // ============================================================
  // 2023 PROJECTS (16 projects)
  // ============================================================

  // 17. Data center phase 2 - GAIN (learning from phase 1)
  buildProject({
    id: '23-001', name: 'TechVault Data Center Phase 2', customer: 'DPR Construction',
    division: 'Commercial', segment: 'Data Center', year: 2023, pm: 'Sarah Chen', estimator: 'Lisa Martinez', origValue: 9200000, changeOrderDelta: 520000,
    origCostBreakdown: { labor: 2392000, laborHours: 30400, materials: 1564000, equipment: 2300000, subs: 1104000, other: 276000 },
    revCostBreakdown: { labor: 2530000, laborHours: 32150, materials: 1651000, equipment: 2400000, subs: 1164000, other: 291000 },
    finalCostBreakdown: { labor: 2450000, laborHours: 31100, materials: 1610000, equipment: 2370000, subs: 1140000, other: 280000 },
  }),

  // 18. Large healthcare expansion - BIG FADE (the cautionary tale)
  buildProject({
    id: '23-002', name: 'Regional Medical Center East Wing', customer: 'Turner Construction',
    division: 'Healthcare', segment: 'Healthcare', year: 2023, pm: 'Mike Rodriguez', estimator: 'Jim Crawford', origValue: 6800000, changeOrderDelta: 920000,
    origCostBreakdown: { labor: 1768000, laborHours: 23575, materials: 1088000, equipment: 1496000, subs: 1020000, other: 204000 },
    revCostBreakdown: { labor: 2010000, laborHours: 26800, materials: 1235000, equipment: 1620000, subs: 1145000, other: 231000 },
    finalCostBreakdown: { labor: 2520000, laborHours: 33100, materials: 1390000, equipment: 1720000, subs: 1210000, other: 285000 },
  }),

  // 19. K-12 new construction - GAIN
  buildProject({
    id: '23-003', name: 'Westview High School New Construction', customer: 'Hensel Phelps',
    division: 'Commercial', segment: 'K-12 Education', year: 2023, pm: 'Dave Morrison', estimator: 'Karen Wright', origValue: 2100000, changeOrderDelta: 140000,
    origCostBreakdown: { labor: 546000, laborHours: 7280, materials: 336000, equipment: 441000, subs: 315000, other: 84000 },
    revCostBreakdown: { labor: 582000, laborHours: 7760, materials: 358000, equipment: 462000, subs: 336000, other: 89600 },
    finalCostBreakdown: { labor: 565000, laborHours: 7530, materials: 348000, equipment: 455000, subs: 328000, other: 86000 },
  }),

  // 20. Army base - FADE (security delays, Davis-Bacon labor rates)
  buildProject({
    id: '23-004', name: 'Army Base Barracks MEP Systems', customer: 'Clark Construction',
    division: 'Commercial', segment: 'Federal Government', year: 2023, pm: 'Tom Williams', estimator: 'Steve Petrov', origValue: 4500000, changeOrderDelta: 350000,
    origCostBreakdown: { labor: 1170000, laborHours: 15600, materials: 720000, equipment: 990000, subs: 675000, other: 135000 },
    revCostBreakdown: { labor: 1265000, laborHours: 16870, materials: 776000, equipment: 1050000, subs: 728000, other: 145800 },
    finalCostBreakdown: { labor: 1480000, laborHours: 19500, materials: 842000, equipment: 1095000, subs: 762000, other: 165000 },
  }),

  // 21. Senior living phase 2 - GAIN (repeat project type)
  buildProject({
    id: '23-005', name: 'Sunrise Senior Community Phase 2', customer: 'Swinerton',
    division: 'Residential', segment: 'Senior Living', year: 2023, pm: 'Jessica Park', estimator: 'Karen Wright', origValue: 2200000, changeOrderDelta: 85000,
    origCostBreakdown: { labor: 572000, laborHours: 7630, materials: 352000, equipment: 462000, subs: 308000, other: 88000 },
    revCostBreakdown: { labor: 594000, laborHours: 7920, materials: 365000, equipment: 478000, subs: 319400, other: 91300 },
    finalCostBreakdown: { labor: 578000, laborHours: 7710, materials: 355000, equipment: 468000, subs: 312000, other: 88500 },
  }),

  // 22. Genomics lab - FADE (spec changes mid-project)
  buildProject({
    id: '23-006', name: 'Genomics Institute Lab MEP', customer: 'McCarthy Building Companies',
    division: 'Healthcare', segment: 'Life Sciences', year: 2023, pm: 'Rachel Kim', estimator: 'Jim Crawford', origValue: 3800000, changeOrderDelta: 410000,
    origCostBreakdown: { labor: 988000, laborHours: 13175, materials: 608000, equipment: 836000, subs: 570000, other: 114000 },
    revCostBreakdown: { labor: 1095000, laborHours: 14600, materials: 672000, equipment: 910000, subs: 632000, other: 126000 },
    finalCostBreakdown: { labor: 1290000, laborHours: 17000, materials: 738000, equipment: 955000, subs: 668000, other: 145000 },
  }),

  // 23. Office tower build-out - GAIN
  buildProject({
    id: '23-007', name: 'One Harbor Tower Office Build-Out', customer: 'Hines',
    division: 'Commercial', segment: 'Office / Commercial', year: 2023, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 1100000, changeOrderDelta: 65000,
    origCostBreakdown: { labor: 286000, laborHours: 3815, materials: 165000, equipment: 231000, subs: 154000, other: 44000 },
    revCostBreakdown: { labor: 303000, laborHours: 4040, materials: 175000, equipment: 242000, subs: 163000, other: 46600 },
    finalCostBreakdown: { labor: 292000, laborHours: 3895, materials: 169000, equipment: 238000, subs: 158000, other: 44500 },
  }),

  // 24. Multifamily - GAIN (good prefab strategy)
  buildProject({
    id: '23-008', name: 'Riverside Lofts HVAC & Plumbing', customer: 'Greystar Development',
    division: 'Residential', segment: 'Multifamily', year: 2023, pm: 'Jessica Park', estimator: 'Karen Wright', origValue: 1600000, changeOrderDelta: 90000,
    origCostBreakdown: { labor: 416000, laborHours: 5550, materials: 256000, equipment: 336000, subs: 224000, other: 64000 },
    revCostBreakdown: { labor: 440000, laborHours: 5870, materials: 270000, equipment: 352000, subs: 236000, other: 67600 },
    finalCostBreakdown: { labor: 428000, laborHours: 5710, materials: 262000, equipment: 345000, subs: 230000, other: 65000 },
  }),

  // 25. Higher ed dormitory - GAIN
  buildProject({
    id: '23-009', name: 'State University Dormitory MEP', customer: 'Holder Construction',
    division: 'Commercial', segment: 'Higher Education', year: 2023, pm: 'Dave Morrison', estimator: 'Karen Wright', origValue: 2900000, changeOrderDelta: 175000,
    origCostBreakdown: { labor: 754000, laborHours: 10055, materials: 464000, equipment: 609000, subs: 435000, other: 116000 },
    revCostBreakdown: { labor: 800000, laborHours: 10670, materials: 492000, equipment: 640000, subs: 461000, other: 123000 },
    finalCostBreakdown: { labor: 782000, laborHours: 10430, materials: 480000, equipment: 628000, subs: 450000, other: 119000 },
  }),

  // 26. Hospital surgical wing - GAIN (Whiting-Turner excellent project management)
  buildProject({
    id: '23-010', name: 'Mercy Hospital Surgical Wing MEP', customer: 'Whiting-Turner',
    division: 'Healthcare', segment: 'Healthcare', year: 2023, pm: 'Mike Rodriguez', estimator: 'Jim Crawford', origValue: 4100000, changeOrderDelta: 310000,
    origCostBreakdown: { labor: 1066000, laborHours: 14215, materials: 656000, equipment: 902000, subs: 615000, other: 123000 },
    revCostBreakdown: { labor: 1148000, laborHours: 15310, materials: 705000, equipment: 960000, subs: 661500, other: 132300 },
    finalCostBreakdown: { labor: 1120000, laborHours: 14935, materials: 688000, equipment: 945000, subs: 648000, other: 128000 },
  }),

  // 27. County jail - FADE (security requirements, scheduling constraints)
  buildProject({
    id: '23-011', name: 'County Detention Center HVAC', customer: 'Skanska USA',
    division: 'Commercial', segment: 'Municipal Government', year: 2023, pm: 'Mark Hansen', estimator: 'Dan Nakamura', origValue: 1900000, changeOrderDelta: 120000,
    origCostBreakdown: { labor: 494000, laborHours: 6590, materials: 304000, equipment: 418000, subs: 266000, other: 76000 },
    revCostBreakdown: { labor: 525000, laborHours: 7000, materials: 323000, equipment: 440000, subs: 282000, other: 80800 },
    finalCostBreakdown: { labor: 610000, laborHours: 8050, materials: 352000, equipment: 462000, subs: 302000, other: 88500 },
  }),

  // 28. Boutique hotel - GAIN (small, controlled scope)
  buildProject({
    id: '23-012', name: 'Boutique Hotel Mechanical Systems', customer: 'Suffolk Construction',
    division: 'Commercial', segment: 'Hospitality', year: 2023, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 720000, changeOrderDelta: 38000,
    origCostBreakdown: { labor: 187200, laborHours: 2500, materials: 108000, equipment: 158400, subs: 86400, other: 28800 },
    revCostBreakdown: { labor: 197000, laborHours: 2630, materials: 113500, equipment: 165000, subs: 90800, other: 30300 },
    finalCostBreakdown: { labor: 190000, laborHours: 2540, materials: 110000, equipment: 161000, subs: 88000, other: 29200 },
  }),

  // 29. Small office RTU replacement - GAIN
  buildProject({
    id: '23-013', name: 'Tech Park Rooftop Unit Replacement', customer: 'Lincoln Property Company',
    division: 'Commercial', segment: 'Office / Commercial', year: 2023, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 380000, changeOrderDelta: 0,
    origCostBreakdown: { labor: 60800, laborHours: 810, materials: 26600, equipment: 167200, subs: 38000, other: 15200 },
    revCostBreakdown: { labor: 60800, laborHours: 810, materials: 26600, equipment: 167200, subs: 38000, other: 15200 },
    finalCostBreakdown: { labor: 57000, laborHours: 760, materials: 25000, equipment: 167200, subs: 36500, other: 14500 },
  }),

  // 30. Manufacturing plant piping - GAIN
  buildProject({
    id: '23-014', name: 'Manufacturing Plant Process Piping', customer: 'Rudolph & Sletten',
    division: 'Commercial', segment: 'Industrial', year: 2023, pm: 'Mark Hansen', estimator: 'Dan Nakamura', origValue: 1300000, changeOrderDelta: 75000,
    origCostBreakdown: { labor: 338000, laborHours: 4510, materials: 221000, equipment: 273000, subs: 182000, other: 52000 },
    revCostBreakdown: { labor: 357000, laborHours: 4760, materials: 233000, equipment: 287000, subs: 192000, other: 55000 },
    finalCostBreakdown: { labor: 348000, laborHours: 4640, materials: 227000, equipment: 280000, subs: 188000, other: 53000 },
  }),

  // 31. Children's hospital - FADE (infection control, phasing requirements)
  buildProject({
    id: '23-015', name: "Children's Hospital New Wing MEP", customer: 'Webcor Builders',
    division: 'Healthcare', segment: 'Healthcare', year: 2023, pm: 'Rachel Kim', estimator: 'Jim Crawford', origValue: 2500000, changeOrderDelta: 280000,
    origCostBreakdown: { labor: 650000, laborHours: 8670, materials: 400000, equipment: 550000, subs: 375000, other: 75000 },
    revCostBreakdown: { labor: 724000, laborHours: 9655, materials: 444800, equipment: 596000, subs: 417200, other: 83440 },
    finalCostBreakdown: { labor: 852000, laborHours: 11200, materials: 495000, equipment: 632000, subs: 448000, other: 96000 },
  }),

  // 32. Retail outlet - GAIN (after-hours but better managed than 2022)
  buildProject({
    id: '23-016', name: 'Outlet Mall Anchor Store Renovation', customer: 'Turner Construction',
    division: 'Commercial', segment: 'Retail', year: 2023, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 520000, changeOrderDelta: 30000,
    origCostBreakdown: { labor: 135200, laborHours: 1805, materials: 78000, equipment: 109200, subs: 62400, other: 20800 },
    revCostBreakdown: { labor: 143000, laborHours: 1905, materials: 82500, equipment: 114000, subs: 66000, other: 22000 },
    finalCostBreakdown: { labor: 138000, laborHours: 1840, materials: 79500, equipment: 111000, subs: 64000, other: 21000 },
  }),

  // ============================================================
  // 2024 PROJECTS (16 projects)
  // ============================================================

  // 33. Massive data center - BIG GAIN (institutional knowledge paying off)
  buildProject({
    id: '24-001', name: 'CloudFirst Data Center Campus', customer: 'DPR Construction',
    division: 'Commercial', segment: 'Data Center', year: 2024, pm: 'Sarah Chen', estimator: 'Lisa Martinez', origValue: 11500000, changeOrderDelta: 850000,
    origCostBreakdown: { labor: 2990000, laborHours: 37375, materials: 1955000, equipment: 2875000, subs: 1380000, other: 345000 },
    revCostBreakdown: { labor: 3220000, laborHours: 40250, materials: 2100000, equipment: 3050000, subs: 1480000, other: 370000 },
    finalCostBreakdown: { labor: 3080000, laborHours: 38500, materials: 2020000, equipment: 2980000, subs: 1430000, other: 352000 },
  }),

  // 34. University hospital tower - FADE (largest project, biggest fade)
  buildProject({
    id: '24-002', name: 'University Hospital Patient Tower MEP', customer: 'Turner Construction',
    division: 'Healthcare', segment: 'Healthcare', year: 2024, pm: 'Mike Rodriguez', estimator: 'Jim Crawford', origValue: 8200000, changeOrderDelta: 1100000,
    origCostBreakdown: { labor: 2132000, laborHours: 28430, materials: 1312000, equipment: 1804000, subs: 1230000, other: 246000 },
    revCostBreakdown: { labor: 2420000, laborHours: 32270, materials: 1490000, equipment: 1990000, subs: 1395000, other: 279000 },
    finalCostBreakdown: { labor: 3050000, laborHours: 40100, materials: 1680000, equipment: 2120000, subs: 1490000, other: 332000 },
  }),

  // 35. K-12 district bundle - GAIN (volume efficiency)
  buildProject({
    id: '24-003', name: 'Elementary School District HVAC Bundle', customer: 'Hensel Phelps',
    division: 'Commercial', segment: 'K-12 Education', year: 2024, pm: 'Dave Morrison', estimator: 'Karen Wright', origValue: 3400000, changeOrderDelta: 180000,
    origCostBreakdown: { labor: 884000, laborHours: 11790, materials: 544000, equipment: 714000, subs: 510000, other: 136000 },
    revCostBreakdown: { labor: 931000, laborHours: 12415, materials: 572000, equipment: 746000, subs: 536000, other: 143000 },
    finalCostBreakdown: { labor: 905000, laborHours: 12070, materials: 555000, equipment: 730000, subs: 522000, other: 138000 },
  }),

  // 36. VA medical center - FADE (government complexity)
  buildProject({
    id: '24-004', name: 'VA Medical Center MEP Renovation', customer: 'Clark Construction',
    division: 'Commercial', segment: 'Federal Government', year: 2024, pm: 'Tom Williams', estimator: 'Steve Petrov', origValue: 5800000, changeOrderDelta: 480000,
    origCostBreakdown: { labor: 1508000, laborHours: 20110, materials: 928000, equipment: 1218000, subs: 870000, other: 174000 },
    revCostBreakdown: { labor: 1635000, laborHours: 21800, materials: 1004000, equipment: 1310000, subs: 942000, other: 188400 },
    finalCostBreakdown: { labor: 1920000, laborHours: 25300, materials: 1098000, equipment: 1378000, subs: 998000, other: 215000 },
  }),

  // 37. Pharma campus - GAIN (improved from 2022 life sciences fade)
  buildProject({
    id: '24-005', name: 'Pharma Campus Clean Utilities', customer: 'McCarthy Building Companies',
    division: 'Healthcare', segment: 'Life Sciences', year: 2024, pm: 'Rachel Kim', estimator: 'Jim Crawford', origValue: 4600000, changeOrderDelta: 320000,
    origCostBreakdown: { labor: 1196000, laborHours: 15950, materials: 736000, equipment: 1012000, subs: 690000, other: 138000 },
    revCostBreakdown: { labor: 1280000, laborHours: 17070, materials: 787000, equipment: 1070000, subs: 738000, other: 147600 },
    finalCostBreakdown: { labor: 1250000, laborHours: 16670, materials: 770000, equipment: 1055000, subs: 725000, other: 143000 },
  }),

  // 38. Luxury senior residence - GAIN
  buildProject({
    id: '24-006', name: 'Luxury Senior Residence MEP', customer: 'Swinerton',
    division: 'Residential', segment: 'Senior Living', year: 2024, pm: 'Jessica Park', estimator: 'Karen Wright', origValue: 2500000, changeOrderDelta: 130000,
    origCostBreakdown: { labor: 650000, laborHours: 8670, materials: 400000, equipment: 525000, subs: 350000, other: 100000 },
    revCostBreakdown: { labor: 684000, laborHours: 9120, materials: 421000, equipment: 548000, subs: 368000, other: 105200 },
    finalCostBreakdown: { labor: 665000, laborHours: 8870, materials: 410000, equipment: 538000, subs: 358000, other: 102000 },
  }),

  // 39. Financial district TI - GAIN
  buildProject({
    id: '24-007', name: '500 Financial District Tenant Improvement', customer: 'Hines',
    division: 'Commercial', segment: 'Office / Commercial', year: 2024, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 890000, changeOrderDelta: 55000,
    origCostBreakdown: { labor: 231400, laborHours: 3085, materials: 133500, equipment: 178000, subs: 106800, other: 35600 },
    revCostBreakdown: { labor: 245500, laborHours: 3275, materials: 141700, equipment: 188000, subs: 113300, other: 37800 },
    finalCostBreakdown: { labor: 237000, laborHours: 3165, materials: 136500, equipment: 184000, subs: 109500, other: 36200 },
  }),

  // 40. Mixed-use multifamily - FADE (rare fade for residential)
  buildProject({
    id: '24-008', name: 'Urban Gardens Mixed-Use MEP', customer: 'Greystar Development',
    division: 'Residential', segment: 'Multifamily', year: 2024, pm: 'Jessica Park', estimator: 'Karen Wright', origValue: 3200000, changeOrderDelta: 210000,
    origCostBreakdown: { labor: 832000, laborHours: 11095, materials: 512000, equipment: 672000, subs: 448000, other: 128000 },
    revCostBreakdown: { labor: 886000, laborHours: 11815, materials: 545000, equipment: 712000, subs: 477000, other: 136200 },
    finalCostBreakdown: { labor: 1010000, laborHours: 13400, materials: 592000, equipment: 745000, subs: 510000, other: 148000 },
  }),

  // 41. Community college - GAIN
  buildProject({
    id: '24-009', name: 'Community College HVAC Renovation', customer: 'Holder Construction',
    division: 'Commercial', segment: 'Higher Education', year: 2024, pm: 'Dave Morrison', estimator: 'Karen Wright', origValue: 1800000, changeOrderDelta: 95000,
    origCostBreakdown: { labor: 468000, laborHours: 6240, materials: 288000, equipment: 378000, subs: 270000, other: 72000 },
    revCostBreakdown: { labor: 492500, laborHours: 6570, materials: 303000, equipment: 397000, subs: 284000, other: 75800 },
    finalCostBreakdown: { labor: 480000, laborHours: 6400, materials: 295000, equipment: 388000, subs: 276000, other: 73200 },
  }),

  // 42. Hospital retrofit - GAIN (Whiting-Turner consistently good)
  buildProject({
    id: '24-010', name: "St. Mary's Hospital Chiller Retrofit", customer: 'Whiting-Turner',
    division: 'Healthcare', segment: 'Healthcare', year: 2024, pm: 'Mike Rodriguez', estimator: 'Jim Crawford', origValue: 3500000, changeOrderDelta: 190000,
    origCostBreakdown: { labor: 910000, laborHours: 12135, materials: 560000, equipment: 770000, subs: 525000, other: 105000 },
    revCostBreakdown: { labor: 960000, laborHours: 12800, materials: 590000, equipment: 805000, subs: 553500, other: 110700 },
    finalCostBreakdown: { labor: 935000, laborHours: 12470, materials: 575000, equipment: 795000, subs: 540000, other: 107000 },
  }),

  // 43. Municipal rec center - GAIN
  buildProject({
    id: '24-011', name: 'Municipal Recreation Center MEP', customer: 'Skanska USA',
    division: 'Commercial', segment: 'Municipal Government', year: 2024, pm: 'Mark Hansen', estimator: 'Dan Nakamura', origValue: 1100000, changeOrderDelta: 60000,
    origCostBreakdown: { labor: 286000, laborHours: 3815, materials: 176000, equipment: 231000, subs: 154000, other: 44000 },
    revCostBreakdown: { labor: 301500, laborHours: 4020, materials: 185500, equipment: 242000, subs: 162200, other: 46300 },
    finalCostBreakdown: { labor: 293000, laborHours: 3905, materials: 180000, equipment: 237000, subs: 157000, other: 44800 },
  }),

  // 44. Convention center expansion - GAIN (large but well-managed)
  buildProject({
    id: '24-012', name: 'Convention Center Expansion MEP', customer: 'Suffolk Construction',
    division: 'Commercial', segment: 'Hospitality', year: 2024, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 2800000, changeOrderDelta: 195000,
    origCostBreakdown: { labor: 728000, laborHours: 9710, materials: 448000, equipment: 588000, subs: 420000, other: 112000 },
    revCostBreakdown: { labor: 778500, laborHours: 10380, materials: 479000, equipment: 624000, subs: 449000, other: 119700 },
    finalCostBreakdown: { labor: 758000, laborHours: 10110, materials: 465000, equipment: 612000, subs: 438000, other: 116000 },
  }),

  // 45. Food processing - FADE (contamination protocols, washdown areas)
  buildProject({
    id: '24-013', name: 'Food Processing Facility HVAC & Piping', customer: 'Rudolph & Sletten',
    division: 'Commercial', segment: 'Industrial', year: 2024, pm: 'Mark Hansen', estimator: 'Dan Nakamura', origValue: 2100000, changeOrderDelta: 145000,
    origCostBreakdown: { labor: 546000, laborHours: 7280, materials: 357000, equipment: 441000, subs: 294000, other: 84000 },
    revCostBreakdown: { labor: 584000, laborHours: 7790, materials: 381000, equipment: 468000, subs: 314000, other: 89800 },
    finalCostBreakdown: { labor: 672000, laborHours: 8880, materials: 418000, equipment: 498000, subs: 340000, other: 102000 },
  }),

  // 46. Suburban office park - GAIN
  buildProject({
    id: '24-014', name: 'Suburban Office Park HVAC Upgrade', customer: 'Lincoln Property Company',
    division: 'Commercial', segment: 'Office / Commercial', year: 2024, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 560000, changeOrderDelta: 25000,
    origCostBreakdown: { labor: 145600, laborHours: 1940, materials: 84000, equipment: 117600, subs: 67200, other: 22400 },
    revCostBreakdown: { labor: 152000, laborHours: 2030, materials: 87800, equipment: 122500, subs: 70200, other: 23400 },
    finalCostBreakdown: { labor: 147000, laborHours: 1960, materials: 85000, equipment: 119500, subs: 68000, other: 22500 },
  }),

  // 47. Dialysis center - FADE (medical gas complexity)
  buildProject({
    id: '24-015', name: 'Dialysis Center MEP Build-Out', customer: 'Webcor Builders',
    division: 'Healthcare', segment: 'Healthcare', year: 2024, pm: 'Mike Rodriguez', estimator: 'Jim Crawford', origValue: 670000, changeOrderDelta: 48000,
    origCostBreakdown: { labor: 174200, laborHours: 2325, materials: 100500, equipment: 147400, subs: 80400, other: 26800 },
    revCostBreakdown: { labor: 186800, laborHours: 2490, materials: 107700, equipment: 157000, subs: 86200, other: 28700 },
    finalCostBreakdown: { labor: 218000, laborHours: 2880, materials: 118000, equipment: 164000, subs: 92000, other: 31500 },
  }),

  // 48. Small retail build-out - GAIN (improved from prior year)
  buildProject({
    id: '24-016', name: 'Big Box Store MEP Build-Out', customer: 'Turner Construction',
    division: 'Commercial', segment: 'Retail', year: 2024, pm: 'Brian O\'Neill', estimator: 'Amy Thornton', origValue: 180000, changeOrderDelta: 12000,
    origCostBreakdown: { labor: 46800, laborHours: 625, materials: 27000, equipment: 37800, subs: 21600, other: 7200 },
    revCostBreakdown: { labor: 49900, laborHours: 665, materials: 28800, equipment: 39900, subs: 23000, other: 7680 },
    finalCostBreakdown: { labor: 47500, laborHours: 635, materials: 27500, equipment: 38500, subs: 22000, other: 7300 },
  }),
];
