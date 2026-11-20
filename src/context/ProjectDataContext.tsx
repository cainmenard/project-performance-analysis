import { useReducer, useCallback, useEffect, type ReactNode } from 'react';
import type { ProjectRecord, FilterState } from '@/lib/types';
import { sampleData } from '@/lib/sampleData';
import { clearSnapshot, getSessionStorage, saveFilters, saveLoadedData } from '@/lib/sessionSnapshot';
import { ProjectDataContext, type ProjectDataState } from './projectDataContextDef';
import { initialState, NOT_KEPT_NOTE, resolveInitialState } from './initialState';

type Action =
  | { type: 'LOAD_SAMPLE' }
  | { type: 'LOAD_CSV'; payload: ProjectRecord[]; warnings: string[] }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'NOT_KEPT' }
  | { type: 'RESET' };

function getInitialState(): ProjectDataState {
  if (typeof window === 'undefined') return initialState;
  return resolveInitialState(window.location, getSessionStorage(), sampleData);
}

function reducer(state: ProjectDataState, action: Action): ProjectDataState {
  switch (action.type) {
    case 'LOAD_SAMPLE':
      return { ...state, projects: sampleData, isLoaded: true, dataSource: 'sample', dataWarnings: [], filters: initialState.filters };
    case 'LOAD_CSV':
      return { ...state, projects: action.payload, isLoaded: true, dataSource: 'csv', dataWarnings: action.warnings, filters: initialState.filters };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'NOT_KEPT':
      if (state.dataWarnings.includes(NOT_KEPT_NOTE)) return state;
      return { ...state, dataWarnings: [...state.dataWarnings, NOT_KEPT_NOTE] };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function ProjectDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  // Keep the loaded portfolio for a refresh. This runs only when a file or the sample is
  // loaded or cleared, not on filter changes, so a large upload is serialized once per load.
  const { isLoaded, projects, dataSource, embed, dataWarnings } = state;
  useEffect(() => {
    const storage = getSessionStorage();
    if (!isLoaded || dataSource === 'none') {
      clearSnapshot(storage);
      return;
    }
    const kept = saveLoadedData(storage, { projects, dataSource, embed, dataWarnings });
    // Only an upload can be too large; the sample is stored as one word. When storage is
    // missing altogether (blocked, sandboxed) there is nothing to warn about that the
    // visitor can act on, so the note is limited to a refused write.
    if (!kept && storage && dataSource === 'csv') dispatch({ type: 'NOT_KEPT' });
  }, [isLoaded, projects, dataSource, embed, dataWarnings]);

  const { filters } = state;
  useEffect(() => {
    if (isLoaded) saveFilters(getSessionStorage(), filters);
  }, [isLoaded, filters]);

  const loadSampleData = useCallback(() => dispatch({ type: 'LOAD_SAMPLE' }), []);
  const loadCsvData = useCallback((data: ProjectRecord[], warnings: string[] = []) => dispatch({ type: 'LOAD_CSV', payload: data, warnings }), []);
  const setFilters = useCallback((filters: Partial<FilterState>) => dispatch({ type: 'SET_FILTERS', payload: filters }), []);
  const resetData = useCallback(() => dispatch({ type: 'RESET' }), []);

  const filteredProjects = state.projects.filter((p) => {
    const { divisions, marketSegments, years, gainFade, customers, projectManagers, estimators } = state.filters;
    if (divisions.length > 0 && !divisions.includes(p.division)) return false;
    if (marketSegments.length > 0 && !marketSegments.includes(p.marketSegment)) return false;
    if (years.length > 0 && !years.includes(p.yearCompleted)) return false;
    if (gainFade.length > 0 && !gainFade.includes(p.overallGainFade)) return false;
    if (customers.length > 0 && !customers.includes(p.customerName)) return false;
    if (projectManagers.length > 0 && !projectManagers.includes(p.projectManager)) return false;
    if (estimators.length > 0 && !estimators.includes(p.estimator)) return false;
    return true;
  });

  return (
    <ProjectDataContext.Provider value={{ state, loadSampleData, loadCsvData, setFilters, resetData, filteredProjects }}>
      {children}
    </ProjectDataContext.Provider>
  );
}
