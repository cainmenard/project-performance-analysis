import type { ProjectRecord } from './types';

interface Costs { labor: number; hours: number; materials: number; equipment: number; subs: number; other: number }

/**
 * Build a consistent project record for tests from the handful of inputs that matter.
 * Profit, margin and gain/fade are derived here the same way the sample data derives them.
 * Pass `revised: null` to model an uploaded file with no revised estimate columns.
 */
export function makeProject(o: {
  id?: string;
  originalValue: number;
  revisedValue?: number;
  finalValue?: number;
  original: Costs;
  revised?: Costs | null;
  final: Costs;
  segment?: string;
  customer?: string;
  year?: number;
}): ProjectRecord {
  const total = (c: Costs) => c.labor + c.materials + c.equipment + c.subs + c.other;
  const revised = o.revised === undefined ? o.original : o.revised;
  const revisedValue = revised ? (o.revisedValue ?? o.originalValue) : 0;
  const finalValue = o.finalValue ?? (o.revisedValue ?? o.originalValue);
  const originalCost = total(o.original);
  const revisedCost = revised ? total(revised) : 0;
  const finalCost = total(o.final);
  const originalProfit = o.originalValue - originalCost;
  const revisedProfit = revised ? revisedValue - revisedCost : 0;
  const finalProfit = finalValue - finalCost;
  const gainFade = finalProfit - originalProfit;
  return {
    customerName: o.customer ?? 'Test Customer',
    division: 'Commercial',
    projectName: `Project ${o.id ?? 'T-1'}`,
    projectNumber: o.id ?? 'T-1',
    yearCompleted: o.year ?? 2024,
    marketSegment: o.segment ?? 'Office / Commercial',
    projectManager: 'Test PM',
    estimator: 'Test Estimator',
    originalContractValue: o.originalValue,
    revisedContractValue: revisedValue,
    finalContractValue: finalValue,
    finalCost,
    finalLabor: o.final.labor,
    finalLaborHours: o.final.hours,
    finalMaterials: o.final.materials,
    finalEquipment: o.final.equipment,
    finalSubcontracts: o.final.subs,
    finalOther: o.final.other,
    originalEstimatedCost: originalCost,
    originalEstimatedLabor: o.original.labor,
    originalEstimatedLaborHours: o.original.hours,
    originalEstimatedMaterials: o.original.materials,
    originalEstimatedEquipment: o.original.equipment,
    originalEstimatedSubcontracts: o.original.subs,
    originalEstimatedOther: o.original.other,
    revisedEstimatedCost: revisedCost,
    revisedEstimatedLabor: revised?.labor ?? 0,
    revisedEstimatedLaborHours: revised?.hours ?? 0,
    revisedEstimatedMaterials: revised?.materials ?? 0,
    revisedEstimatedEquipment: revised?.equipment ?? 0,
    revisedEstimatedSubcontracts: revised?.subs ?? 0,
    revisedEstimatedOther: revised?.other ?? 0,
    originalEstimatedProfit: originalProfit,
    originalEstimatedProfitMargin: originalProfit / o.originalValue,
    revisedEstimatedProfit: revisedProfit,
    revisedEstimatedProfitMargin: revisedValue > 0 ? revisedProfit / revisedValue : 0,
    finalProfit,
    finalGrossProfitMargin: finalProfit / finalValue,
    gainFadeOrgFinalDollars: gainFade,
    gainFadeOrgFinalPercent: finalProfit / finalValue - originalProfit / o.originalValue,
    gainFadeRevFinalPercent: revisedValue > 0 ? finalProfit / finalValue - revisedProfit / revisedValue : 0,
    overallGainFade: gainFade >= 0 ? 'Gain' : 'Fade',
  };
}
