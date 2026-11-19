import { describe, it, expect } from 'vitest';
import Papa from 'papaparse';
import { generateTemplateCSV, parseCsvText, parseDate } from './csvParser';

describe('CSV template', () => {
  it('has one example value for every header', () => {
    const rows = Papa.parse<string[]>(generateTemplateCSV()).data;
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveLength(rows[0].length);
    expect(new Set(rows[0]).size).toBe(rows[0].length); // no duplicate headers
  });

  it('round-trips through the parser into a record that foots', () => {
    const result = parseCsvText(generateTemplateCSV());
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    const [p] = result.data;
    expect(p.projectManager).toBe('Jordan Example');
    expect(p.estimator).toBe('Riley Example');
    expect(p.projectNumber).toBe('10001');
    expect(p.bidDate).toBe('2023-05-15');
    expect(p.completionDate).toBe('2024-03-29');
    expect(p.originalContractValue).toBe(500000);
    const sum = (a: number, b: number, c: number, d: number, e: number) => a + b + c + d + e;
    expect(p.originalEstimatedCost).toBe(sum(p.originalEstimatedLabor, p.originalEstimatedMaterials, p.originalEstimatedEquipment, p.originalEstimatedSubcontracts, p.originalEstimatedOther));
    expect(p.revisedEstimatedCost).toBe(sum(p.revisedEstimatedLabor, p.revisedEstimatedMaterials, p.revisedEstimatedEquipment, p.revisedEstimatedSubcontracts, p.revisedEstimatedOther));
    expect(p.finalCost).toBe(sum(p.finalLabor, p.finalMaterials, p.finalEquipment, p.finalSubcontracts, p.finalOther));
    expect(p.finalProfit).toBe(p.finalContractValue - p.finalCost);
    expect(p.gainFadeOrgFinalDollars).toBe(p.finalProfit - p.originalEstimatedProfit);
    expect(p.overallGainFade).toBe(p.gainFadeOrgFinalDollars >= 0 ? 'Gain' : 'Fade');
  });
});

describe('CSV parsing', () => {
  it('accepts the headers from the original template', () => {
    const csv = [
      'Customer Name1,Project Name1,Project Number1,Original Contract Value,Final Actual Contract Value (copy),Original Estimated Cost,Final Actual Cost,Overal Gain/Fade',
      'Acme,Job A,00417,"$1,000,000","$1,000,000","800,000","850,000",Fade',
    ].join('\n');
    const { data, errors } = parseCsvText(csv);
    expect(errors).toEqual([]);
    expect(data[0].customerName).toBe('Acme');
    expect(data[0].projectNumber).toBe('00417'); // leading zeros kept
    expect(data[0].finalContractValue).toBe(1_000_000);
    expect(data[0].overallGainFade).toBe('Fade');
  });

  it('rejects a file that is missing required columns, and names them', () => {
    const { data, errors } = parseCsvText('Project Name,Original Contract Value\nJob A,100000');
    expect(data).toEqual([]);
    expect(errors.join(' ')).toMatch(/Final Actual Contract Value/);
    expect(errors.join(' ')).toMatch(/Original Estimated Cost/);
    expect(errors.join(' ')).toMatch(/Final Actual Cost/);
  });

  it('derives profit, margin and gain/fade when the file leaves them out', () => {
    const csv = [
      'Project Name,Original Contract Value,Final Actual Contract Value,Original Estimated Cost,Final Actual Cost',
      'Job A,1000000,1000000,800000,850000',
      'Job B,500000,500000,400000,380000',
    ].join('\n');
    const { data, warnings } = parseCsvText(csv);
    expect(data[0].finalProfit).toBe(150_000);
    expect(data[0].finalGrossProfitMargin).toBeCloseTo(0.15, 10);
    expect(data[0].gainFadeOrgFinalDollars).toBe(-50_000);
    expect(data[0].overallGainFade).toBe('Fade'); // used to default to Gain when the label was blank
    expect(data[1].overallGainFade).toBe('Gain');
    expect(warnings.join(' ')).toMatch(/No revised estimate columns/);
    expect(warnings.join(' ')).toMatch(/No labor hours columns/);
  });

  it('reads percentages, parentheses and currency formatting', () => {
    const csv = [
      'Project Name,Original Contract Value,Final Actual Contract Value,Original Estimated Cost,Final Actual Cost,Final Gross Profit Margin (%),Original Estimated Profit Margin (%),Gain / Fade ORG - FINAL ($)',
      'Job A,"$1,000,000","$1,000,000","$800,000","$850,000",15%,20,"(50,000)"',
      'Job B,500000,500000,400000,380000,0.24,0.20,20000',
    ].join('\n');
    const { data } = parseCsvText(csv);
    expect(data[0].finalGrossProfitMargin).toBeCloseTo(0.15, 10);
    expect(data[0].originalEstimatedProfitMargin).toBeCloseTo(0.20, 10);
    expect(data[0].gainFadeOrgFinalDollars).toBe(-50_000);
    expect(data[1].finalGrossProfitMargin).toBeCloseTo(0.24, 10);
  });
});

describe('dates', () => {
  it('reads ISO and US formats and gives a missing day the 1st', () => {
    expect(parseDate('2021-06-15')).toBe('2021-06-15');
    expect(parseDate('2021-6')).toBe('2021-06-01');
    expect(parseDate('6/15/2021')).toBe('2021-06-15');
    expect(parseDate('6/2021')).toBe('2021-06-01');
    expect(parseDate('2021-06-15T00:00:00Z')).toBe('2021-06-15');
  });

  it('rejects what it cannot read with confidence', () => {
    for (const bad of ['', 'June 2021', '44362', '13/01/2021', '2021-13-01', '6/15/21', '0202-01-01']) {
      expect(parseDate(bad), bad).toBeNull();
    }
  });

  it('fills the completion year from the date and reports unreadable dates once', () => {
    const csv = [
      'Project Name,Original Contract Value,Final Actual Contract Value,Original Estimated Cost,Final Actual Cost,Bid Date,Completion Date',
      'Job A,1000000,1000000,800000,850000,3/1/2021,2022-08-15',
      'Job B,500000,500000,400000,380000,sometime,2023-02-01',
    ].join('\n');
    const { data, warnings } = parseCsvText(csv);
    expect(data[0].bidDate).toBe('2021-03-01');
    expect(data[0].yearCompleted).toBe(2022);
    expect(data[1].bidDate).toBeUndefined();
    expect(data[1].yearCompleted).toBe(2023);
    expect(warnings.join(' ')).toMatch(/1 date could not be read/);
    expect(warnings.join(' ')).not.toMatch(/No "Bid Date"/);
  });

  it('tells the user when the date columns are missing', () => {
    const csv = 'Project Name,Original Contract Value,Final Actual Contract Value,Original Estimated Cost,Final Actual Cost\nJob A,1,1,1,1';
    expect(parseCsvText(csv).warnings.join(' ')).toMatch(/Market exposure cannot be estimated/);
  });
});
