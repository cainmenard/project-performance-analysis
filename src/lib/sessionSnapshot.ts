import type { FilterState, ProjectRecord } from './types';

/**
 * Keeps the loaded portfolio in sessionStorage so a refresh does not throw it away.
 *
 * sessionStorage, not localStorage, because the landing page promises the data stays in the
 * browser: sessionStorage belongs to one tab and is cleared when the tab closes, so an
 * uploaded job cost file does not sit on the machine after the visitor is done with it.
 *
 * Data and filters are stored under separate keys. Filters change on every click and are a
 * few hundred bytes; the portfolio can be megabytes and changes only when a file is loaded.
 * Writing them apart keeps a filter click from re-serializing every project.
 */

// The version is in the key so a tab holding an older shape starts clean after a deploy
// instead of restoring fields the code no longer reads. Bump it when StoredData changes.
export const DATA_KEY = 'ppa:data:v1';
export const FILTERS_KEY = 'ppa:filters:v1';

/** The parts of Storage this module uses, so tests can pass an in-memory fake. */
export type SnapshotStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface LoadedData {
  projects: ProjectRecord[];
  dataSource: 'sample' | 'csv';
  embed: boolean;
  dataWarnings: string[];
}

interface StoredData {
  dataSource: 'sample' | 'csv';
  embed: boolean;
  dataWarnings: string[];
  /**
   * Uploaded projects as column names plus one array of values per project. Writing each
   * record as an object repeats all 45 field names on every row: the 48-project sample is
   * 64,774 characters as objects and 20,048 as columns and rows, about 3.2 times smaller.
   * Browsers allow sessionStorage about 5 MB per site, so at those per-row sizes (1,349
   * against 418 characters) this is the difference between roughly 3,700 and 12,000
   * projects fitting.
   * Absent for sample data, which is rebuilt from the bundle on restore.
   */
  columns?: string[];
  rows?: unknown[][];
  /**
   * Set when the upload was too large to store. A refresh then returns to the upload page
   * rather than quietly showing the sample portfolio in place of the visitor's file.
   */
  tooLarge?: boolean;
}

/** What a restore found. `none` means no snapshot; `tooLarge` means the file could not be kept. */
export type RestoreResult =
  | { kind: 'none' }
  | { kind: 'tooLarge' }
  | { kind: 'restored'; data: LoadedData; filters: FilterState | null };

/**
 * Returns the tab's sessionStorage, or null where reading it throws: Safari with storage
 * blocked, or a sandboxed iframe without allow-same-origin. The app then runs as it did
 * before this module existed, with nothing kept across a refresh.
 */
export function getSessionStorage(): SnapshotStorage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function encodeProjects(projects: ProjectRecord[]): { columns: string[]; rows: unknown[][] } {
  // The union of keys across all records, not the first record's keys, because the
  // optional fields (bid and completion date) can be present on some rows and not others.
  const columnSet = new Set<string>();
  for (const p of projects) for (const k of Object.keys(p)) columnSet.add(k);
  const columns = [...columnSet];
  const rows = projects.map((p) => columns.map((c) => (p as unknown as Record<string, unknown>)[c]));
  return { columns, rows };
}

export function decodeProjects(columns: string[], rows: unknown[][]): ProjectRecord[] {
  return rows.map((row) => {
    const record: Record<string, unknown> = {};
    columns.forEach((c, i) => {
      // JSON writes a missing value as null. Skipping it leaves an optional field absent,
      // which is how the parser hands over a row with no bid or completion date.
      if (row[i] !== null && row[i] !== undefined) record[c] = row[i];
    });
    return record as unknown as ProjectRecord;
  });
}

/**
 * Store the loaded portfolio. Returns false when the browser refused the write (usually the
 * storage quota), after leaving a small marker so a refresh does not restore stale data or
 * substitute the sample.
 */
export function saveLoadedData(storage: SnapshotStorage | null, data: LoadedData): boolean {
  if (!storage) return false;
  const stored: StoredData = { dataSource: data.dataSource, embed: data.embed, dataWarnings: data.dataWarnings };
  if (data.dataSource === 'csv') Object.assign(stored, encodeProjects(data.projects));
  try {
    storage.setItem(DATA_KEY, JSON.stringify(stored));
    return true;
  } catch {
    try {
      const marker: StoredData = { dataSource: 'csv', embed: data.embed, dataWarnings: [], tooLarge: true };
      storage.setItem(DATA_KEY, JSON.stringify(marker));
    } catch {
      // Storage is full or blocked outright. Drop whatever was there so a refresh cannot
      // bring back an earlier file.
      try { storage.removeItem(DATA_KEY); } catch { /* nothing left to try */ }
    }
    return false;
  }
}

export function saveFilters(storage: SnapshotStorage | null, filters: FilterState): void {
  if (!storage) return;
  try {
    storage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // Losing filters on a refresh is a small cost; it is not worth surfacing.
  }
}

export function clearSnapshot(storage: SnapshotStorage | null): void {
  if (!storage) return;
  try {
    storage.removeItem(DATA_KEY);
    storage.removeItem(FILTERS_KEY);
  } catch {
    // Nothing to clean up if storage cannot be reached.
  }
}

function readJson(storage: SnapshotStorage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/**
 * Filters are laid over the empty set field by field, so a filter added in a later release
 * starts empty instead of arriving undefined from an older snapshot.
 */
function readFilters(storage: SnapshotStorage, emptyFilters: FilterState): FilterState | null {
  const raw = readJson(storage, FILTERS_KEY);
  if (!raw || typeof raw !== 'object') return null;
  const merged = { ...emptyFilters } as Record<string, unknown>;
  for (const key of Object.keys(emptyFilters)) {
    const value = (raw as Record<string, unknown>)[key];
    if (Array.isArray(value)) merged[key] = value;
  }
  return merged as unknown as FilterState;
}

/** Read the snapshot back. Anything malformed reads as no snapshot. */
export function readSnapshot(
  storage: SnapshotStorage | null,
  sampleData: ProjectRecord[],
  emptyFilters: FilterState,
): RestoreResult {
  if (!storage) return { kind: 'none' };
  const raw = readJson(storage, DATA_KEY) as Partial<StoredData> | null;
  if (!raw || typeof raw !== 'object') return { kind: 'none' };
  if (raw.tooLarge) return { kind: 'tooLarge' };

  const dataWarnings = isStringArray(raw.dataWarnings) ? raw.dataWarnings : [];
  const embed = raw.embed === true;
  let projects: ProjectRecord[];
  if (raw.dataSource === 'sample') {
    projects = sampleData;
  } else if (raw.dataSource === 'csv') {
    const { columns, rows } = raw;
    if (!isStringArray(columns) || !Array.isArray(rows)) return { kind: 'none' };
    if (!rows.every((r) => Array.isArray(r) && r.length === columns.length)) return { kind: 'none' };
    projects = decodeProjects(columns, rows as unknown[][]);
    if (projects.length === 0) return { kind: 'none' };
  } else {
    return { kind: 'none' };
  }

  return {
    kind: 'restored',
    data: { projects, dataSource: raw.dataSource, embed, dataWarnings },
    filters: readFilters(storage, emptyFilters),
  };
}
