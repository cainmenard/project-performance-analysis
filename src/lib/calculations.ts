import type { ProjectRecord, PortfolioSummary } from './types';

// ============================================================
// SHARED HELPERS
// ============================================================

/** The five direct cost categories every record carries, in display order. */
export const COST_CATEGORIES = ['Labor', 'Materials', 'Equipment', 'Subcontracts', 'Other'] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];

type CostBucket = Record<CostCategory, number>;

function originalCosts(p: ProjectRecord): CostBucket {
  return {
    Labor: p.originalEstimatedLabor,
    Materials: p.originalEstimatedMaterials,
    Equipment: p.originalEstimatedEquipment,
    Subcontracts: p.originalEstimatedSubcontracts,
    Other: p.originalEstimatedOther,
  };
}

function revisedCosts(p: ProjectRecord): CostBucket {
  return {
    Labor: p.revisedEstimatedLabor,
    Materials: p.revisedEstimatedMaterials,
    Equipment: p.revisedEstimatedEquipment,
    Subcontracts: p.revisedEstimatedSubcontracts,
    Other: p.revisedEstimatedOther,
  };
}

function finalCosts(p: ProjectRecord): CostBucket {
  return {
    Labor: p.finalLabor,
    Materials: p.finalMaterials,
    Equipment: p.finalEquipment,
    Subcontracts: p.finalSubcontracts,
    Other: p.finalOther,
  };
}

export interface ProjectBudget {
  /** Which estimate the budget came from. */
  source: 'revised' | 'original';
  /** How to name the budget in a sentence. */
  label: 'revised budget' | 'original estimate';
  costs: CostBucket;
  totalCost: number;
  laborHours: number;
}

/**
 * The budget that execution is measured against.
 *
 * Why the revised estimate and not the original: the revised estimate is the original
 * plus approved change orders. Cost added by a change order is scope the owner agreed to
 * pay for, so counting it as an overrun blames the field for work it was told to do.
 * On the sample portfolio that mistake turned a $3.8M execution overrun into an $11.9M
 * "estimating gap". Final cost minus revised budget is the part the project team owns.
 *
 * Why the fallback: an uploaded file may have no revised columns (they parse as zero).
 * Measuring against a zero budget would call the whole job an overrun, so those projects
 * fall back to the original estimate and the label says so.
 */
export function projectBudget(p: ProjectRecord): ProjectBudget {
  if (p.revisedEstimatedCost > 0) {
    return {
      source: 'revised',
      label: 'revised budget',
      costs: revisedCosts(p),
      totalCost: p.revisedEstimatedCost,
      laborHours: p.revisedEstimatedLaborHours,
    };
  }
  return {
    source: 'original',
    label: 'original estimate',
    costs: originalCosts(p),
    totalCost: p.originalEstimatedCost,
    laborHours: p.originalEstimatedLaborHours,
  };
}

/**
 * Margin for a group of projects: total profit divided by total revenue.
 *
 * Why not the mean of each project's margin: a simple mean gives a $200K job the same
 * weight as a $12M job. Small jobs tend to carry higher margins, so the simple mean
 * overstates what the company earned (17.7% vs 15.8% on the sample portfolio). Profit
 * over revenue is the number that ties to the income statement.
 */
export function weightedMargin(projects: ProjectRecord[]): number {
  const revenue = projects.reduce((s, p) => s + p.finalContractValue, 0);
  const profit = projects.reduce((s, p) => s + p.finalProfit, 0);
  return revenue > 0 ? profit / revenue : 0;
}

