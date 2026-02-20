import type { ProjectRecord, PortfolioSummary } from './types';

export function calculatePortfolioSummary(projects: ProjectRecord[]): PortfolioSummary {
  const totalProjects = projects.length;
  const totalRevenue = projects.reduce((sum, p) => sum + p.finalContractValue, 0);
  const totalProfit = projects.reduce((sum, p) => sum + p.finalProfit, 0);
  const totalOriginalValue = projects.reduce((sum, p) => sum + p.originalContractValue, 0);
  const totalGainFadeDollars = projects.reduce((sum, p) => sum + p.gainFadeOrgFinalDollars, 0);
  const averageProfitMargin = totalProjects > 0
    ? projects.reduce((sum, p) => sum + p.finalGrossProfitMargin, 0) / totalProjects
    : 0;
  const averageContractValue = totalProjects > 0 ? totalRevenue / totalProjects : 0;
  const gainCount = projects.filter((p) => p.overallGainFade === 'Gain').length;
  const fadeCount = projects.filter((p) => p.overallGainFade === 'Fade').length;
  const gainRate = totalProjects > 0 ? gainCount / totalProjects : 0;

  const marketSegments = [...new Set(projects.map((p) => p.marketSegment))].filter(Boolean).sort();
  const divisions = [...new Set(projects.map((p) => p.division))].filter(Boolean).sort();
  const years = [...new Set(projects.map((p) => p.yearCompleted))].filter(Boolean).sort();
  const customers = [...new Set(projects.map((p) => p.customerName))].filter(Boolean).sort();

  return {
    totalProjects,
    totalRevenue,
    averageProfitMargin,
    averageContractValue,
    gainCount,
    fadeCount,
    gainRate,
    totalProfit,
    totalOriginalValue,
    totalGainFadeDollars,
    marketSegments,
    divisions,
    years,
    customers,
  };
}

export interface SegmentMetrics {
  segment: string;
  projectCount: number;
  totalRevenue: number;
  averageMargin: number;
  gainCount: number;
  fadeCount: number;
  totalGainFade: number;
}

