import { describe, it, expect } from 'vitest';
import { sampleData } from './sampleData';
import { generateTemplateCSV, parseCsvText } from './csvParser';
import {
  DATA_KEY,
  FILTERS_KEY,
  clearSnapshot,
  decodeProjects,
  encodeProjects,
  readSnapshot,
  saveFilters,
  saveLoadedData,
  type SnapshotStorage,
} from './sessionSnapshot';
import type { FilterState } from './types';

const emptyFilters: FilterState = {
  divisions: [], marketSegments: [], years: [], gainFade: [], customers: [], projectManagers: [], estimators: [],
};

/** In-memory Storage. `limit` caps the characters one value may hold, to simulate the quota. */
function memoryStorage(limit = Infinity): SnapshotStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      if (v.length > limit) throw new DOMException('quota', 'QuotaExceededError');
      map.set(k, v);
    },
    removeItem: (k) => { map.delete(k); },
  };
}

// A CSV with one dated and one undated row, so the optional fields are present on some
// records and absent on others.
function csvProjects() {
  const template = generateTemplateCSV();
  const [header, row] = template.trim().split('\n');
  const undated = row.replace('2023-05-15', '').replace('2024-03-29', '').replace('10001', '10002');
  const result = parseCsvText([header, row, undated].join('\n'));
  expect(result.errors).toEqual([]);
  return result;
}

describe('encodeProjects / decodeProjects', () => {
  it('round-trips the sample portfolio exactly', () => {
    const { columns, rows } = encodeProjects(sampleData);
    const back = decodeProjects(columns, JSON.parse(JSON.stringify(rows)));
    expect(back).toEqual(sampleData);
  });

  it('keeps optional dates absent on rows that had none', () => {
    const { data } = csvProjects();
    expect(data[0].bidDate).toBe('2023-05-15');
    expect(data[1].bidDate).toBeUndefined();
    const { columns, rows } = encodeProjects(data);
    const back = decodeProjects(columns, JSON.parse(JSON.stringify(rows)));
    expect(back).toEqual(data);
    expect('bidDate' in back[1]).toBe(false);
  });
});

describe('saveLoadedData / readSnapshot', () => {
  it('restores an upload with its warnings and filters', () => {
    const storage = memoryStorage();
    const { data, warnings } = csvProjects();
    expect(saveLoadedData(storage, { projects: data, dataSource: 'csv', embed: false, dataWarnings: warnings })).toBe(true);
    saveFilters(storage, { ...emptyFilters, years: [2024] });

    const result = readSnapshot(storage, sampleData, emptyFilters);
    expect(result.kind).toBe('restored');
    if (result.kind !== 'restored') return;
    expect(result.data.projects).toEqual(data);
    expect(result.data.dataSource).toBe('csv');
    expect(result.data.dataWarnings).toEqual(warnings);
    expect(result.filters?.years).toEqual([2024]);
  });

  it('stores sample data as a marker and rebuilds it from the bundle', () => {
    const storage = memoryStorage();
    saveLoadedData(storage, { projects: sampleData, dataSource: 'sample', embed: true, dataWarnings: [] });
    // A few dozen characters, not the 48 projects.
    expect(storage.map.get(DATA_KEY)!.length).toBeLessThan(100);
    const result = readSnapshot(storage, sampleData, emptyFilters);
    expect(result.kind === 'restored' && result.data.projects).toBe(sampleData);
    expect(result.kind === 'restored' && result.data.embed).toBe(true);
  });

  it('leaves a too-large marker, not stale data, when the quota refuses the write', () => {
    const storage = memoryStorage(500);
    storage.map.set(DATA_KEY, JSON.stringify({ dataSource: 'sample', embed: false, dataWarnings: [] }));
    const { data } = csvProjects();
    expect(saveLoadedData(storage, { projects: data, dataSource: 'csv', embed: false, dataWarnings: [] })).toBe(false);
    expect(readSnapshot(storage, sampleData, emptyFilters)).toEqual({ kind: 'tooLarge' });
  });

  it('removes the old snapshot when even the marker cannot be written', () => {
    const storage = memoryStorage(10);
    storage.map.set(DATA_KEY, JSON.stringify({ dataSource: 'sample', embed: false, dataWarnings: [] }));
    expect(saveLoadedData(storage, { projects: sampleData, dataSource: 'csv', embed: false, dataWarnings: [] })).toBe(false);
    expect(storage.map.has(DATA_KEY)).toBe(false);
  });

  it('reads malformed or unknown snapshots as none', () => {
    const storage = memoryStorage();
    for (const value of ['not json', '[]', '{"dataSource":"excel"}', '{"dataSource":"csv","columns":["a"],"rows":[[1,2]]}', '{"dataSource":"csv","columns":["a"],"rows":[]}']) {
      storage.map.set(DATA_KEY, value);
      expect(readSnapshot(storage, sampleData, emptyFilters), value).toEqual({ kind: 'none' });
    }
    expect(readSnapshot(null, sampleData, emptyFilters)).toEqual({ kind: 'none' });
  });

  it('fills filters missing from an older snapshot with empty lists', () => {
    const storage = memoryStorage();
    saveLoadedData(storage, { projects: sampleData, dataSource: 'sample', embed: false, dataWarnings: [] });
    storage.map.set(FILTERS_KEY, JSON.stringify({ divisions: ['North'], estimators: 'not a list' }));
    const result = readSnapshot(storage, sampleData, emptyFilters);
    expect(result.kind === 'restored' && result.filters).toEqual({ ...emptyFilters, divisions: ['North'] });
  });

  it('clearSnapshot removes data and filters', () => {
    const storage = memoryStorage();
    saveLoadedData(storage, { projects: sampleData, dataSource: 'sample', embed: false, dataWarnings: [] });
    saveFilters(storage, emptyFilters);
    clearSnapshot(storage);
    expect(storage.map.size).toBe(0);
  });
});