function groupBy<K>(projects: ProjectRecord[], keyOf: (p: ProjectRecord) => K): Map<K, ProjectRecord[]> {
  const map = new Map<K, ProjectRecord[]>();
  for (const p of projects) {
    const key = keyOf(p);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return map;
}

/** The measures every grouping (segment, division, customer) reports. */
interface GroupMetrics {
  projectCount: number;
  totalRevenue: number;
  /** Profit over revenue for the group. See weightedMargin(). */
  weightedMargin: number;
  gainCount: number;
  fadeCount: number;
  totalGainFade: number;
}

function summarizeGroup(prjs: ProjectRecord[]): GroupMetrics {
  return {
    projectCount: prjs.length,
    totalRevenue: prjs.reduce((s, p) => s + p.finalContractValue, 0),
    weightedMargin: weightedMargin(prjs),
    gainCount: prjs.filter((p) => p.overallGainFade === 'Gain').length,
    fadeCount: prjs.filter((p) => p.overallGainFade === 'Fade').length,
    totalGainFade: prjs.reduce((s, p) => s + p.gainFadeOrgFinalDollars, 0),
  };
}

// ============================================================
// PORTFOLIO SUMMARY AND GROUPINGS
// ============================================================

export function calculatePortfolioSummary(projects: ProjectRecord[]): PortfolioSummary {
  const totalProjects = projects.length;
  const totalRevenue = projects.reduce((sum, p) => sum + p.finalContractValue, 0);
  const totalProfit = projects.reduce((sum, p) => sum + p.finalProfit, 0);
  const totalOriginalValue = projects.reduce((sum, p) => sum + p.originalContractValue, 0);
  const totalGainFadeDollars = projects.reduce((sum, p) => sum + p.gainFadeOrgFinalDollars, 0);
  const portfolioMargin = weightedMargin(projects);
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
    portfolioMargin,
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

export interface SegmentMetrics extends GroupMetrics {
  segment: string;
}

export function calculateSegmentMetrics(projects: ProjectRecord[]): SegmentMetrics[] {
  return Array.from(groupBy(projects, (p) => p.marketSegment || 'Unknown').entries())
    .map(([segment, prjs]) => ({ segment, ...summarizeGroup(prjs) }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export interface DivisionMetrics extends GroupMetrics {
  division: string;
}

export function calculateDivisionMetrics(projects: ProjectRecord[]): DivisionMetrics[] {
  return Array.from(groupBy(projects, (p) => p.division || 'Unknown').entries())
    .map(([division, prjs]) => ({ division, ...summarizeGroup(prjs) }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export interface CustomerMetrics extends GroupMetrics {
  customer: string;
}

export function calculateCustomerMetrics(projects: ProjectRecord[]): CustomerMetrics[] {
  return Array.from(groupBy(projects, (p) => p.customerName || 'Unknown').entries())
    .map(([customer, prjs]) => ({ customer, ...summarizeGroup(prjs) }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export interface CostCategoryData {
  category: CostCategory;
  /** Original estimate, before change orders. */
  original: number;
  /** Budget execution is measured against: revised where a project has it, else original. */
  budget: number;
  final: number;
  /** Budget minus original: cost added by approved change orders. Not an overrun. */
  scopeChange: number;
  /** Final minus budget: the execution variance. Positive is an overrun. */
  variance: number;
  variancePct: number;
}

export function calculateCostBreakdown(projects: ProjectRecord[]): CostCategoryData[] {
  return COST_CATEGORIES.map((category) => {
    const original = projects.reduce((s, p) => s + originalCosts(p)[category], 0);
    // Summed project by project so a file that mixes projects with and without a revised
    // estimate still gets the right budget for each one.
    const budget = projects.reduce((s, p) => s + projectBudget(p).costs[category], 0);
    const final = projects.reduce((s, p) => s + finalCosts(p)[category], 0);
    const variance = final - budget;
    return {
      category,
      original,
      budget,
      final,
      scopeChange: budget - original,
      variance,
      variancePct: budget > 0 ? variance / budget : 0,
    };
  });
}

export interface PortfolioCostTotals {
  originalCost: number;
  budgetCost: number;
  finalCost: number;
  /** Cost added by approved change orders (budget minus original). */
  scopeChange: number;
  /** Final minus budget. Positive is an overrun the project team owns. */
  executionVariance: number;
  executionVariancePct: number;
  /** Projects whose final cost exceeded their budget. */
  overrunProjectCount: number;
  /** Projects measured against the original estimate because no revised estimate was supplied. */
  projectsWithoutRevisedBudget: number;
}

/** Portfolio cost totals with change-order scope separated from execution variance. */
export function calculatePortfolioCostTotals(projects: ProjectRecord[]): PortfolioCostTotals {
  const originalCost = projects.reduce((s, p) => s + p.originalEstimatedCost, 0);
  const budgetCost = projects.reduce((s, p) => s + projectBudget(p).totalCost, 0);
  const finalCost = projects.reduce((s, p) => s + p.finalCost, 0);
  const executionVariance = finalCost - budgetCost;
  return {
    originalCost,
    budgetCost,
    finalCost,
    scopeChange: budgetCost - originalCost,
    executionVariance,
    executionVariancePct: budgetCost > 0 ? executionVariance / budgetCost : 0,
    overrunProjectCount: projects.filter((p) => p.finalCost > projectBudget(p).totalCost).length,
    projectsWithoutRevisedBudget: projects.filter((p) => projectBudget(p).source === 'original').length,
  };
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
  /** Profit over revenue for the year. See weightedMargin(). */
  weightedMargin: number;
  gainCount: number;
  fadeCount: number;
  gainRate: number;
  totalGainFade: number;
}

export function calculateYearMetrics(projects: ProjectRecord[]): YearMetrics[] {
  return Array.from(groupBy(projects, (p) => p.yearCompleted).entries())
    .map(([year, prjs]) => {
      const g = summarizeGroup(prjs);
      return {
        year,
        projectCount: g.projectCount,
        totalRevenue: g.totalRevenue,
        weightedMargin: g.weightedMargin,
        gainCount: g.gainCount,
        fadeCount: g.fadeCount,
        gainRate: g.gainCount / prjs.length,
        totalGainFade: g.totalGainFade,
      };
    })
    .sort((a, b) => a.year - b.year);
}

// ============================================================
// LABOR VARIANCE: HOURS VS RATE
// ============================================================

export interface LaborVarianceSplit {
  /** False when either hours figure is missing, because a rate cannot be computed. */
  available: boolean;
  /** Final labor cost minus budgeted labor cost. */
  totalVariance: number;
  /** Dollars from working more or fewer hours than budgeted, priced at the budget rate. */
  hoursEffect: number;
  /** Dollars from paying a different rate per hour than budgeted, on the hours worked. */
  rateEffect: number;
  budgetHours: number;
  actualHours: number;
  budgetRate: number;
  actualRate: number;
}

/**
 * Split a labor cost variance into an hours effect and a rate effect.
 *
 *   hours effect = (actual hours - budget hours) x budget rate
 *   rate effect  = (actual rate - budget rate) x actual hours
 *
 * The two add up to the total variance exactly, so nothing is left unexplained.
 *
 * Why it matters: the two halves have different owners and different fixes. Hours are
 * productivity and scope (crew mix, sequencing, rework, missed scope in the takeoff).
 * Rate is wage escalation, overtime and crew composition. A job that is 15% over on
 * labor dollars needs a different conversation if it is all hours than if it is all rate.
 */
export function splitLaborVariance(
  budgetLabor: number,
  budgetHours: number,
  finalLabor: number,
  finalHours: number,
): LaborVarianceSplit {
  const totalVariance = finalLabor - budgetLabor;
  if (budgetHours <= 0 || finalHours <= 0) {
    return {
      available: false,
      totalVariance,
      hoursEffect: 0,
      rateEffect: 0,
      budgetHours,
      actualHours: finalHours,
      budgetRate: 0,
      actualRate: 0,
    };
  }
  const budgetRate = budgetLabor / budgetHours;
  const actualRate = finalLabor / finalHours;
  return {
    available: true,
    totalVariance,
    hoursEffect: (finalHours - budgetHours) * budgetRate,
    rateEffect: (actualRate - budgetRate) * finalHours,
    budgetHours,
    actualHours: finalHours,
    budgetRate,
    actualRate,
  };
}

export function projectLaborSplit(p: ProjectRecord): LaborVarianceSplit {
  const budget = projectBudget(p);
  return splitLaborVariance(budget.costs.Labor, budget.laborHours, p.finalLabor, p.finalLaborHours);
}

export interface PortfolioLaborSplit {
  /** Projects with both budgeted and actual hours, so the split could be computed. */
  projectsWithHours: number;
  projectCount: number;
  totalVariance: number;
  hoursEffect: number;
  rateEffect: number;
  budgetHours: number;
  actualHours: number;
}

/**
 * Portfolio hours and rate effects, summed project by project.
 *
 * Why summed and not computed from portfolio-wide rates: a blended rate moves when the
 * mix of jobs moves (more hours on a high-wage job raises it with no one getting a raise).
 * Summing each project's own split keeps that mix shift out of the rate effect.
 * Projects without hours are left out of every total here so the two effects still add up.
 */
export function portfolioLaborSplit(projects: ProjectRecord[]): PortfolioLaborSplit {
  const splits = projects.map(projectLaborSplit).filter((s) => s.available);
  return {
    projectsWithHours: splits.length,
    projectCount: projects.length,
    totalVariance: splits.reduce((s, x) => s + x.totalVariance, 0),
    hoursEffect: splits.reduce((s, x) => s + x.hoursEffect, 0),
    rateEffect: splits.reduce((s, x) => s + x.rateEffect, 0),
    budgetHours: splits.reduce((s, x) => s + x.budgetHours, 0),
    actualHours: splits.reduce((s, x) => s + x.actualHours, 0),
  };
}

// ============================================================
// COST DRIVER ANALYSIS ENGINE
// ============================================================

export interface CostDriverDetail {
  category: CostCategory;
  originalDollars: number;
  budgetDollars: number;
  finalDollars: number;
  /** Budget minus original: cost added by approved change orders. */
  scopeChangeDollars: number;
  /** Final minus budget. Positive is an overrun, negative is a saving. */
  varianceDollars: number;
  variancePct: number;
  hoursVariance?: number;      // labor only: actual hours minus budgeted hours
  hoursVariancePct?: number;   // labor only
  scopeHours?: number;         // labor only: hours added by change orders
  shareOfTotalVariance: number; // this category's share of the absolute variance across categories
}

export interface ProjectCostDrivers {
  project: ProjectRecord;
  budgetSource: ProjectBudget['source'];
  budgetLabel: ProjectBudget['label'];
  /** Final cost minus budget. */
  totalCostVariance: number;
  totalCostVariancePct: number;
  /** Budget minus original estimate: change-order scope. */
  totalScopeChange: number;
  drivers: CostDriverDetail[];        // sorted by absolute variance, largest first
  primaryDriver: CostDriverDetail;    // the category that best explains the outcome
  secondaryDriver?: CostDriverDetail; // the next one, if it is a meaningful share
  /**
   * True when the primary driver moved in the direction of the outcome: an overrun on a
   * faded project, a saving on a gained one. False means cost does not explain the result
   * (for example a fade with every category on budget), and the diagnosis says so.
   */
  primaryExplainsOutcome: boolean;
  laborSplit: LaborVarianceSplit;
  diagnosis: string;                  // one or two sentences, plain English
}

/** Analyze which cost categories drove gain or fade for a single project. */
export function analyzeProjectCostDrivers(p: ProjectRecord): ProjectCostDrivers {
  const budget = projectBudget(p);
  const original = originalCosts(p);
  const final = finalCosts(p);

  const totalCostVariance = p.finalCost - budget.totalCost;
  const totalCostVariancePct = budget.totalCost > 0 ? totalCostVariance / budget.totalCost : 0;

  const drivers: CostDriverDetail[] = COST_CATEGORIES.map((category) => {
    const budgetDollars = budget.costs[category];
    const varianceDollars = final[category] - budgetDollars;
    const detail: CostDriverDetail = {
      category,
      originalDollars: original[category],
      budgetDollars,
      finalDollars: final[category],
      scopeChangeDollars: budgetDollars - original[category],
      varianceDollars,
      variancePct: budgetDollars > 0 ? varianceDollars / budgetDollars : 0,
      shareOfTotalVariance: 0,
    };
    if (category === 'Labor') {
      detail.hoursVariance = p.finalLaborHours - budget.laborHours;
      detail.hoursVariancePct = budget.laborHours > 0 ? detail.hoursVariance / budget.laborHours : 0;
      detail.scopeHours = budget.laborHours - p.originalEstimatedLaborHours;
    }
    return detail;
  });

  const totalAbsVariance = drivers.reduce((s, d) => s + Math.abs(d.varianceDollars), 0);
  for (const d of drivers) {
    d.shareOfTotalVariance = totalAbsVariance > 0 ? Math.abs(d.varianceDollars) / totalAbsVariance : 0;
  }

  drivers.sort((a, b) => Math.abs(b.varianceDollars) - Math.abs(a.varianceDollars));

  // The primary driver has to point the same way as the outcome. The earlier version took
  // the largest absolute variance and then described it as a saving on any gained project,
  // which labeled real overruns as "labor savings". A fade is explained by overruns and a
  // gain by savings; anything else is not a cost story.
  const isFade = p.overallGainFade === 'Fade';
  const explaining = drivers.filter((d) => (isFade ? d.varianceDollars > 0 : d.varianceDollars < 0));
  const primaryExplainsOutcome = explaining.length > 0;
  const primary = explaining[0] ?? drivers[0];
  // 15% is the floor for calling something a second driver: below that it is noise next
  // to the primary and naming it would dilute the diagnosis.
  const secondary = explaining[1] && explaining[1].shareOfTotalVariance > 0.15 ? explaining[1] : undefined;

  const laborSplit = splitLaborVariance(budget.costs.Labor, budget.laborHours, p.finalLabor, p.finalLaborHours);

  const diagnosis = generateProjectDiagnosis({
    isFade,
    primary,
    secondary,
    primaryExplainsOutcome,
    totalCostVariance,
    budgetLabel: budget.label,
  });

  return {
    project: p,
    budgetSource: budget.source,
    budgetLabel: budget.label,
    totalCostVariance,
    totalCostVariancePct,
    totalScopeChange: budget.totalCost - p.originalEstimatedCost,
    drivers,
    primaryDriver: primary,
    secondaryDriver: secondary,
    primaryExplainsOutcome,
    laborSplit,
    diagnosis,
  };
}

function generateProjectDiagnosis(d: {
  isFade: boolean;
  primary: CostDriverDetail;
  secondary: CostDriverDetail | undefined;
  primaryExplainsOutcome: boolean;
  totalCostVariance: number;
  budgetLabel: ProjectBudget['label'];
}): string {
  const { isFade, primary, secondary, primaryExplainsOutcome, totalCostVariance, budgetLabel } = d;
  const pct = formatPctShort(Math.abs(primary.variancePct));
  // Change-order hours are called out because a reader comparing final hours to the
  // original bid will see a bigger gap than the overrun reported here.
  const scopeHoursNote = (primary.scopeHours ?? 0) > 0
    ? ` Change orders added another ${(primary.scopeHours ?? 0).toLocaleString()} budgeted hours, which are not counted as overrun.`
    : '';

  if (!isFade) {
    if (!primaryExplainsOutcome) {
      // Profit beat the original estimate with no category under budget, so the gain
      // came from the contract side: change orders priced above the original margin.
      return totalCostVariance > 0
        ? `Cost ran ${formatDollarShort(totalCostVariance)} over the ${budgetLabel}, so the gain did not come from the field. It came from change orders priced above the original margin.`
        : `Cost landed on the ${budgetLabel}. The gain came from change orders priced above the original margin.`;
    }
    if (primary.category === 'Labor' && (primary.hoursVariance ?? 0) < 0) {
      return `Gained margin through labor efficiency: ${Math.abs(primary.hoursVariance ?? 0).toLocaleString()} fewer hours than the ${budgetLabel} (${formatPctShort(Math.abs(primary.hoursVariancePct ?? 0))} under).`;
    }
    return `Gained margin mainly through ${primary.category.toLowerCase()} savings (${pct} under the ${budgetLabel}).`;
  }

  if (!primaryExplainsOutcome) {
    // Profit fell short of the original estimate with every category at or under budget,
    // so the fade came from the contract side.
    return `Cost came in at or under the ${budgetLabel}, so the field did not cause this fade. It came from the contract side: change orders priced below the original margin, or a final contract value under the revised amount.`;
  }

  if (primary.category === 'Labor') {
    const hoursOver = primary.hoursVariance ?? 0;
    if (hoursOver > 0) {
      const parts = [`Labor is the primary cost driver: ${hoursOver.toLocaleString()} more hours than the ${budgetLabel} (+${formatPctShort(primary.hoursVariancePct ?? 0)}).`];
      if (secondary) {
        parts.push(`${secondary.category} also ran ${formatPctShort(Math.abs(secondary.variancePct))} over.`);
      }
      return parts.join(' ') + scopeHoursNote;
    }
    return `Labor cost ran ${pct} over the ${budgetLabel} with hours at or under budget, so the overrun is rate (wages, overtime or crew mix), not productivity. Total cost overrun: ${formatDollarShort(Math.abs(totalCostVariance))}.`;
  }

  if (primary.category === 'Materials') {
    const tail = secondary?.category === 'Labor'
      ? `, compounded by a labor overrun (+${formatPctShort(Math.abs(secondary.variancePct))})`
      : '';
    return `Materials drove the fade: +${pct} over the ${budgetLabel}${tail}.`;
  }

  if (primary.category === 'Subcontracts') {
    return `Subcontract cost ran ${pct} over the ${budgetLabel}, ${formatPctShort(primary.shareOfTotalVariance)} of the cost variance on this job.`;
  }

  if (primary.category === 'Equipment') {
    return `Equipment drove the fade at +${pct} over the ${budgetLabel}.`;
  }

  return `Cost overrun of ${formatDollarShort(Math.abs(totalCostVariance))} against the ${budgetLabel}, led by ${primary.category.toLowerCase()} (+${pct}).`;
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
  /** Fades with no category over budget: the loss came from contract pricing, not cost. */
  pricingDrivenFadeCount: number;
}

/** Analyze cost driver patterns across the entire portfolio */
export function analyzePortfolioCostDrivers(projects: ProjectRecord[]): PortfolioCostDriverAnalysis {
  const allDrivers = projects.map(analyzeProjectCostDrivers);
  const fadedDrivers = allDrivers.filter((d) => d.project.overallGainFade === 'Fade');
  const gainedDrivers = allDrivers.filter((d) => d.project.overallGainFade === 'Gain');

  // A fade only has a cost driver if some category ran over budget. Fades where every
  // category is on or under budget came from contract pricing and are counted separately,
  // so a saving never gets reported as the "driver" of a fade.
  const costDrivenFades = fadedDrivers.filter((d) => d.primaryExplainsOutcome);

  // Count how often each category is the primary fade driver
  const driverCounts = new Map<string, { count: number; totalVariance: number; variancePcts: number[] }>();
  for (const fd of costDrivenFades) {
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
      if (fd.primaryExplainsOutcome) {
        driverFreq.set(fd.primaryDriver.category, (driverFreq.get(fd.primaryDriver.category) ?? 0) + 1);
      }
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

  const laborCount = costDrivenFades.filter((d) => d.primaryDriver.category === 'Labor').length;
  const matsCount = costDrivenFades.filter((d) => d.primaryDriver.category === 'Materials').length;
  const equipCount = costDrivenFades.filter((d) => d.primaryDriver.category === 'Equipment').length;
  const subsCount = costDrivenFades.filter((d) => d.primaryDriver.category === 'Subcontracts').length;

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
    pricingDrivenFadeCount: fadedDrivers.length - costDrivenFades.length,
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
        headline: `Labor is the #1 fade driver: primary cause in ${top.timesPrimaryDriver} of ${fadedProjects.length} faded projects`,
        detail: `Faded projects averaged +${formatPctShort(avgHoursOver)} more labor hours than budgeted after change orders, totaling ${formatDollarShort(top.totalVarianceDollars)} in labor cost overruns. Approved change-order hours are already in the budget, so this is scope missed in the estimate or field productivity running below plan. Review labor hour assumptions in estimating templates and compare crew productivity rates against bid assumptions.`,
        category: 'cost-driver',
        relatedProjects: analysis.fadedProjectDrivers.filter((d) => d.primaryDriver.category === 'Labor').map((d) => d.project.projectNumber),
      });
    } else if (top.category === 'Materials' && pct >= 0.4) {
      insights.push({
        type: 'warning',
        severity: 8,
        headline: `Materials costs are the primary fade driver in ${top.timesPrimaryDriver} of ${fadedProjects.length} faded projects`,
        detail: `Materials overruns averaged +${formatPctShort(top.averageVariancePct)} over budget, totaling ${formatDollarShort(top.totalVarianceDollars)}. This could indicate material price escalation not captured in estimates, scope additions not covered by change orders, or waste/rework. Consider locking material pricing earlier and improving takeoff accuracy.`,
        category: 'cost-driver',
      });
    } else if (fadedProjects.length > 0) {
      insights.push({
        type: 'warning',
        severity: 7,
        headline: `${top.category} costs are the most common fade driver (${top.timesPrimaryDriver} of ${fadedProjects.length} faded projects)`,
        detail: `Averaging +${formatPctShort(top.averageVariancePct)} over budget. Total impact: ${formatDollarShort(top.totalVarianceDollars)}.`,
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
          detail: `While ${top.category.toLowerCase()} leads, ${second.category.toLowerCase()} overruns of +${formatPctShort(second.averageVariancePct)} add up to ${formatDollarShort(second.totalVarianceDollars)}. Multiple cost categories overrunning simultaneously suggests systemic estimating gaps rather than isolated execution issues.`,
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
          headline: `${scp.segment} fades are labor-driven: avg +${formatPctShort(scp.avgLaborHoursVariancePct)} hours over budget`,
          detail: `${scp.fadeCount} of ${segTotal.length} ${scp.segment} projects faded (${formatPctShort(fadeRate)} fade rate), losing ${formatDollarShort(scp.fadeDollars)}. The consistent labor hour overruns in this segment suggest ${scp.segment.toLowerCase()} scope complexity is being systematically underestimated. Consider adding a complexity factor to labor estimates for ${scp.segment.toLowerCase()} projects.`,
          category: 'segment',
          relatedProjects: fadedProjects.filter((p) => p.marketSegment === scp.segment).map((p) => p.projectNumber),
        });
      } else if (scp.primaryDriverCategory === 'Materials' && scp.avgMaterialsVariancePct > 0.1) {
        insights.push({
          type: 'warning',
          severity: 7,
          headline: `${scp.segment} fades are materials-driven: avg +${formatPctShort(scp.avgMaterialsVariancePct)} over budget`,
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
        detail: `${pm} manages ${prjs.length} projects totaling ${formatDollarShort(pmRevenue)}. This concentration creates succession risk. If this PM is unavailable, a significant portion of the portfolio is exposed. Consider cross-training and knowledge transfer.`,
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
          detail: `${formatPctShort(bestSeg.gainRate)} gain rate in ${bestSeg.segment} (${bestSeg.count} projects) vs ${formatPctShort(worstSeg.gainRate)} in ${worstSeg.segment} (${worstSeg.count} projects). That gap more likely reflects the risk profile of each segment than PM capability. Consider whether ${worstSeg.segment.toLowerCase()} projects need different estimating approaches, crew configurations, or tighter change order management.`,
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
        detail: `Estimating accuracy is trending in the right direction. Identify what changed (estimating process, bid selection or field execution) and make it standard.`,
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

    if (latest.weightedMargin < previous.weightedMargin - 0.02) {
      insights.push({
        type: 'warning',
        severity: 7,
        headline: `Average margin declining: ${formatPctShort(previous.weightedMargin)} (${previous.year}) → ${formatPctShort(latest.weightedMargin)} (${latest.year})`,
        detail: `A ${formatPctShort(Math.abs(latest.weightedMargin - previous.weightedMargin))} margin decline across ${latest.projectCount} projects represents ${formatDollarShort(latest.totalRevenue * Math.abs(latest.weightedMargin - previous.weightedMargin))} in profit impact. Investigate whether this is pricing pressure, cost inflation, or project mix shift.`,
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
      headline: `${fadedLarge.length} large ${fadedLarge.length === 1 ? 'project' : 'projects'} faded: ${formatDollarShort(largeFadeDollars)} in margin erosion`,
      detail: `Large projects (>${formatDollarShort(summary.averageContractValue * 3)}) carry outsized risk. ${laborDriven > 0 ? `${laborDriven} of these fades ${laborDriven === 1 ? 'was' : 'were'} labor-driven. On a large project a small percentage overrun is a large dollar loss.` : ''} These projects need monthly cost reviews and early warning systems, not just close-out analysis.`,
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
        detail: `These projects averaged ${formatPctShort(Math.abs(avgHoursSaved))} fewer labor hours than budgeted. Find out what was different (prefabrication, crew composition, supervision or conservative estimating) and repeat it.`,
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
  avgCostVariancePct: number; // final cost vs budget (revised where available), dollar-weighted
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
    const totalBudgetCost = prjs.reduce((s, p) => s + projectBudget(p).totalCost, 0);
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
      avgCostVariancePct: totalBudgetCost > 0 ? (totalFinalCost - totalBudgetCost) / totalBudgetCost : 0,
    });
  }

  for (const [name, prjs] of estMap.entries()) {
    const totalBudgetCost = prjs.reduce((s, p) => s + projectBudget(p).totalCost, 0);
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
      avgCostVariancePct: totalBudgetCost > 0 ? (totalFinalCost - totalBudgetCost) / totalBudgetCost : 0,
    });
  }

  return workloads;
}
