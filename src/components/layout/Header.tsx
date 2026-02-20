import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, BarChart3, Upload, Search, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useProjectData } from '@/hooks/useProjectData';
import { useNavigate } from 'react-router-dom';
import { formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { ExportButton } from '@/components/ExportReport';

function ProjectSearch() {
  const { state } = useProjectData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.length >= 1
    ? state.projects
        .filter((p) =>
          p.projectName.toLowerCase().includes(query.toLowerCase()) ||
          p.customerName.toLowerCase().includes(query.toLowerCase()) ||
          p.projectNumber.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!state.isLoaded) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search projects</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          <span className="text-[10px]">&#8984;</span>K
        </kbd>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl z-50">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by project name, customer, or number..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {results.length > 0 ? (
            <div className="max-h-72 overflow-y-auto py-1">
              {results.map((p) => (
                <button
                  key={p.projectNumber}
                  onClick={() => { navigate(`/project/${p.projectNumber}`); setIsOpen(false); setQuery(''); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.projectName}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.customerName} &middot; {p.division} &middot; {p.marketSegment}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">{formatPercent(p.finalGrossProfitMargin)}</span>
                    <span className={cn(
                      'inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      p.overallGainFade === 'Gain' ? 'bg-gain/10 text-gain' : 'bg-fade/10 text-fade'
                    )}>
                      {p.overallGainFade}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 1 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No projects found for "{query}"
            </div>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Start typing to search {state.projects.length} projects
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
            <p className="text-[10px] text-muted-foreground tracking-wide">by Automized</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ProjectSearch />
          <ExportButton />
          {state.isLoaded && (
            <button
              onClick={() => { resetData(); navigate('/'); }}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">New Data</span>
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
