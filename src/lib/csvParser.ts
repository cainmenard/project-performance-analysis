import Papa from 'papaparse';
import type { ProjectRecord } from './types';

const COLUMN_MAP: Record<string, keyof ProjectRecord> = {
  'Customer Name1': 'customerName',
  'Division1': 'division',
  'Project Name1': 'projectName',
  'Project Number1': 'projectNumber',
  'Year Completed': 'yearCompleted',
  'Market Segment1': 'marketSegment',
  'Original Contract Value': 'originalContractValue',
  'Revised Estimated Contract Amount (with Change Orders)': 'revisedContractValue',
  'Final Actual Contract Value': 'finalContractValue',
  'Final Actual Contract Value (copy)': 'finalContractValue',
  'Final Actual Cost': 'finalCost',
  'Final Labor': 'finalLabor',
  'Final Labor Hours': 'finalLaborHours',
  'Final Materials': 'finalMaterials',
  'Final Equipment': 'finalEquipment',
  'Final Subcontracts': 'finalSubcontracts',
  'Final Other': 'finalOther',
  'Original Estimated Cost': 'originalEstimatedCost',
  'Original Estimated Labor Cost': 'originalEstimatedLabor',
  'Original Estimated Labor Hours': 'originalEstimatedLaborHours',
  'Original Estimated Materials Cost': 'originalEstimatedMaterials',
  'Original Estimated Equipment Cost': 'originalEstimatedEquipment',
  'Original Estimated Subcontractor Cost': 'originalEstimatedSubcontracts',
  'Original Estimated Other': 'originalEstimatedOther',
  'Revised Estimated Cost (with Change Orders)': 'revisedEstimatedCost',
  'Revised Estimated Labor (with Change Orders)': 'revisedEstimatedLabor',
  'Revised Estimated Labor Hours (with Change Orders)': 'revisedEstimatedLaborHours',
  'Revised Estimated Materials (with Change Orders)': 'revisedEstimatedMaterials',
  'Revised Estimated Equipment (with Change Orders)': 'revisedEstimatedEquipment',
  'Revised Estimated Subcontracts (with Change Orders)': 'revisedEstimatedSubcontracts',
  'Revised Estimated Other (with Change Orders)': 'revisedEstimatedOther',
  'Original Estimated Profit': 'originalEstimatedProfit',
  'Original Estimated Profit Margin (%)': 'originalEstimatedProfitMargin',
  'Revised Estimated Profit': 'revisedEstimatedProfit',
  'Revised Estimated Profit Margin (%)': 'revisedEstimatedProfitMargin',
  'Final Profit': 'finalProfit',
  'Final Gross Profit Margin (%)': 'finalGrossProfitMargin',
  'Gain / Fade ORG - FINAL ($)': 'gainFadeOrgFinalDollars',
  'Gain / Fade ORG - FINAL(%)': 'gainFadeOrgFinalPercent',
  'Gain / Fade REV EST - FINAL(%)': 'gainFadeRevFinalPercent',
  'Overal Gain/Fade': 'overallGainFade',
};

function cleanNumericValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined || value === '') return 0;
  const str = String(value).replace(/[$,\s]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function mapRow(row: Record<string, unknown>): ProjectRecord {
  const record: Partial<ProjectRecord> = {};

  for (const [csvCol, field] of Object.entries(COLUMN_MAP)) {
    const value = row[csvCol];
    if (value === undefined) continue;

    if (field === 'customerName' || field === 'division' || field === 'projectName' ||
        field === 'projectNumber' || field === 'marketSegment') {
      record[field] = String(value || '').trim();
    } else if (field === 'overallGainFade') {
      const str = String(value || '').trim();
      record[field] = str === 'Fade' ? 'Fade' : 'Gain';
    } else {
      (record as Record<string, unknown>)[field] = cleanNumericValue(value);
    }
  }

  return {
    customerName: '',
    division: '',
    projectName: '',
    projectNumber: '',
    yearCompleted: 0,
    marketSegment: '',
    originalContractValue: 0,
    revisedContractValue: 0,
    finalContractValue: 0,
    finalCost: 0,
    finalLabor: 0,
    finalLaborHours: 0,
    finalMaterials: 0,
    finalEquipment: 0,
    finalSubcontracts: 0,
    finalOther: 0,
    originalEstimatedCost: 0,
    originalEstimatedLabor: 0,
    originalEstimatedLaborHours: 0,
    originalEstimatedMaterials: 0,
    originalEstimatedEquipment: 0,
    originalEstimatedSubcontracts: 0,
    originalEstimatedOther: 0,
    revisedEstimatedCost: 0,
    revisedEstimatedLabor: 0,
    revisedEstimatedLaborHours: 0,
    revisedEstimatedMaterials: 0,
    revisedEstimatedEquipment: 0,
    revisedEstimatedSubcontracts: 0,
    revisedEstimatedOther: 0,
    originalEstimatedProfit: 0,
    originalEstimatedProfitMargin: 0,
    revisedEstimatedProfit: 0,
    revisedEstimatedProfitMargin: 0,
    finalProfit: 0,
    finalGrossProfitMargin: 0,
    gainFadeOrgFinalDollars: 0,
    gainFadeOrgFinalPercent: 0,
    gainFadeRevFinalPercent: 0,
    overallGainFade: 'Gain',
    ...record,
  };
}

export interface ParseResult {
  data: ProjectRecord[];
  errors: string[];
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const errors: string[] = [];
        const data: ProjectRecord[] = [];

        if (results.errors.length > 0) {
          results.errors.forEach((e) => {
            errors.push(`Row ${e.row}: ${e.message}`);
          });
        }

        for (const row of results.data as Record<string, unknown>[]) {
          const mapped = mapRow(row);
          if (mapped.projectName || mapped.projectNumber) {
            data.push(mapped);
          }
        }

        if (data.length === 0) {
          errors.push('No valid project records found. Please check your CSV format.');
        }

        resolve({ data, errors });
      },
    });
  });
}

export function generateTemplateCSV(): string {
  const headers = Object.keys(COLUMN_MAP);
  const exampleRow = [
    'Acme Construction', 'SPC', 'Office Building HVAC', '10001', '2024', 'COM',
    '500000', '525000', '510000',
    '395000', '120000', '2000', '80000', '95000', '60000', '40000',
    '375000', '110000', '1800', '85000', '90000', '55000', '35000',
    '400000', '115000', '1900', '82000', '93000', '58000', '52000',
    '125000', '0.25', '125000', '0.245', '115000', '0.225',
    '-10000', '-0.02', '-0.02', 'Fade',
  ];
  return [headers.join(','), exampleRow.join(',')].join('\n');
}
