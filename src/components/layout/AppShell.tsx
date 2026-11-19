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
          {state.dataWarnings.length > 0 && (
            <div className="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-foreground">
              <p className="font-semibold">Notes on the uploaded file</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                {state.dataWarnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
