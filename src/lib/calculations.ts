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
  const projectManagers = [...new Set(projects.map((p) => p.projectManager))].filter(Boolean).sort();
  const estimators = [...new Set(projects.map((p) => p.estimator))].filter(Boolean).sort();

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
    projectManagers,
    estimators,
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

// ============================================================
// COST DRIVER ANALYSIS ENGINE
// ============================================================

export interface CostDriverDetail {
  category: string;
  varianceDollars: number;
  variancePct: number;
  hoursVariance?: number;      // labor hours only
  hoursVariancePct?: number;   // labor hours only
  shareOfTotalVariance: number; // what % of total cost variance this category represents
}

export interface ProjectCostDrivers {
  project: ProjectRecord;
  totalCostVariance: number;
  totalCostVariancePct: number;
  drivers: CostDriverDetail[];        // sorted by absolute variance desc
  primaryDriver: CostDriverDetail;    // the biggest cost driver
  secondaryDriver?: CostDriverDetail; // second biggest if significant
  diagnosis: string;                  // human-readable summary
}

/** Analyze which cost categories drove gain/fade for a single project */
export function analyzeProjectCostDrivers(p: ProjectRecord): ProjectCostDrivers {
  const totalCostVariance = p.finalCost - p.originalEstimatedCost;
  const totalCostVariancePct = p.originalEstimatedCost > 0 ? totalCostVariance / p.originalEstimatedCost : 0;

  const drivers: CostDriverDetail[] = [
    {
      category: 'Labor',
      varianceDollars: p.finalLabor - p.originalEstimatedLabor,
      variancePct: p.originalEstimatedLabor > 0 ? (p.finalLabor - p.originalEstimatedLabor) / p.originalEstimatedLabor : 0,
      hoursVariance: p.finalLaborHours - p.originalEstimatedLaborHours,
      hoursVariancePct: p.originalEstimatedLaborHours > 0 ? (p.finalLaborHours - p.originalEstimatedLaborHours) / p.originalEstimatedLaborHours : 0,
      shareOfTotalVariance: 0,
    },
    {
      category: 'Materials',
      varianceDollars: p.finalMaterials - p.originalEstimatedMaterials,
      variancePct: p.originalEstimatedMaterials > 0 ? (p.finalMaterials - p.originalEstimatedMaterials) / p.originalEstimatedMaterials : 0,
      shareOfTotalVariance: 0,
    },
    {
      category: 'Equipment',
      varianceDollars: p.finalEquipment - p.originalEstimatedEquipment,
      variancePct: p.originalEstimatedEquipment > 0 ? (p.finalEquipment - p.originalEstimatedEquipment) / p.originalEstimatedEquipment : 0,
      shareOfTotalVariance: 0,
    },
    {
      category: 'Subcontracts',
      varianceDollars: p.finalSubcontracts - p.originalEstimatedSubcontracts,
      variancePct: p.originalEstimatedSubcontracts > 0 ? (p.finalSubcontracts - p.originalEstimatedSubcontracts) / p.originalEstimatedSubcontracts : 0,
      shareOfTotalVariance: 0,
    },
    {
      category: 'Other',
      varianceDollars: p.finalOther - p.originalEstimatedOther,
      variancePct: p.originalEstimatedOther > 0 ? (p.finalOther - p.originalEstimatedOther) / p.originalEstimatedOther : 0,
      shareOfTotalVariance: 0,
    },
  ];

  const totalAbsVariance = drivers.reduce((s, d) => s + Math.abs(d.varianceDollars), 0);
  for (const d of drivers) {
    d.shareOfTotalVariance = totalAbsVariance > 0 ? Math.abs(d.varianceDollars) / totalAbsVariance : 0;
  }

  // Sort by absolute variance descending
  drivers.sort((a, b) => Math.abs(b.varianceDollars) - Math.abs(a.varianceDollars));

  const primary = drivers[0];
  const secondary = drivers[1]?.shareOfTotalVariance > 0.15 ? drivers[1] : undefined;

  const diagnosis = generateProjectDiagnosis(p, primary, secondary, totalCostVariance);

  return {
    project: p,
    totalCostVariance,
    totalCostVariancePct,
    drivers,
    primaryDriver: primary,
    secondaryDriver: secondary,
    diagnosis,
  };
}

