import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatters';

describe('formatCurrency', () => {
  it('abbreviates and keeps the minus in front of the dollar sign', () => {
    expect(formatCurrency(1_234_567)).toBe('$1.2M');
    expect(formatCurrency(45_600)).toBe('$46K');
    expect(formatCurrency(950)).toBe('$950');
    expect(formatCurrency(-1_234_567)).toBe('-$1.2M');
    expect(formatCurrency(-5_200)).toBe('-$5K');
    expect(formatCurrency(-40)).toBe('-$40');
    expect(formatCurrency(0)).toBe('$0');
  });
});
