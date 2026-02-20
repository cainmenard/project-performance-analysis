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
          <h1 className="text-lg font-semibold tracking-tight">
            Project Performance Analysis
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {state.isLoaded && (
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