function generateProjectDiagnosis(
  p: ProjectRecord,
  primary: CostDriverDetail,
  secondary: CostDriverDetail | undefined,
  totalVariance: number,
): string {
  const isFade = p.overallGainFade === 'Fade';

  if (!isFade) {
    if (primary.category === 'Labor' && primary.varianceDollars < 0) {
      return `Gained margin through labor efficiency — used ${Math.abs(primary.hoursVariance ?? 0).toLocaleString()} fewer hours than estimated.`;
    }
    return `Gained margin primarily through ${primary.category.toLowerCase()} savings (${formatPctShort(Math.abs(primary.variancePct))} under estimate).`;
  }

  // Fade diagnosis — be specific about the cost driver
  if (primary.category === 'Labor') {
    const hoursOver = primary.hoursVariance ?? 0;
    if (hoursOver > 0) {
      const parts = [`Labor is the primary cost driver — ${hoursOver.toLocaleString()} more hours than estimated (+${formatPctShort(primary.hoursVariancePct ?? 0)})`];
      if (secondary) {
        parts.push(`${secondary.category} also overran by ${formatPctShort(Math.abs(secondary.variancePct))}`);
      }
      return parts.join('. ') + '.';
    }
    return `Labor costs exceeded estimate by ${formatPctShort(Math.abs(primary.variancePct))}, driving the majority of the ${formatDollarShort(Math.abs(totalVariance))} cost overrun.`;
  }

  if (primary.category === 'Materials') {
    const parts = [`Materials costs drove the fade — +${formatPctShort(Math.abs(primary.variancePct))} over estimate`];
    if (secondary?.category === 'Labor') {
      parts.push(`compounded by labor overruns (+${formatPctShort(Math.abs(secondary.variancePct))})`);
    }
    return parts.join(', ') + '.';
  }

  if (primary.category === 'Subcontracts') {
    return `Subcontractor costs exceeded estimate by ${formatPctShort(Math.abs(primary.variancePct))}, representing ${formatPctShort(primary.shareOfTotalVariance)} of the total cost overrun.`;
  }

  if (primary.category === 'Equipment') {
    return `Equipment costs drove the fade at +${formatPctShort(Math.abs(primary.variancePct))} over estimate.`;
  }

  return `Cost overrun of ${formatDollarShort(Math.abs(totalVariance))} driven primarily by ${primary.category.toLowerCase()} (+${formatPctShort(Math.abs(primary.variancePct))}).`;
}

