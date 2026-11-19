import { Moon, Sun, BarChart3, Upload } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useProjectData } from '@/hooks/useProjectData';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { isDark, toggle } = useTheme();
  const { state, resetData } = useProjectData();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight leading-tight">
              Project Performance Intelligence
            </h1>
          </div>
          {state.dataSource === 'sample' && (
            <span
              className="hidden sm:inline-flex rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              title="Every company, project and person in the sample data is invented."
            >
              Sample data (synthetic)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {state.isLoaded && !state.embed && (
            <button
              onClick={() => { resetData(); navigate('/'); }}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Upload className="h-4 w-4" />
              New Data
            </button>
          )}
          <button
            onClick={toggle}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