export function calculateSegmentMetrics(projects: ProjectRecord[]): SegmentMetrics[] {
  const segmentMap = new Map<string, ProjectRecord[]>();
  for (const p of projects) {
    const seg = p.marketSegment || 'Unknown';
    if (!segmentMap.has(seg)) segmentMap.set(seg, []);
    segmentMap.get(seg)!.push(p);
  }

  return Array.from(segmentMap.entries()).map(([segment, prjs]) => ({
    segment,
    projectCount: prjs.length,
    totalRevenue: prjs.reduce((s, p) => s + p.finalContractValue, 0),
    averageMargin: prjs.reduce((s, p) => s + p.finalGrossProfitMargin, 0) / prjs.length,
    gainCount: prjs.filter((p) => p.overallGainFade === 'Gain').length,
    fadeCount: prjs.filter((p) => p.overallGainFade === 'Fade').length,
    totalGainFade: prjs.reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0),
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export interface DivisionMetrics {
  division: string;
  projectCount: number;
  totalRevenue: number;
  averageMargin: number;
  gainCount: number;
  fadeCount: number;
  totalGainFade: number;
}

export function calculateDivisionMetrics(projects: ProjectRecord[]): DivisionMetrics[] {
  const divMap = new Map<string, ProjectRecord[]>();
  for (const p of projects) {
    const div = p.division || 'Unknown';
    if (!divMap.has(div)) divMap.set(div, []);
    divMap.get(div)!.push(p);
  }

  return Array.from(divMap.entries()).map(([division, prjs]) => ({
    division,
    projectCount: prjs.length,
    totalRevenue: prjs.reduce((s, p) => s + p.finalContractValue, 0),
    averageMargin: prjs.reduce((s, p) => s + p.finalGrossProfitMargin, 0) / prjs.length,
    gainCount: prjs.filter((p) => p.overallGainFade === 'Gain').length,
    fadeCount: prjs.filter((p) => p.overallGainFade === 'Fade').length,
    totalGainFade: prjs.reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0),
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export interface CustomerMetrics {
  customer: string;
  projectCount: number;
  totalRevenue: number;
  averageMargin: number;
  gainCount: number;
  fadeCount: number;
  totalGainFade: number;
}

export function calculateCustomerMetrics(projects: ProjectRecord[]): CustomerMetrics[] {
  const custMap = new Map<string, ProjectRecord[]>();
  for (const p of projects) {
    const cust = p.customerName || 'Unknown';
    if (!custMap.has(cust)) custMap.set(cust, []);
    custMap.get(cust)!.push(p);
  }

  return Array.from(custMap.entries()).map(([customer, prjs]) => ({
    customer,
    projectCount: prjs.length,
    totalRevenue: prjs.reduce((s, p) => s + p.finalContractValue, 0),
    averageMargin: prjs.reduce((s, p) => s + p.finalGrossProfitMargin, 0) / prjs.length,
    gainCount: prjs.filter((p) => p.overallGainFade === 'Gain').length,
    fadeCount: prjs.filter((p) => p.overallGainFade === 'Fade').length,
    totalGainFade: prjs.reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0),
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export interface CostCategoryData {
  category: string;
  original: number;
  revised: number;
  final: number;
  variance: number;
  variancePct: number;
}

export function calculateCostBreakdown(projects: ProjectRecord[]): CostCategoryData[] {
  const categories: CostCategoryData[] = [
    {
      category: 'Labor',
      original: projects.reduce((s, p) => s + p.originalEstimatedLabor, 0),
      revised: projects.reduce((s, p) => s + p.revisedEstimatedLabor, 0),
      final: projects.reduce((s, p) => s + p.finalLabor, 0),
      variance: 0,
      variancePct: 0,
    },
    {
      category: 'Materials',
      original: projects.reduce((s, p) => s + p.originalEstimatedMaterials, 0),
      revised: projects.reduce((s, p) => s + p.revisedEstimatedMaterials, 0),
      final: projects.reduce((s, p) => s + p.finalMaterials, 0),
      variance: 0,
      variancePct: 0,
    },
    {
      category: 'Equipment',
      original: projects.reduce((s, p) => s + p.originalEstimatedEquipment, 0),
      revised: projects.reduce((s, p) => s + p.revisedEstimatedEquipment, 0),
      final: projects.reduce((s, p) => s + p.finalEquipment, 0),
      variance: 0,
      variancePct: 0,
    },
    {
      category: 'Subcontracts',
      original: projects.reduce((s, p) => s + p.originalEstimatedSubcontracts, 0),
      revised: projects.reduce((s, p) => s + p.revisedEstimatedSubcontracts, 0),
      final: projects.reduce((s, p) => s + p.finalSubcontracts, 0),
      variance: 0,
      variancePct: 0,
    },
    {
      category: 'Other',
      original: projects.reduce((s, p) => s + p.originalEstimatedOther, 0),
      revised: projects.reduce((s, p) => s + p.revisedEstimatedOther, 0),
      final: projects.reduce((s, p) => s + p.finalOther, 0),
      variance: 0,
      variancePct: 0,
    },
  ];

  for (const cat of categories) {
    cat.variance = cat.final - cat.original;
    cat.variancePct = cat.original > 0 ? (cat.final - cat.original) / cat.original : 0;
  }

  return categories;
}

export function getTopProjects(projects: ProjectRecord[], count: number = 10): ProjectRecord[] {
  return [...projects].sort((a, b) => b.finalContractValue - a.finalContractValue).slice(0, count);
}

export interface MarginDistributionItem {
  range: string;
  count: number;
  totalRevenue: number;
  totalProfit: number;
}

export function getMarginDistribution(projects: ProjectRecord[]): MarginDistributionItem[] {
  const ranges = [
    { label: '< 0%', min: -Infinity, max: 0 },
    { label: '0-5%', min: 0, max: 0.05 },
    { label: '5-10%', min: 0.05, max: 0.1 },
    { label: '10-15%', min: 0.1, max: 0.15 },
    { label: '15-20%', min: 0.15, max: 0.2 },
    { label: '20-25%', min: 0.2, max: 0.25 },
    { label: '25-30%', min: 0.25, max: 0.3 },
    { label: '> 30%', min: 0.3, max: Infinity },
  ];

  return ranges.map(({ label, min, max }) => {
    const inRange = projects.filter((p) => p.finalGrossProfitMargin >= min && p.finalGrossProfitMargin < max);
    return {
      range: label,
      count: inRange.length,
      totalRevenue: inRange.reduce((s, p) => s + p.finalContractValue, 0),
      totalProfit: inRange.reduce((s, p) => s + p.finalProfit, 0),
    };
  });
}

export interface YearMetrics {
  year: number;
  projectCount: number;
  totalRevenue: number;
  averageMargin: number;
  gainCount: number;
  fadeCount: number;
  gainRate: number;
  totalGainFade: number;
}

export function calculateYearMetrics(projects: ProjectRecord[]): YearMetrics[] {
  const yearMap = new Map<number, ProjectRecord[]>();
  for (const p of projects) {
    const yr = p.yearCompleted;
    if (!yearMap.has(yr)) yearMap.set(yr, []);
    yearMap.get(yr)!.push(p);
  }

  return Array.from(yearMap.entries()).map(([year, prjs]) => ({
    year,
    projectCount: prjs.length,
    totalRevenue: prjs.reduce((s, p) => s + p.finalContractValue, 0),
    averageMargin: prjs.reduce((s, p) => s + p.finalGrossProfitMargin, 0) / prjs.length,
    gainCount: prjs.filter((p) => p.overallGainFade === 'Gain').length,
    fadeCount: prjs.filter((p) => p.overallGainFade === 'Fade').length,
    gainRate: prjs.filter((p) => p.overallGainFade === 'Gain').length / prjs.length,
    totalGainFade: prjs.reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0),
  })).sort((a, b) => a.year - b.year);
}