function formatPctShort(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function formatDollarShort(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

// ============================================================
// PORTFOLIO-LEVEL COST DRIVER PATTERNS
// ============================================================

export interface CostDriverPattern {
  category: string;
  timesPrimaryDriver: number;
  totalVarianceDollars: number;
  averageVariancePct: number;
  affectedProjects: number;
}

export interface SegmentCostPattern {
  segment: string;
  fadeCount: number;
  fadeDollars: number;
  primaryDriverCategory: string;
  primaryDriverPct: number; // how often this category is the primary driver
  avgLaborHoursVariancePct: number;
  avgMaterialsVariancePct: number;
}

export interface PortfolioCostDriverAnalysis {
  fadedProjectDrivers: ProjectCostDrivers[];
  gainedProjectDrivers: ProjectCostDrivers[];
  fadeDriverPatterns: CostDriverPattern[];
  segmentCostPatterns: SegmentCostPattern[];
  overallPrimaryFadeDriver: string;
  laborDrivenFadeCount: number;
  materialsDrivenFadeCount: number;
  equipmentDrivenFadeCount: number;
  subsDrivenFadeCount: number;
}

/** Analyze cost driver patterns across the entire portfolio */
export function analyzePortfolioCostDrivers(projects: ProjectRecord[]): PortfolioCostDriverAnalysis {
  const allDrivers = projects.map(analyzeProjectCostDrivers);
  const fadedDrivers = allDrivers.filter((d) => d.project.overallGainFade === 'Fade');
  const gainedDrivers = allDrivers.filter((d) => d.project.overallGainFade === 'Gain');

  // Count how often each category is the primary fade driver
  const driverCounts = new Map<string, { count: number; totalVariance: number; variancePcts: number[] }>();
  for (const fd of fadedDrivers) {
    const cat = fd.primaryDriver.category;
    if (!driverCounts.has(cat)) driverCounts.set(cat, { count: 0, totalVariance: 0, variancePcts: [] });
    const entry = driverCounts.get(cat)!;
    entry.count++;
    entry.totalVariance += Math.abs(fd.primaryDriver.varianceDollars);
    entry.variancePcts.push(Math.abs(fd.primaryDriver.variancePct));
  }

  const fadeDriverPatterns: CostDriverPattern[] = Array.from(driverCounts.entries())
    .map(([category, data]) => ({
      category,
      timesPrimaryDriver: data.count,
      totalVarianceDollars: data.totalVariance,
      averageVariancePct: data.variancePcts.length > 0 ? data.variancePcts.reduce((a, b) => a + b, 0) / data.variancePcts.length : 0,
      affectedProjects: data.count,
    }))
    .sort((a, b) => b.timesPrimaryDriver - a.timesPrimaryDriver);

  // Segment-level cost patterns for faded projects
  const segMap = new Map<string, ProjectCostDrivers[]>();
  for (const fd of fadedDrivers) {
    const seg = fd.project.marketSegment;
    if (!segMap.has(seg)) segMap.set(seg, []);
    segMap.get(seg)!.push(fd);
  }

  const segmentCostPatterns: SegmentCostPattern[] = Array.from(segMap.entries()).map(([segment, fds]) => {
    const driverFreq = new Map<string, number>();
    let totalLaborHoursPct = 0;
    let totalMatPct = 0;
    for (const fd of fds) {
      driverFreq.set(fd.primaryDriver.category, (driverFreq.get(fd.primaryDriver.category) ?? 0) + 1);
      const laborDriver = fd.drivers.find((d) => d.category === 'Labor');
      const matDriver = fd.drivers.find((d) => d.category === 'Materials');
      totalLaborHoursPct += laborDriver?.hoursVariancePct ?? 0;
      totalMatPct += matDriver?.variancePct ?? 0;
    }
    const topDriver = Array.from(driverFreq.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      segment,
      fadeCount: fds.length,
      fadeDollars: fds.reduce((s, fd) => s + Math.abs(fd.project.gainFadeOrgFinalDollars), 0),
      primaryDriverCategory: topDriver?.[0] ?? 'Unknown',
      primaryDriverPct: fds.length > 0 && topDriver ? topDriver[1] / fds.length : 0,
      avgLaborHoursVariancePct: fds.length > 0 ? totalLaborHoursPct / fds.length : 0,
      avgMaterialsVariancePct: fds.length > 0 ? totalMatPct / fds.length : 0,
    };
  }).sort((a, b) => b.fadeDollars - a.fadeDollars);

  const laborCount = fadedDrivers.filter((d) => d.primaryDriver.category === 'Labor').length;
  const matsCount = fadedDrivers.filter((d) => d.primaryDriver.category === 'Materials').length;
  const equipCount = fadedDrivers.filter((d) => d.primaryDriver.category === 'Equipment').length;
  const subsCount = fadedDrivers.filter((d) => d.primaryDriver.category === 'Subcontracts').length;

  const overallPrimary = fadeDriverPatterns[0]?.category ?? 'Labor';

  return {
    fadedProjectDrivers: fadedDrivers,
    gainedProjectDrivers: gainedDrivers,
    fadeDriverPatterns,
    segmentCostPatterns,
    overallPrimaryFadeDriver: overallPrimary,
    laborDrivenFadeCount: laborCount,
    materialsDrivenFadeCount: matsCount,
    equipmentDrivenFadeCount: equipCount,
    subsDrivenFadeCount: subsCount,
  };
}

// ============================================================
// DYNAMIC INSIGHT ENGINE
// ============================================================

export interface DynamicInsight {
  type: 'warning' | 'opportunity' | 'strength' | 'pattern';
  severity: number; // 0-10, higher = more important
  headline: string;
  detail: string;
  category: 'cost-driver' | 'segment' | 'customer' | 'personnel' | 'trend' | 'risk';
  relatedProjects?: string[]; // project numbers
}

/** Generate specific, data-driven insights from the portfolio */
export function generateDynamicInsights(projects: ProjectRecord[]): DynamicInsight[] {
  if (projects.length === 0) return [];

  const insights: DynamicInsight[] = [];
  const analysis = analyzePortfolioCostDrivers(projects);
  const summary = calculatePortfolioSummary(projects);
  const fadedProjects = projects.filter((p) => p.overallGainFade === 'Fade');
  const gainedProjects = projects.filter((p) => p.overallGainFade === 'Gain');

  // --- COST DRIVER INSIGHTS ---

  // Primary fade driver across portfolio
  if (fadedProjects.length > 0 && analysis.fadeDriverPatterns.length > 0) {
    const top = analysis.fadeDriverPatterns[0];
    const pct = fadedProjects.length > 0 ? top.timesPrimaryDriver / fadedProjects.length : 0;

    if (top.category === 'Labor' && pct >= 0.5) {
      const avgHoursOver = analysis.fadedProjectDrivers
        .map((d) => d.drivers.find((c) => c.category === 'Labor')?.hoursVariancePct ?? 0)
        .reduce((a, b) => a + b, 0) / analysis.fadedProjectDrivers.length;

      insights.push({
        type: 'warning',
        severity: 9,
        headline: `Labor is the #1 fade driver — primary cause in ${top.timesPrimaryDriver} of ${fadedProjects.length} faded projects`,
        detail: `Faded projects averaged +${formatPctShort(avgHoursOver)} more labor hours than estimated, totaling ${formatDollarShort(top.totalVarianceDollars)} in labor cost overruns. This points to either scope complexity being underestimated in bids, or field productivity running below plan. Review labor hour assumptions in estimating templates and compare crew productivity rates against bid assumptions.`,
        category: 'cost-driver',
        relatedProjects: analysis.fadedProjectDrivers.filter((d) => d.primaryDriver.category === 'Labor').map((d) => d.project.projectNumber),
      });
    } else if (top.category === 'Materials' && pct >= 0.4) {
      insights.push({
        type: 'warning',
        severity: 8,
        headline: `Materials costs are the primary fade driver in ${top.timesPrimaryDriver} of ${fadedProjects.length} faded projects`,
        detail: `Materials overruns averaged +${formatPctShort(top.averageVariancePct)}, totaling ${formatDollarShort(top.totalVarianceDollars)}. This could indicate material price escalation not captured in estimates, scope additions not covered by change orders, or waste/rework. Consider locking material pricing earlier and improving takeoff accuracy.`,
        category: 'cost-driver',
      });
    } else if (fadedProjects.length > 0) {
      insights.push({
        type: 'warning',
        severity: 7,
        headline: `${top.category} costs are the most common fade driver (${top.timesPrimaryDriver} of ${fadedProjects.length} faded projects)`,
        detail: `Averaging +${formatPctShort(top.averageVariancePct)} over estimate. Total impact: ${formatDollarShort(top.totalVarianceDollars)}.`,
        category: 'cost-driver',
      });
    }

    // Secondary driver if different from primary
    if (analysis.fadeDriverPatterns.length >= 2) {
      const second = analysis.fadeDriverPatterns[1];
      if (second.timesPrimaryDriver >= 2) {
        insights.push({
          type: 'pattern',
          severity: 6,
          headline: `${second.category} is the secondary fade driver (${second.timesPrimaryDriver} projects)`,
          detail: `While ${top.category.toLowerCase()} leads, ${second.category.toLowerCase()} overruns of +${formatPctShort(second.averageVariancePct)} are also significant — ${formatDollarShort(second.totalVarianceDollars)} in total. Multiple cost categories overrunning simultaneously suggests systemic estimating gaps rather than isolated execution issues.`,
          category: 'cost-driver',
        });
      }
    }
  }

  // --- SEGMENT-SPECIFIC COST PATTERNS ---

  for (const scp of analysis.segmentCostPatterns) {
    if (scp.fadeCount >= 2) {
      const segTotal = projects.filter((p) => p.marketSegment === scp.segment);
      const fadeRate = segTotal.length > 0 ? scp.fadeCount / segTotal.length : 0;

      if (scp.primaryDriverCategory === 'Labor' && scp.avgLaborHoursVariancePct > 0.15) {
        insights.push({
          type: 'warning',
          severity: 8,
          headline: `${scp.segment} fades are labor-driven — avg +${formatPctShort(scp.avgLaborHoursVariancePct)} hours over estimate`,
          detail: `${scp.fadeCount} of ${segTotal.length} ${scp.segment} projects faded (${formatPctShort(fadeRate)} fade rate), losing ${formatDollarShort(scp.fadeDollars)}. The consistent labor hour overruns in this segment suggest ${scp.segment.toLowerCase()} scope complexity is being systematically underestimated. Consider adding a complexity factor to labor estimates for ${scp.segment.toLowerCase()} projects.`,
          category: 'segment',
          relatedProjects: fadedProjects.filter((p) => p.marketSegment === scp.segment).map((p) => p.projectNumber),
        });
      } else if (scp.primaryDriverCategory === 'Materials' && scp.avgMaterialsVariancePct > 0.1) {
        insights.push({
          type: 'warning',
          severity: 7,
          headline: `${scp.segment} fades are materials-driven — avg +${formatPctShort(scp.avgMaterialsVariancePct)} over estimate`,
          detail: `${scp.fadeCount} of ${segTotal.length} ${scp.segment} projects faded. Materials overruns in this segment may reflect specification changes, price volatility, or incomplete scope definition in the takeoff process.`,
          category: 'segment',
        });
      }
    }
  }

  // --- PERSONNEL PATTERNS (without ranking) ---

  // PM workload and segment alignment
  const pmMap = new Map<string, ProjectRecord[]>();
  for (const p of projects) {
    if (!p.projectManager) continue;
    if (!pmMap.has(p.projectManager)) pmMap.set(p.projectManager, []);
    pmMap.get(p.projectManager)!.push(p);
  }

  // Check for PM workload concentration risk
  for (const [pm, prjs] of pmMap.entries()) {
    const pmRevenue = prjs.reduce((s, p) => s + p.finalContractValue, 0);
    const revShare = summary.totalRevenue > 0 ? pmRevenue / summary.totalRevenue : 0;
    if (revShare > 0.25 && prjs.length >= 5) {
      insights.push({
        type: 'pattern',
        severity: 5,
        headline: `${formatPctShort(revShare)} of portfolio revenue managed by one PM (${pm})`,
        detail: `${pm} manages ${prjs.length} projects totaling ${formatDollarShort(pmRevenue)}. This concentration creates succession risk — if this PM is unavailable, a significant portion of the portfolio is exposed. Consider cross-training and knowledge transfer.`,
        category: 'personnel',
      });
    }
  }

  // Estimator segment specialization gaps
  const estMap = new Map<string, ProjectRecord[]>();
  for (const p of projects) {
    if (!p.estimator) continue;
    if (!estMap.has(p.estimator)) estMap.set(p.estimator, []);
    estMap.get(p.estimator)!.push(p);
  }

  // Check for estimator working outside their typical segments
  for (const [est, prjs] of estMap.entries()) {
    const segCounts = new Map<string, { total: number; faded: number }>();
    for (const p of prjs) {
      if (!segCounts.has(p.marketSegment)) segCounts.set(p.marketSegment, { total: 0, faded: 0 });
      const entry = segCounts.get(p.marketSegment)!;
      entry.total++;
      if (p.overallGainFade === 'Fade') entry.faded++;
    }

    // Find segments where this estimator has high fade rates vs their average
    const estGainRate = prjs.filter((p) => p.overallGainFade === 'Gain').length / prjs.length;
    for (const [seg, counts] of segCounts.entries()) {
      if (counts.total >= 2) {
        const segFadeRate = counts.faded / counts.total;
        if (segFadeRate > 0.6 && segFadeRate > (1 - estGainRate) + 0.2) {
          insights.push({
            type: 'pattern',
            severity: 6,
            headline: `${est}'s ${seg} estimates show higher fade rates than their other segments`,
            detail: `${counts.faded} of ${counts.total} ${seg} projects estimated by ${est} faded, compared to an overall ${formatPctShort(estGainRate)} gain rate across all their work. This may indicate segment-specific complexity that requires additional estimating resources, historical data review, or peer review for ${seg.toLowerCase()} bids.`,
            category: 'personnel',
          });
        }
      }
    }
  }

  // PM-segment patterns: identify where PMs consistently work in segments that fade
  for (const [pm, prjs] of pmMap.entries()) {
    const segsManaged = [...new Set(prjs.map((p) => p.marketSegment))];
    if (segsManaged.length >= 2) {
      const segPerf = segsManaged.map((seg) => {
        const segPrjs = prjs.filter((p) => p.marketSegment === seg);
        return {
          segment: seg,
          count: segPrjs.length,
          gainRate: segPrjs.filter((p) => p.overallGainFade === 'Gain').length / segPrjs.length,
        };
      }).filter((s) => s.count >= 2);

      const bestSeg = segPerf.reduce((a, b) => a.gainRate > b.gainRate ? a : b, segPerf[0]);
      const worstSeg = segPerf.reduce((a, b) => a.gainRate < b.gainRate ? a : b, segPerf[0]);

      if (bestSeg && worstSeg && bestSeg.segment !== worstSeg.segment && bestSeg.gainRate - worstSeg.gainRate > 0.4) {
        insights.push({
          type: 'opportunity',
          severity: 5,
          headline: `${pm} shows different outcomes across segments`,
          detail: `${formatPctShort(bestSeg.gainRate)} gain rate in ${bestSeg.segment} (${bestSeg.count} projects) vs ${formatPctShort(worstSeg.gainRate)} in ${worstSeg.segment} (${worstSeg.count} projects). This isn't about PM capability — it likely reflects the different risk profiles of these segments. Consider whether ${worstSeg.segment.toLowerCase()} projects need different estimating approaches, crew configurations, or tighter change order management.`,
          category: 'personnel',
        });
      }
    }
  }

  // --- TREND INSIGHTS ---

  const yearMetrics = calculateYearMetrics(projects);
  if (yearMetrics.length >= 2) {
    const latest = yearMetrics[yearMetrics.length - 1];
    const previous = yearMetrics[yearMetrics.length - 2];

    if (latest.gainRate > previous.gainRate + 0.1) {
      insights.push({
        type: 'strength',
        severity: 7,
        headline: `Gain rate improving: ${formatPctShort(previous.gainRate)} (${previous.year}) → ${formatPctShort(latest.gainRate)} (${latest.year})`,
        detail: `Estimating accuracy is trending in the right direction. Identify what changed — better estimating processes, more selective bidding, or improved field execution — and institutionalize it.`,
        category: 'trend',
      });
    } else if (latest.gainRate < previous.gainRate - 0.1) {
      insights.push({
        type: 'warning',
        severity: 8,
        headline: `Gain rate declining: ${formatPctShort(previous.gainRate)} (${previous.year}) → ${formatPctShort(latest.gainRate)} (${latest.year})`,
        detail: `More projects are fading than last year. Review whether this reflects changes in project mix (more complex segments), estimating staff turnover, or market conditions (labor shortages, price escalation).`,
        category: 'trend',
      });
    }

    if (latest.averageMargin < previous.averageMargin - 0.02) {
      insights.push({
        type: 'warning',
        severity: 7,
        headline: `Average margin declining: ${formatPctShort(previous.averageMargin)} (${previous.year}) → ${formatPctShort(latest.averageMargin)} (${latest.year})`,
        detail: `A ${formatPctShort(Math.abs(latest.averageMargin - previous.averageMargin))} margin decline across ${latest.projectCount} projects represents ${formatDollarShort(latest.totalRevenue * Math.abs(latest.averageMargin - previous.averageMargin))} in profit impact. Investigate whether this is pricing pressure, cost inflation, or project mix shift.`,
        category: 'trend',
      });
    }
  }

  // --- CUSTOMER INSIGHTS ---

  const customers = calculateCustomerMetrics(projects);
  for (const cust of customers) {
    if (cust.projectCount >= 3 && cust.fadeCount > cust.gainCount) {
      insights.push({
        type: 'pattern',
        severity: 5,
        headline: `${cust.customer} projects fade more often than they gain (${cust.fadeCount}F / ${cust.gainCount}G)`,
        detail: `Across ${cust.projectCount} projects (${formatDollarShort(cust.totalRevenue)} revenue), this GC relationship shows a pattern. This could reflect project types they bring, their change order processes, or scheduling practices that impact your labor productivity.`,
        category: 'customer',
      });
    }
  }

  // --- LARGE PROJECT RISK ---

  const largeProjects = projects.filter((p) => p.finalContractValue > summary.averageContractValue * 3);
  const fadedLarge = largeProjects.filter((p) => p.overallGainFade === 'Fade');
  if (fadedLarge.length > 0) {
    const largeFadeDollars = fadedLarge.reduce((s, p) => s + Math.abs(p.gainFadeOrgFinalDollars), 0);
    const largeDrivers = fadedLarge.map(analyzeProjectCostDrivers);
    const laborDriven = largeDrivers.filter((d) => d.primaryDriver.category === 'Labor').length;

    insights.push({
      type: 'warning',
      severity: 9,
      headline: `${fadedLarge.length} large projects faded — ${formatDollarShort(largeFadeDollars)} in margin erosion`,
      detail: `Large projects (>${formatDollarShort(summary.averageContractValue * 3)}) carry outsized risk. ${laborDriven > 0 ? `${laborDriven} of these fades were labor-driven — on large projects, even small percentage overruns become massive dollar impacts.` : ''} These projects need monthly cost reviews and early warning systems, not just close-out analysis.`,
      category: 'risk',
      relatedProjects: fadedLarge.map((p) => p.projectNumber),
    });
  }

  // --- GAINED PROJECT PATTERNS (what's working) ---

  if (gainedProjects.length >= 3) {
    const gainDrivers = gainedProjects.map(analyzeProjectCostDrivers);
    const laborSavers = gainDrivers.filter((d) => d.primaryDriver.category === 'Labor' && d.primaryDriver.varianceDollars < 0);
    if (laborSavers.length >= 3) {
      const avgHoursSaved = laborSavers
        .map((d) => d.drivers.find((c) => c.category === 'Labor')?.hoursVariancePct ?? 0)
        .reduce((a, b) => a + b, 0) / laborSavers.length;

      insights.push({
        type: 'strength',
        severity: 6,
        headline: `${laborSavers.length} gained projects achieved it through labor efficiency`,
        detail: `These projects averaged ${formatPctShort(Math.abs(avgHoursSaved))} fewer labor hours than estimated. Understand what's different — prefabrication, crew composition, supervision, or simply conservative estimating — and replicate it systematically.`,
        category: 'cost-driver',
      });
    }
  }

  // Sort by severity
  insights.sort((a, b) => b.severity - a.severity);

  return insights;
}

// ============================================================
// PM / ESTIMATOR WORKLOAD METRICS (non-ranking)
// ============================================================

export interface PersonnelWorkload {
  name: string;
  role: 'PM' | 'Estimator';
  projectCount: number;
  totalRevenue: number;
  segments: string[];
  divisions: string[];
  gainCount: number;
  fadeCount: number;
  avgCostVariancePct: number; // how close to estimate on average
}

export function calculatePersonnelWorkload(projects: ProjectRecord[]): PersonnelWorkload[] {
  const workloads: PersonnelWorkload[] = [];

  const pmMap = new Map<string, ProjectRecord[]>();
  const estMap = new Map<string, ProjectRecord[]>();
  for (const p of projects) {
    if (p.projectManager) {
      if (!pmMap.has(p.projectManager)) pmMap.set(p.projectManager, []);
      pmMap.get(p.projectManager)!.push(p);
    }
    if (p.estimator) {
      if (!estMap.has(p.estimator)) estMap.set(p.estimator, []);
      estMap.get(p.estimator)!.push(p);
    }
  }

  for (const [name, prjs] of pmMap.entries()) {
    const totalOrigCost = prjs.reduce((s, p) => s + p.originalEstimatedCost, 0);
    const totalFinalCost = prjs.reduce((s, p) => s + p.finalCost, 0);
    workloads.push({
      name,
      role: 'PM',
      projectCount: prjs.length,
      totalRevenue: prjs.reduce((s, p) => s + p.finalContractValue, 0),
      segments: [...new Set(prjs.map((p) => p.marketSegment))],
      divisions: [...new Set(prjs.map((p) => p.division))],
      gainCount: prjs.filter((p) => p.overallGainFade === 'Gain').length,
      fadeCount: prjs.filter((p) => p.overallGainFade === 'Fade').length,
      avgCostVariancePct: totalOrigCost > 0 ? (totalFinalCost - totalOrigCost) / totalOrigCost : 0,
    });
  }

  for (const [name, prjs] of estMap.entries()) {
    const totalOrigCost = prjs.reduce((s, p) => s + p.originalEstimatedCost, 0);
    const totalFinalCost = prjs.reduce((s, p) => s + p.finalCost, 0);
    workloads.push({
      name,
      role: 'Estimator',
      projectCount: prjs.length,
      totalRevenue: prjs.reduce((s, p) => s + p.finalContractValue, 0),
      segments: [...new Set(prjs.map((p) => p.marketSegment))],
      divisions: [...new Set(prjs.map((p) => p.division))],
      gainCount: prjs.filter((p) => p.overallGainFade === 'Gain').length,
      fadeCount: prjs.filter((p) => p.overallGainFade === 'Fade').length,
      avgCostVariancePct: totalOrigCost > 0 ? (totalFinalCost - totalOrigCost) / totalOrigCost : 0,
    });
  }

  return workloads;
}
