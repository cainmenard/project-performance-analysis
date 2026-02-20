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

export interface CostCategoryData {
  category: string;
  original: number;
  revised: number;
  final: number;
  variance: number;
}

export function calculateCostBreakdown(projects: ProjectRecord[]): CostCategoryData[] {
  const categories: CostCategoryData[] = [
    {
      category: 'Labor',
      original: projects.reduce((s, p) => s + p.originalEstimatedLabor, 0),
      revised: projects.reduce((s, p) => s + p.revisedEstimatedLabor, 0),
      final: projects.reduce((s, p) => s + p.finalLabor, 0),
      variance: 0,
    },
    {
      category: 'Materials',
      original: projects.reduce((s, p) => s + p.originalEstimatedMaterials, 0),
      revised: projects.reduce((s, p) => s + p.revisedEstimatedMaterials, 0),
      final: projects.reduce((s, p) => s + p.finalMaterials, 0),
      variance: 0,
    },
    {
      category: 'Equipment',
      original: projects.reduce((s, p) => s + p.originalEstimatedEquipment, 0),
      revised: projects.reduce((s, p) => s + p.revisedEstimatedEquipment, 0),
      final: projects.reduce((s, p) => s + p.finalEquipment, 0),
      variance: 0,
    },
    {
      category: 'Subcontracts',
      original: projects.reduce((s, p) => s + p.originalEstimatedSubcontracts, 0),
      revised: projects.reduce((s, p) => s + p.revisedEstimatedSubcontracts, 0),
      final: projects.reduce((s, p) => s + p.finalSubcontracts, 0),
      variance: 0,
    },
    {
      category: 'Other',
      original: projects.reduce((s, p) => s + p.originalEstimatedOther, 0),
      revised: projects.reduce((s, p) => s + p.revisedEstimatedOther, 0),
      final: projects.reduce((s, p) => s + p.finalOther, 0),
      variance: 0,
    },
  ];

  for (const cat of categories) {
    cat.variance = cat.final - cat.original;
  }

  return categories;
}

export function getTopProjects(projects: ProjectRecord[], count: number = 10): ProjectRecord[] {
  return [...projects].sort((a, b) => b.finalContractValue - a.finalContractValue).slice(0, count);
}

// ===== Root Cause Analysis =====

export interface GainFadeRootCause {
  totalGainFade: number;
  changeOrderImpact: number;
  executionVariance: number;
  changeOrderPct: number;
  executionPct: number;
  executionCostBreakdown: {
    labor: number;
    materials: number;
    equipment: number;
    subcontracts: number;
    other: number;
    revenueVariance: number;
  };
  projectBreakdown: {
    projectName: string;
    projectNumber: string;
    totalGainFade: number;
    changeOrderImpact: number;
    executionVariance: number;
    overallGainFade: 'Gain' | 'Fade';
  }[];
}

export function calculateGainFadeRootCause(projects: ProjectRecord[]): GainFadeRootCause {
  let changeOrderImpact = 0;
  let executionVariance = 0;
  let totalGainFade = 0;

  const executionCostBreakdown = { labor: 0, materials: 0, equipment: 0, subcontracts: 0, other: 0, revenueVariance: 0 };

  const projectBreakdown = projects.map((p) => {
    const coImpact = p.revisedEstimatedProfit - p.originalEstimatedProfit;
    const execVar = p.finalProfit - p.revisedEstimatedProfit;
    const gf = p.gainFadeOrgFinalDollars;

    changeOrderImpact += coImpact;
    executionVariance += execVar;
    totalGainFade += gf;

    executionCostBreakdown.labor += p.finalLabor - p.revisedEstimatedLabor;
    executionCostBreakdown.materials += p.finalMaterials - p.revisedEstimatedMaterials;
    executionCostBreakdown.equipment += p.finalEquipment - p.revisedEstimatedEquipment;
    executionCostBreakdown.subcontracts += p.finalSubcontracts - p.revisedEstimatedSubcontracts;
    executionCostBreakdown.other += p.finalOther - p.revisedEstimatedOther;
    executionCostBreakdown.revenueVariance += p.finalContractValue - p.revisedContractValue;

    return {
      projectName: p.projectName,
      projectNumber: p.projectNumber,
      totalGainFade: gf,
      changeOrderImpact: coImpact,
      executionVariance: execVar,
      overallGainFade: p.overallGainFade,
    };
  });

  const absTotal = Math.abs(changeOrderImpact) + Math.abs(executionVariance);

  return {
    totalGainFade,
    changeOrderImpact,
    executionVariance,
    changeOrderPct: absTotal > 0 ? Math.abs(changeOrderImpact) / absTotal : 0,
    executionPct: absTotal > 0 ? Math.abs(executionVariance) / absTotal : 0,
    executionCostBreakdown,
    projectBreakdown: projectBreakdown.sort((a, b) => a.totalGainFade - b.totalGainFade),
  };
}

