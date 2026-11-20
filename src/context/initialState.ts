import type { FilterState, ProjectRecord } from '@/lib/types';
import type { ProjectDataState } from './projectDataContextDef';
import { isAppRoute } from '@/lib/appRoutes';
import { readSnapshot, type SnapshotStorage } from '@/lib/sessionSnapshot';

export const emptyFilters: FilterState = {
  divisions: [],
  marketSegments: [],
  years: [],
  gainFade: [],
  customers: [],
  projectManagers: [],
  estimators: [],
};

// Shown in the notes box when the browser will not hold an upload, so a refresh that lands
// on the upload page is expected rather than a surprise.
export const NOT_KEPT_NOTE = 'This file is too large for the browser to keep through a page refresh. A refresh will return to the upload page.';

export const initialState: ProjectDataState = {
  projects: [],
  isLoaded: false,
  dataSource: 'none',
  embed: false,
  dataWarnings: [],
  filters: emptyFilters,
};

/**
 * Decide what the app holds on its first render. Pure, so every branch has a test.
 *
 * 1. ?embed=1 (the portfolio iframe) boots on sample data, as it always has. It is checked
 *    first so the iframe shows the same thing on every visit whatever the tab held before.
 * 2. A snapshot from earlier in this tab is restored, so a refresh keeps the file.
 * 3. A snapshot that was too large to keep sends the visitor to the upload page.
 * 4. A first visit to an analysis URL (a shared link, a bookmark, a new tab) boots on the
 *    sample portfolio instead of bouncing to the landing page. The header's "Sample data"
 *    badge says what is on screen.
 * 5. Anything else starts empty on the landing page.
 */
export function resolveInitialState(
  location: { pathname: string; search: string },
  storage: SnapshotStorage | null,
  sampleData: ProjectRecord[],
): ProjectDataState {
  const isEmbed = new URLSearchParams(location.search).get('embed') === '1';
  if (isEmbed) {
    return { ...initialState, projects: sampleData, isLoaded: true, dataSource: 'sample', embed: true };
  }

  const snapshot = readSnapshot(storage, sampleData, emptyFilters);
  if (snapshot.kind === 'restored') {
    return { ...initialState, ...snapshot.data, isLoaded: true, filters: snapshot.filters ?? emptyFilters };
  }
  if (snapshot.kind === 'tooLarge') return initialState;

  if (isAppRoute(location.pathname)) {
    return { ...initialState, projects: sampleData, isLoaded: true, dataSource: 'sample' };
  }
  return initialState;
}
