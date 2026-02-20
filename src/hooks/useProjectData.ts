import { useContext } from 'react';
import { ProjectDataContext } from '@/context/ProjectDataContext';

export function useProjectData() {
  const context = useContext(ProjectDataContext);
  if (!context) {
    throw new Error('useProjectData must be used within a ProjectDataProvider');
  }
  return context;
}