// ===== Data Quality Validation =====

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  warnings: DataQualityWarning[];
  completeness: { field: string; filledCount: number; totalCount: number; pct: number }[];
  outliers: { projectName: string; projectNumber: string; field: string; value: number; reason: string }[];
  overallScore: number;
}

export interface DataQualityWarning {
  severity: 'info' | 'warning' | 'error';
  message: string;
  count: number;
}

export function calculateDataQuality(projects: ProjectRecord[]): DataQualityReport {
  const total = projects.length;
  const warnings: DataQualityWarning[] = [];
  const outliers: DataQualityReport['outliers'] = [];

  const keyFields: { field: string; accessor: (p: ProjectRecord) => unknown; type: 'string' | 'number' }[] = [
    { field: 'Project Name', accessor: (p) => p.projectName, type: 'string' },
    { field: 'Customer Name', accessor: (p) => p.customerName, type: 'string' },
    { field: 'Division', accessor: (p) => p.division, type: 'string' },
    { field: 'Market Segment', accessor: (p) => p.marketSegment, type: 'string' },
    { field: 'Year Completed', accessor: (p) => p.yearCompleted, type: 'number' },
    { field: 'Original Contract Value', accessor: (p) => p.originalContractValue, type: 'number' },
    { field: 'Final Contract Value', accessor: (p) => p.finalContractValue, type: 'number' },
    { field: 'Final Cost', accessor: (p) => p.finalCost, type: 'number' },
    { field: 'Final Profit', accessor: (p) => p.finalProfit, type: 'number' },
    { field: 'Final Labor Hours', accessor: (p) => p.finalLaborHours, type: 'number' },
    { field: 'Original Estimated Cost', accessor: (p) => p.originalEstimatedCost, type: 'number' },
  ];

  const completeness = keyFields.map(({ field, accessor, type }) => {
    const filled = projects.filter((p) => {
      const v = accessor(p);
      return type === 'string' ? v !== '' : v !== 0;
    }).length;
    return { field, filledCount: filled, totalCount: total, pct: total > 0 ? filled / total : 0 };
  });

  const missingNames = completeness.find((c) => c.field === 'Project Name');
  if (missingNames && missingNames.pct < 1) {
    warnings.push({ severity: 'error', message: 'Projects missing names', count: total - missingNames.filledCount });
  }

  const missingCost = completeness.find((c) => c.field === 'Final Cost');
  if (missingCost && missingCost.pct < 0.9) {
    warnings.push({ severity: 'warning', message: 'Projects missing final cost data', count: total - missingCost.filledCount });
  }

  const missingHours = completeness.find((c) => c.field === 'Final Labor Hours');
  if (missingHours && missingHours.pct < 0.8) {
    warnings.push({ severity: 'info', message: 'Projects missing labor hours (limits productivity analysis)', count: total - missingHours.filledCount });
  }

  const numbers = projects.map((p) => p.projectNumber).filter(Boolean);
  const dupes = numbers.filter((n, i) => numbers.indexOf(n) !== i);
  if (dupes.length > 0) {
    warnings.push({ severity: 'warning', message: 'Duplicate project numbers detected', count: new Set(dupes).size });
  }

  for (const p of projects) {
    if (p.finalGrossProfitMargin > 0.6) {
      outliers.push({ projectName: p.projectName, projectNumber: p.projectNumber, field: 'Margin', value: p.finalGrossProfitMargin, reason: 'Unusually high margin (>60%)' });
    }
    if (p.finalGrossProfitMargin < -0.3) {
      outliers.push({ projectName: p.projectName, projectNumber: p.projectNumber, field: 'Margin', value: p.finalGrossProfitMargin, reason: 'Severely negative margin (<-30%)' });
    }
    if (p.finalCost > 0 && p.originalEstimatedCost > 0 && p.finalCost > p.originalEstimatedCost * 3) {
      outliers.push({ projectName: p.projectName, projectNumber: p.projectNumber, field: 'Cost', value: p.finalCost, reason: 'Final cost >3x original estimate' });
    }
    if (p.finalContractValue < 0) {
      outliers.push({ projectName: p.projectName, projectNumber: p.projectNumber, field: 'Contract', value: p.finalContractValue, reason: 'Negative contract value' });
    }
  }

  if (outliers.length > 0) {
    warnings.push({ severity: 'info', message: 'Projects with unusual values detected', count: outliers.length });
  }

  const avgCompleteness = completeness.reduce((s, c) => s + c.pct, 0) / completeness.length;
  const errorPenalty = warnings.filter((w) => w.severity === 'error').length * 10;
  const warningPenalty = warnings.filter((w) => w.severity === 'warning').length * 5;
  const overallScore = Math.max(0, Math.min(100, Math.round(avgCompleteness * 100 - errorPenalty - warningPenalty)));

  return { totalRows: total, validRows: total, warnings, completeness, outliers, overallScore };
}

