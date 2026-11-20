import { describe, it, expect } from 'vitest';
import { sampleData } from '@/lib/sampleData';
import { DATA_KEY, saveLoadedData, type SnapshotStorage } from '@/lib/sessionSnapshot';
import type { ProjectRecord } from '@/lib/types';
import { initialState, resolveInitialState } from './initialState';

function memoryStorage(): SnapshotStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => { map.set(k, v); }, removeItem: (k) => { map.delete(k); } };
}

const upload: ProjectRecord[] = [{ ...sampleData[0], projectNumber: 'UP-1', customerName: 'Uploaded Customer' }];

function withUpload() {
  const storage = memoryStorage();
  saveLoadedData(storage, { projects: upload, dataSource: 'csv', embed: false, dataWarnings: ['note'] });
  return storage;
}

describe('resolveInitialState', () => {
  it('boots ?embed=1 on sample data even when the tab holds an upload', () => {
    const state = resolveInitialState({ pathname: '/gain-fade', search: '?embed=1' }, withUpload(), sampleData);
    expect(state).toMatchObject({ isLoaded: true, dataSource: 'sample', embed: true });
    expect(state.projects).toBe(sampleData);
  });

  it('restores an upload on refresh, on any route', () => {
    for (const pathname of ['/dashboard', '/project/UP-1', '/']) {
      const state = resolveInitialState({ pathname, search: '' }, withUpload(), sampleData);
      expect(state, pathname).toMatchObject({ isLoaded: true, dataSource: 'csv', embed: false, dataWarnings: ['note'] });
      expect(state.projects, pathname).toEqual(upload);
    }
  });

  it('boots a cold deep link on sample data', () => {
    const state = resolveInitialState({ pathname: '/market', search: '' }, memoryStorage(), sampleData);
    expect(state).toMatchObject({ isLoaded: true, dataSource: 'sample', embed: false });
    expect(state.projects).toBe(sampleData);
  });

  it('boots a cold deep link on sample data when storage is unavailable', () => {
    const state = resolveInitialState({ pathname: '/dashboard', search: '' }, null, sampleData);
    expect(state).toMatchObject({ isLoaded: true, dataSource: 'sample' });
  });

  it('starts empty on the landing page and on unknown paths', () => {
    for (const pathname of ['/', '/nope']) {
      expect(resolveInitialState({ pathname, search: '' }, memoryStorage(), sampleData), pathname).toEqual(initialState);
    }
  });

  it('sends a refresh to the upload page when the upload was too large to keep', () => {
    const storage = memoryStorage();
    storage.map.set(DATA_KEY, JSON.stringify({ dataSource: 'csv', embed: false, dataWarnings: [], tooLarge: true }));
    expect(resolveInitialState({ pathname: '/dashboard', search: '' }, storage, sampleData)).toEqual(initialState);
  });
});
