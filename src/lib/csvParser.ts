import Papa from 'papaparse';
import type { ProjectRecord } from './types';

type Field = keyof ProjectRecord;

/**
 * The template's columns, in order. One entry per field, so the header row and the
 * example row are both built from this list and cannot drift apart. (The earlier
 * template was written as two separate arrays; the example row was missing the PM and
 * Estimator values, which shifted every number after column 6 into the wrong column.)
 */
const TEMPLATE_COLUMNS: { header: string; field: Field }[] = [
  { header: 'Customer Name', field: 'customerName' },
  { header: 'Division', field: 'division' },
  { header: 'Project Name', field: 'projectName' },
  { header: 'Project Number', field: 'projectNumber' },
  { header: 'Year Completed', field: 'yearCompleted' },
  { header: 'Market Segment', field: 'marketSegment' },
  { header: 'Project Manager', field: 'projectManager' },
  { header: 'Estimator', field: 'estimator' },
  { header: 'Original Contract Value', field: 'originalContractValue' },
  { header: 'Revised Estimated Contract Amount (with Change Orders)', field: 'revisedContractValue' },
  { header: 'Final Actual Contract Value', field: 'finalContractValue' },
  { header: 'Final Actual Cost', field: 'finalCost' },
  { header: 'Final Labor', field: 'finalLabor' },
  { header: 'Final Labor Hours', field: 'finalLaborHours' },
  { header: 'Final Materials', field: 'finalMaterials' },
  { header: 'Final Equipment', field: 'finalEquipment' },
  { header: 'Final Subcontracts', field: 'finalSubcontracts' },
  { header: 'Final Other', field: 'finalOther' },
  { header: 'Original Estimated Cost', field: 'originalEstimatedCost' },
  { header: 'Original Estimated Labor Cost', field: 'originalEstimatedLabor' },
  { header: 'Original Estimated Labor Hours', field: 'originalEstimatedLaborHours' },
  { header: 'Original Estimated Materials Cost', field: 'originalEstimatedMaterials' },
  { header: 'Original Estimated Equipment Cost', field: 'originalEstimatedEquipment' },
  { header: 'Original Estimated Subcontractor Cost', field: 'originalEstimatedSubcontracts' },
  { header: 'Original Estimated Other', field: 'originalEstimatedOther' },
  { header: 'Revised Estimated Cost (with Change Orders)', field: 'revisedEstimatedCost' },
  { header: 'Revised Estimated Labor (with Change Orders)', field: 'revisedEstimatedLabor' },
  { header: 'Revised Estimated Labor Hours (with Change Orders)', field: 'revisedEstimatedLaborHours' },
  { header: 'Revised Estimated Materials (with Change Orders)', field: 'revisedEstimatedMaterials' },
  { header: 'Revised Estimated Equipment (with Change Orders)', field: 'revisedEstimatedEquipment' },
  { header: 'Revised Estimated Subcontracts (with Change Orders)', field: 'revisedEstimatedSubcontracts' },
  { header: 'Revised Estimated Other (with Change Orders)', field: 'revisedEstimatedOther' },
  { header: 'Original Estimated Profit', field: 'originalEstimatedProfit' },
  { header: 'Original Estimated Profit Margin (%)', field: 'originalEstimatedProfitMargin' },
  { header: 'Revised Estimated Profit', field: 'revisedEstimatedProfit' },
  { header: 'Revised Estimated Profit Margin (%)', field: 'revisedEstimatedProfitMargin' },
  { header: 'Final Profit', field: 'finalProfit' },
  { header: 'Final Gross Profit Margin (%)', field: 'finalGrossProfitMargin' },
  { header: 'Gain / Fade ORG - FINAL ($)', field: 'gainFadeOrgFinalDollars' },
  { header: 'Gain / Fade ORG - FINAL(%)', field: 'gainFadeOrgFinalPercent' },
  { header: 'Gain / Fade REV EST - FINAL(%)', field: 'gainFadeRevFinalPercent' },
  { header: 'Overall Gain/Fade', field: 'overallGainFade' },
];

/**
 * Other header spellings the parser accepts. These are the headers from the first version
 * of the template (a BI export, hence the trailing "1", the "(copy)" column and the
 * "Overal" typo). Files built on the old template keep working.
 */
const HEADER_ALIASES: Record<string, Field> = {
  'Customer Name1': 'customerName',
  'Division1': 'division',
  'Project Name1': 'projectName',
  'Project Number1': 'projectNumber',
  'Market Segment1': 'marketSegment',
  'Final Actual Contract Value (copy)': 'finalContractValue',
  'Overal Gain/Fade': 'overallGainFade',
};

