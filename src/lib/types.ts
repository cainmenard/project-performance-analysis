export interface ProjectRecord {
  // Identification
  customerName: string;
  division: string;
  projectName: string;
  projectNumber: string;
  yearCompleted: number;
  marketSegment: string;
  projectManager: string;
  estimator: string;
  /**
   * Bid date and completion date as "YYYY-MM-DD". Optional: files without them load and
   * analyze as before, and only the Market Exposure page needs them (it measures how a
   * price index moved between these two months).
   */
  bidDate?: string;
  completionDate?: string;

  // Contract Values
  originalContractValue: number;
  revisedContractValue: number;
  finalContractValue: number;

  // Cost Breakdown (Final)
  finalCost: number;
  finalLabor: number;
  finalLaborHours: number;
  finalMaterials: number;
  finalEquipment: number;
  finalSubcontracts: number;
  finalOther: number;

  // Cost Breakdown (Original Estimated)
  originalEstimatedCost: number;
  originalEstimatedLabor: number;
  originalEstimatedLaborHours: number;
  originalEstimatedMaterials: number;
  originalEstimatedEquipment: number;
  originalEstimatedSubcontracts: number;
  originalEstimatedOther: number;

  // Cost Breakdown (Revised Estimated)
  revisedEstimatedCost: number;
  revisedEstimatedLabor: number;
  revisedEstimatedLaborHours: number;
  revisedEstimatedMaterials: number;
  revisedEstimatedEquipment: number;
  revisedEstimatedSubcontracts: number;
  revisedEstimatedOther: number;

  // Profit & Margin
  originalEstimatedProfit: number;
  originalEstimatedProfitMargin: number;
  revisedEstimatedProfit: number;
  revisedEstimatedProfitMargin: number;
  finalProfit: number;
  finalGrossProfitMargin: number;

  // Gain/Fade
  gainFadeOrgFinalDollars: number;
  gainFadeOrgFinalPercent: number;
  gainFadeRevFinalPercent: number;
  overallGainFade: 'Gain' | 'Fade';
}

export interface PortfolioSummary {
  totalProjects: number;
  totalRevenue: number;
  /** Total profit over total revenue (revenue-weighted, not a mean of project margins). */
  portfolioMargin: number;
  averageContractValue: number;
  gainCount: number;
  fadeCount: number;
  gainRate: number;
  totalProfit: number;
  totalOriginalValue: number;
  totalGainFadeDollars: number;
  marketSegments: string[];
  divisions: string[];
  years: number[];
  customers: string[];
  projectManagers: string[];
  estimators: string[];
}

export interface FilterState {
  divisions: string[];
  marketSegments: string[];
  years: number[];
  gainFade: ('Gain' | 'Fade')[];
  customers: string[];
  projectManagers: string[];
  estimators: string[];
}
