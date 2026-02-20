import { Outlet, Navigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar, MobileNav } from './Sidebar';
import { FilterBar } from './FilterBar';
import { useProjectData } from '@/hooks/useProjectData';

export function AppShell() {
  const { state } = useProjectData();

  if (!state.isLoaded) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <MobileNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="mb-4">
            <FilterBar />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