// ===== Segment Go/No-Go Scoring =====

export interface SegmentScorecard {
  segment: string;
  projectCount: number;
  totalRevenue: number;
  averageMargin: number;
  gainRate: number;
  avgContractSize: number;
  totalGainFade: number;
  marginScore: number;
  gainRateScore: number;
  volumeScore: number;
  consistencyScore: number;
  totalScore: number;
  recommendation: 'Pursue Aggressively' | 'Selective Pursuit' | 'Improve or Exit' | 'Exit';
  reasoning: string;
}

export function calculateSegmentScorecards(projects: ProjectRecord[]): SegmentScorecard[] {
  const segmentMap = new Map<string, ProjectRecord[]>();
  for (const p of projects) {
    const seg = p.marketSegment || 'Unknown';
    if (!segmentMap.has(seg)) segmentMap.set(seg, []);
    segmentMap.get(seg)!.push(p);
  }

  const allMargins = projects.map((p) => p.finalGrossProfitMargin);
  const maxMargin = Math.max(...allMargins, 0.01);
  const maxRevenue = Math.max(...Array.from(segmentMap.values()).map((ps) => ps.reduce((s, p) => s + p.finalContractValue, 0)), 1);

  return Array.from(segmentMap.entries()).map(([segment, prjs]) => {
    const totalRevenue = prjs.reduce((s, p) => s + p.finalContractValue, 0);
    const averageMargin = prjs.reduce((s, p) => s + p.finalGrossProfitMargin, 0) / prjs.length;
    const gainCount = prjs.filter((p) => p.overallGainFade === 'Gain').length;
    const gainRate = prjs.length > 0 ? gainCount / prjs.length : 0;
    const avgContractSize = prjs.length > 0 ? totalRevenue / prjs.length : 0;
    const totalGainFade = prjs.reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0);

    const marginScore = Math.min(25, Math.round((averageMargin / Math.max(maxMargin, 0.15)) * 25));
    const gainRateScore = Math.min(25, Math.round(gainRate * 25));
    const volumeScore = Math.min(25, Math.round((totalRevenue / maxRevenue) * 25));

    const margins = prjs.map((p) => p.finalGrossProfitMargin);
    const marginStdDev = margins.length > 1
      ? Math.sqrt(margins.reduce((s, m) => s + (m - averageMargin) ** 2, 0) / margins.length)
      : 0;
    const consistencyScore = Math.min(25, Math.max(0, Math.round(25 - marginStdDev * 100)));

    const totalScore = marginScore + gainRateScore + volumeScore + consistencyScore;

    let recommendation: SegmentScorecard['recommendation'];
    let reasoning: string;

    if (totalScore >= 70) {
      recommendation = 'Pursue Aggressively';
      reasoning = `Strong performer with ${(averageMargin * 100).toFixed(1)}% margins and ${(gainRate * 100).toFixed(0)}% gain rate. Increase capacity and pursuit effort.`;
    } else if (totalScore >= 50) {
      recommendation = 'Selective Pursuit';
      reasoning = `Moderate performer. Be selective — pursue projects with favorable scope and established customers. Average margin: ${(averageMargin * 100).toFixed(1)}%.`;
    } else if (totalScore >= 30) {
      recommendation = 'Improve or Exit';
      reasoning = `Below-average performance at ${(averageMargin * 100).toFixed(1)}% margin and ${(gainRate * 100).toFixed(0)}% gain rate. Identify root causes before committing resources.`;
    } else {
      recommendation = 'Exit';
      reasoning = `Poor performance. Consider exiting this segment or restructuring approach entirely. Current margin: ${(averageMargin * 100).toFixed(1)}%.`;
    }

    return {
      segment, projectCount: prjs.length, totalRevenue, averageMargin, gainRate,
      avgContractSize, totalGainFade, marginScore, gainRateScore, volumeScore,
      consistencyScore, totalScore, recommendation, reasoning,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

// ===== Labor Productivity =====

export interface LaborProductivityMetrics {
  division: string;
  revenuePerHour: number;
  costPerHour: number;
  totalHours: number;
  totalRevenue: number;
  totalLaborCost: number;
  estimatedHours: number;
  hoursVariance: number;
  hoursVariancePct: number;
  projectCount: number;
}

export function calculateLaborProductivity(projects: ProjectRecord[]): LaborProductivityMetrics[] {
  const divMap = new Map<string, ProjectRecord[]>();
  for (const p of projects) {
    const div = p.division || 'Unknown';
    if (!divMap.has(div)) divMap.set(div, []);
    divMap.get(div)!.push(p);
  }

  return Array.from(divMap.entries()).map(([division, prjs]) => {
    const totalHours = prjs.reduce((s, p) => s + p.finalLaborHours, 0);
    const estimatedHours = prjs.reduce((s, p) => s + p.originalEstimatedLaborHours, 0);
    const totalRevenue = prjs.reduce((s, p) => s + p.finalContractValue, 0);
    const totalLaborCost = prjs.reduce((s, p) => s + p.finalLabor, 0);

    return {
      division,
      revenuePerHour: totalHours > 0 ? totalRevenue / totalHours : 0,
      costPerHour: totalHours > 0 ? totalLaborCost / totalHours : 0,
      totalHours,
      totalRevenue,
      totalLaborCost,
      estimatedHours,
      hoursVariance: totalHours - estimatedHours,
      hoursVariancePct: estimatedHours > 0 ? (totalHours - estimatedHours) / estimatedHours : 0,
      projectCount: prjs.length,
    };
  }).sort((a, b) => b.revenuePerHour - a.revenuePerHour);
}

export function getMarginDistribution(projects: ProjectRecord[]): { range: string; count: number }[] {
  const ranges = [
    { label: '< 0%', min: -Infinity, max: 0 },
    { label: '0-10%', min: 0, max: 0.1 },
    { label: '10-20%', min: 0.1, max: 0.2 },
    { label: '20-30%', min: 0.2, max: 0.3 },
    { label: '30-40%', min: 0.3, max: 0.4 },
    { label: '> 40%', min: 0.4, max: Infinity },
  ];

  return ranges.map(({ label, min, max }) => ({
    range: label,
    count: projects.filter((p) => p.finalGrossProfitMargin >= min && p.finalGrossProfitMargin < max).length,
  }));
}
