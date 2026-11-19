import { useReducer, useCallback, type ReactNode } from 'react';
import type { ProjectRecord, FilterState } from '@/lib/types';
import { sampleData } from '@/lib/sampleData';
import { ProjectDataContext, type ProjectDataState } from './projectDataContextDef';

type Action =
  | { type: 'LOAD_SAMPLE' }
  | { type: 'LOAD_CSV'; payload: ProjectRecord[]; warnings: string[] }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'RESET' };

const emptyFilters: FilterState = {
  divisions: [],
  marketSegments: [],
  years: [],
  gainFade: [],
  customers: [],
  projectManagers: [],
  estimators: [],
};

const initialState: ProjectDataState = {
  projects: [],
  isLoaded: false,
  dataSource: 'none',
  embed: false,
  dataWarnings: [],
  filters: emptyFilters,
};

// When the app is loaded inside the portfolio iframe (?embed=1), skip the
// marketing landing page and boot straight into the analysis on sample data.
function getInitialState(): ProjectDataState {
  if (typeof window === 'undefined') return initialState;
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === '1';
  if (!isEmbed) return initialState;
  return { projects: sampleData, isLoaded: true, dataSource: 'sample', embed: true, dataWarnings: [], filters: emptyFilters };
}

function reducer(state: ProjectDataState, action: Action): ProjectDataState {
  switch (action.type) {
    case 'LOAD_SAMPLE':
      return { ...state, projects: sampleData, isLoaded: true, dataSource: 'sample', dataWarnings: [], filters: initialState.filters };
    case 'LOAD_CSV':
      return { ...state, projects: action.payload, isLoaded: true, dataSource: 'csv', dataWarnings: action.warnings, filters: initialState.filters };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function ProjectDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

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
