import { createContext } from 'react';
import type { ProjectRecord, FilterState } from '@/lib/types';

// The context object and its types live apart from the provider component so that the
// provider file exports only a component. React Fast Refresh needs that to hot-reload it.

export interface ProjectDataState {
  projects: ProjectRecord[];
  isLoaded: boolean;
  dataSource: 'none' | 'sample' | 'csv';
  embed: boolean;
  /** Notes from the CSV parser that change how the analysis reads (missing columns and so on). */
  dataWarnings: string[];
  filters: FilterState;
}

export interface ProjectDataContextType {
  state: ProjectDataState;
  loadSampleData: () => void;
  loadCsvData: (data: ProjectRecord[], warnings?: string[]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetData: () => void;
  filteredProjects: ProjectRecord[];
}

export const ProjectDataContext = createContext<ProjectDataContextType | null>(null);