/** Headers are matched without regard to case or spacing, so "final  labor" still maps. */
function normalizeHeader(h: string): string {
  // Excel writes a byte-order mark (U+FEFF) in front of the first header; drop it.
  const text = h.charCodeAt(0) === 0xfeff ? h.slice(1) : h;
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

const HEADER_LOOKUP = new Map<string, Field>([
  ...TEMPLATE_COLUMNS.map((c) => [normalizeHeader(c.header), c.field] as [string, Field]),
  ...Object.entries(HEADER_ALIASES).map(([h, f]) => [normalizeHeader(h), f] as [string, Field]),
]);

const TEXT_FIELDS = new Set<Field>([
  'customerName', 'division', 'projectName', 'projectNumber', 'marketSegment', 'projectManager', 'estimator',
]);

/** Fields stored as a fraction (0.225 means 22.5%). */
const FRACTION_FIELDS = new Set<Field>([
  'originalEstimatedProfitMargin', 'revisedEstimatedProfitMargin', 'finalGrossProfitMargin',
  'gainFadeOrgFinalPercent', 'gainFadeRevFinalPercent',
]);

/**
 * Columns the core math cannot run without. A file missing any of these is rejected with
 * the list, because the alternative (the old behavior) was to fill them with zeros and
 * show a dashboard of confident nonsense.
 */
const REQUIRED_FIELDS: Field[] = ['originalContractValue', 'finalContractValue', 'originalEstimatedCost', 'finalCost'];

function headerFor(field: Field): string {
  return TEMPLATE_COLUMNS.find((c) => c.field === field)?.header ?? field;
}

/** Read "$1,250,000", "(10,000)" and "22.5%" the way a person would. */
function parseNumber(raw: unknown): { value: number; hadPercentSign: boolean } | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? { value: raw, hadPercentSign: false } : null;
  let str = String(raw).trim();
  if (str === '') return null;
  const hadPercentSign = str.includes('%');
  // Accounting exports write negatives in parentheses.
  const parenNegative = /^\(.*\)$/.test(str);
  str = str.replace(/[$,%\s()]/g, '');
  const num = parseFloat(str);
  if (Number.isNaN(num)) return null;
  return { value: parenNegative ? -num : num, hadPercentSign };
}

function emptyRecord(): ProjectRecord {
  return {
    customerName: '', division: '', projectName: '', projectNumber: '', yearCompleted: 0,
    marketSegment: '', projectManager: '', estimator: '',
    originalContractValue: 0, revisedContractValue: 0, finalContractValue: 0,
    finalCost: 0, finalLabor: 0, finalLaborHours: 0, finalMaterials: 0, finalEquipment: 0,
    finalSubcontracts: 0, finalOther: 0,
    originalEstimatedCost: 0, originalEstimatedLabor: 0, originalEstimatedLaborHours: 0,
    originalEstimatedMaterials: 0, originalEstimatedEquipment: 0, originalEstimatedSubcontracts: 0,
    originalEstimatedOther: 0,
    revisedEstimatedCost: 0, revisedEstimatedLabor: 0, revisedEstimatedLaborHours: 0,
    revisedEstimatedMaterials: 0, revisedEstimatedEquipment: 0, revisedEstimatedSubcontracts: 0,
    revisedEstimatedOther: 0,
    originalEstimatedProfit: 0, originalEstimatedProfitMargin: 0,
    revisedEstimatedProfit: 0, revisedEstimatedProfitMargin: 0,
    finalProfit: 0, finalGrossProfitMargin: 0,
    gainFadeOrgFinalDollars: 0, gainFadeOrgFinalPercent: 0, gainFadeRevFinalPercent: 0,
    overallGainFade: 'Gain',
  };
}

/**
 * Turn one CSV row into a record. `fieldByHeader` maps the file's own header text to a field.
 * Any derived figure the file leaves blank is computed from the figures it does supply, so a
 * file with only contract values and costs still produces correct profit, margin and gain/fade.
 */
