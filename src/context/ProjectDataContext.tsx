import { createContext, useReducer, useCallback, type ReactNode } from 'react';
import type { ProjectRecord, FilterState } from '@/lib/types';
import { sampleData } from '@/lib/sampleData';

interface ProjectDataState {
  projects: ProjectRecord[];
  isLoaded: boolean;
  dataSource: 'none' | 'sample' | 'csv';
  embed: boolean;
  filters: FilterState;
}

type Action =
  | { type: 'LOAD_SAMPLE' }
  | { type: 'LOAD_CSV'; payload: ProjectRecord[] }
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
  filters: emptyFilters,
};

// When the app is loaded inside the portfolio iframe (?embed=1), skip the
// marketing landing page and boot straight into the analysis on sample data.
function getInitialState(): ProjectDataState {
  if (typeof window === 'undefined') return initialState;
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === '1';
  if (!isEmbed) return initialState;
  return { projects: sampleData, isLoaded: true, dataSource: 'sample', embed: true, filters: emptyFilters };
}

function reducer(state: ProjectDataState, action: Action): ProjectDataState {
  switch (action.type) {
    case 'LOAD_SAMPLE':
      return { ...state, projects: sampleData, isLoaded: true, dataSource: 'sample', filters: initialState.filters };
    case 'LOAD_CSV':
      return { ...state, projects: action.payload, isLoaded: true, dataSource: 'csv', filters: initialState.filters };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export interface ProjectDataContextType {
  state: ProjectDataState;
  loadSampleData: () => void;
  loadCsvData: (data: ProjectRecord[]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetData: () => void;
  filteredProjects: ProjectRecord[];
}

export const ProjectDataContext = createContext<ProjectDataContextType | null>(null);

export function ProjectDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  const loadSampleData = useCallback(() => dispatch({ type: 'LOAD_SAMPLE' }), []);
  const loadCsvData = useCallback((data: ProjectRecord[]) => dispatch({ type: 'LOAD_CSV', payload: data }), []);
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