function mapRow(row: Record<string, unknown>, fieldByHeader: Map<string, Field>): ProjectRecord {
  const record = emptyRecord();
  const supplied = new Set<Field>();
  let gainFadeText = '';

  for (const [header, field] of fieldByHeader.entries()) {
    const raw = row[header];
    if (TEXT_FIELDS.has(field)) {
      const text = String(raw ?? '').trim();
      if (text) {
        (record as unknown as Record<string, unknown>)[field] = text;
        supplied.add(field);
      }
      continue;
    }
    if (field === 'overallGainFade') {
      gainFadeText = String(raw ?? '').trim().toLowerCase();
      continue;
    }
    const parsed = parseNumber(raw);
    if (!parsed) continue;
    let value = parsed.value;
    if (FRACTION_FIELDS.has(field)) {
      // Margins arrive as 0.225, 22.5 or "22.5%". A percent sign settles it. Without one,
      // anything above 1.5 is read as a percentage: a 150% gross margin does not exist on
      // a construction job, and 1.5 leaves room for a real fraction like 0.35.
      if (parsed.hadPercentSign || Math.abs(value) > 1.5) value = value / 100;
    }
    (record as unknown as Record<string, unknown>)[field] = value;
    supplied.add(field);
  }

  // Fill in what the file did not supply. Each formula is the definition of the field.
  // Revised figures are never invented: with no change-order data they stay at zero, so the
  // analysis falls back to the original estimate and says so.
  if (!supplied.has('originalEstimatedProfit')) {
    record.originalEstimatedProfit = record.originalContractValue - record.originalEstimatedCost;
  }
  if (!supplied.has('originalEstimatedProfitMargin')) {
    record.originalEstimatedProfitMargin = record.originalContractValue > 0
      ? record.originalEstimatedProfit / record.originalContractValue : 0;
  }
  if (!supplied.has('revisedEstimatedProfit') && record.revisedEstimatedCost > 0) {
    record.revisedEstimatedProfit = record.revisedContractValue - record.revisedEstimatedCost;
  }
  if (!supplied.has('revisedEstimatedProfitMargin') && record.revisedContractValue > 0) {
    record.revisedEstimatedProfitMargin = record.revisedEstimatedProfit / record.revisedContractValue;
  }
  if (!supplied.has('finalProfit')) {
    record.finalProfit = record.finalContractValue - record.finalCost;
  }
  if (!supplied.has('finalGrossProfitMargin')) {
    record.finalGrossProfitMargin = record.finalContractValue > 0 ? record.finalProfit / record.finalContractValue : 0;
  }
  if (!supplied.has('gainFadeOrgFinalDollars')) {
    // Gain/fade in dollars: final profit against the profit in the original estimate.
    record.gainFadeOrgFinalDollars = record.finalProfit - record.originalEstimatedProfit;
  }
  if (!supplied.has('gainFadeOrgFinalPercent')) {
    record.gainFadeOrgFinalPercent = record.finalGrossProfitMargin - record.originalEstimatedProfitMargin;
  }
  if (!supplied.has('gainFadeRevFinalPercent') && record.revisedContractValue > 0) {
    record.gainFadeRevFinalPercent = record.finalGrossProfitMargin - record.revisedEstimatedProfitMargin;
  }

  // The label follows the file when the file says "Gain" or "Fade". A blank or unreadable
  // label is derived from the dollars; it used to default to "Gain", which hid fades.
  if (gainFadeText === 'gain' || gainFadeText === 'fade') {
    record.overallGainFade = gainFadeText === 'fade' ? 'Fade' : 'Gain';
  } else {
    record.overallGainFade = record.gainFadeOrgFinalDollars >= 0 ? 'Gain' : 'Fade';
  }

  return record;
}

export interface ParseResult {
  data: ProjectRecord[];
  /** Problems that stop the load. */
  errors: string[];
  /** Things the user should know that change how the analysis reads. */
  warnings: string[];
}

/** Parse CSV text. Pure (no File or DOM), so it runs in tests. */
export function parseCsvText(text: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // dynamicTyping is off on purpose: it would turn project number "00417" into 417.
  const results = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: 'greedy' });

  const fieldByHeader = new Map<string, Field>();
  const unknownHeaders: string[] = [];
  for (const header of results.meta.fields ?? []) {
    const field = HEADER_LOOKUP.get(normalizeHeader(header));
    if (field) fieldByHeader.set(header, field);
    else if (header.trim()) unknownHeaders.push(header.trim());
  }
  const present = new Set(fieldByHeader.values());

  const missingRequired = REQUIRED_FIELDS.filter((f) => !present.has(f));
  if (!present.has('projectName') && !present.has('projectNumber')) {
    errors.push('Missing a "Project Name" or "Project Number" column. At least one is needed to tell projects apart.');
  }
  if (missingRequired.length > 0) {
    errors.push(`Missing required column${missingRequired.length === 1 ? '' : 's'}: ${missingRequired.map(headerFor).join(', ')}. Download the template to see the expected headers.`);
  }
  if (errors.length > 0) return { data: [], errors, warnings };

  for (const e of results.errors) {
    // Papa reports row numbers from zero and not counting the header; +2 matches the
    // row number a person sees in a spreadsheet.
    warnings.push(`Row ${typeof e.row === 'number' ? e.row + 2 : '?'}: ${e.message}`);
  }

  const data: ProjectRecord[] = [];
  for (const row of results.data) {
    const mapped = mapRow(row, fieldByHeader);
    if (mapped.projectName || mapped.projectNumber) data.push(mapped);
  }
  if (data.length === 0) {
    errors.push('No project rows found. Each row needs a project name or number.');
    return { data, errors, warnings };
  }

  if (!present.has('revisedEstimatedCost')) {
    warnings.push('No revised estimate columns found. Cost variance is measured against the original estimate, so approved change-order cost will show as overrun.');
  }
  if (!present.has('finalLaborHours') || !present.has('originalEstimatedLaborHours')) {
    warnings.push('No labor hours columns found. Labor variance cannot be split into hours and rate.');
  }
  const categoryFields: Field[] = ['finalLabor', 'finalMaterials', 'finalEquipment', 'finalSubcontracts', 'finalOther'];
  if (!categoryFields.some((f) => present.has(f))) {
    warnings.push('No cost category columns found (labor, materials, equipment, subcontracts, other). Cost driver analysis will be empty.');
  }
  if (unknownHeaders.length > 0) {
    warnings.push(`Ignored ${unknownHeaders.length} unrecognized column${unknownHeaders.length === 1 ? '' : 's'}: ${unknownHeaders.slice(0, 6).join(', ')}${unknownHeaders.length > 6 ? ', ...' : ''}.`);
  }

  return { data, errors, warnings };
}

export async function parseCSV(file: File): Promise<ParseResult> {
  return parseCsvText(await file.text());
}

/**
 * One worked example for the template. Only the inputs are typed here; profit, margin and
 * gain/fade are computed below so the example always foots.
 */
function templateExample(): ProjectRecord {
  const base = {
    ...emptyRecord(),
    customerName: 'Example General Contractor',
    division: 'Commercial',
    projectName: 'Office Building HVAC',
    projectNumber: '10001',
    yearCompleted: 2024,
    marketSegment: 'Office / Commercial',
    projectManager: 'Jordan Example',
    estimator: 'Riley Example',
    originalContractValue: 500000,
    revisedContractValue: 525000,
    finalContractValue: 525000,
    originalEstimatedLabor: 110000, originalEstimatedLaborHours: 1800, originalEstimatedMaterials: 85000,
    originalEstimatedEquipment: 90000, originalEstimatedSubcontracts: 55000, originalEstimatedOther: 35000,
    revisedEstimatedLabor: 115000, revisedEstimatedLaborHours: 1900, revisedEstimatedMaterials: 88000,
    revisedEstimatedEquipment: 93000, revisedEstimatedSubcontracts: 58000, revisedEstimatedOther: 36000,
    finalLabor: 127000, finalLaborHours: 2080, finalMaterials: 90000,
    finalEquipment: 93000, finalSubcontracts: 58000, finalOther: 37000,
  };
  const originalEstimatedCost = base.originalEstimatedLabor + base.originalEstimatedMaterials + base.originalEstimatedEquipment + base.originalEstimatedSubcontracts + base.originalEstimatedOther;
  const revisedEstimatedCost = base.revisedEstimatedLabor + base.revisedEstimatedMaterials + base.revisedEstimatedEquipment + base.revisedEstimatedSubcontracts + base.revisedEstimatedOther;
  const finalCost = base.finalLabor + base.finalMaterials + base.finalEquipment + base.finalSubcontracts + base.finalOther;
  const originalEstimatedProfit = base.originalContractValue - originalEstimatedCost;
  const revisedEstimatedProfit = base.revisedContractValue - revisedEstimatedCost;
  const finalProfit = base.finalContractValue - finalCost;
  const round4 = (v: number) => Math.round(v * 10000) / 10000;
  const originalEstimatedProfitMargin = round4(originalEstimatedProfit / base.originalContractValue);
  const revisedEstimatedProfitMargin = round4(revisedEstimatedProfit / base.revisedContractValue);
  const finalGrossProfitMargin = round4(finalProfit / base.finalContractValue);
  const gainFadeOrgFinalDollars = finalProfit - originalEstimatedProfit;
  return {
    ...base,
    originalEstimatedCost,
    revisedEstimatedCost,
    finalCost,
    originalEstimatedProfit,
    originalEstimatedProfitMargin,
    revisedEstimatedProfit,
    revisedEstimatedProfitMargin,
    finalProfit,
    finalGrossProfitMargin,
    gainFadeOrgFinalDollars,
    gainFadeOrgFinalPercent: round4(finalGrossProfitMargin - originalEstimatedProfitMargin),
    gainFadeRevFinalPercent: round4(finalGrossProfitMargin - revisedEstimatedProfitMargin),
    overallGainFade: gainFadeOrgFinalDollars >= 0 ? 'Gain' : 'Fade',
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function generateTemplateCSV(): string {
  const example = templateExample();
  const headers = TEMPLATE_COLUMNS.map((c) => csvCell(c.header));
  const row = TEMPLATE_COLUMNS.map((c) => csvCell(example[c.field]));
  return [headers.join(','), row.join(',')].join('\n');
}
