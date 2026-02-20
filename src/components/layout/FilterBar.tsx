import { useState } from 'react';
import { useProjectData } from '@/hooks/useProjectData';
import { calculatePortfolioSummary } from '@/lib/calculations';
import { cn } from '@/lib/cn';
import { Filter, X, ChevronDown } from 'lucide-react';

function FilterDropdown({ label, options, selected, onToggle, colorFn }: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  colorFn?: (value: string) => string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
          selected.length > 0
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:bg-accent'
        )}
      >
        {label}
        {selected.length > 0 && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 max-h-64 min-w-[180px] overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-lg">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                  selected.includes(opt)
                    ? colorFn ? colorFn(opt) : 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <span className={cn(
                  'h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0',
                  selected.includes(opt) ? 'border-primary bg-primary' : 'border-border'
                )}>
                  {selected.includes(opt) && (
                    <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function FilterBar() {
  const { state, setFilters } = useProjectData();
  const summary = calculatePortfolioSummary(state.projects);

  const hasFilters = state.filters.divisions.length > 0 ||
    state.filters.marketSegments.length > 0 ||
    state.filters.years.length > 0 ||
    state.filters.gainFade.length > 0 ||
    state.filters.customers.length > 0 ||
    state.filters.projectManagers.length > 0 ||
    state.filters.estimators.length > 0;

  const toggleFilter = (key: 'divisions' | 'marketSegments' | 'customers' | 'projectManagers' | 'estimators', value: string) => {
    const current = state.filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilters({ [key]: next });
  };

  const toggleYear = (value: number) => {
    const current = state.filters.years;
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilters({ years: next });
  };

  const toggleGainFade = (value: 'Gain' | 'Fade') => {
    const current = state.filters.gainFade;
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilters({ gainFade: next });
  };

  const clearAll = () => {
    setFilters({ divisions: [], marketSegments: [], years: [], gainFade: [], customers: [], projectManagers: [], estimators: [] });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
      <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      <FilterDropdown
        label="Year"
        options={summary.years.map(String)}
        selected={state.filters.years.map(String)}
        onToggle={(v) => toggleYear(Number(v))}
      />

      <FilterDropdown
        label="Division"
        options={summary.divisions}
        selected={state.filters.divisions}
        onToggle={(v) => toggleFilter('divisions', v)}
      />

      <FilterDropdown
        label="Segment"
        options={summary.marketSegments}
        selected={state.filters.marketSegments}
        onToggle={(v) => toggleFilter('marketSegments', v)}
      />

      <FilterDropdown
        label="Customer"
        options={summary.customers}
        selected={state.filters.customers}
        onToggle={(v) => toggleFilter('customers', v)}
      />

      <FilterDropdown
        label="PM"
        options={summary.projectManagers}
        selected={state.filters.projectManagers}
        onToggle={(v) => toggleFilter('projectManagers', v)}
      />

      <FilterDropdown
        label="Estimator"
        options={summary.estimators}
        selected={state.filters.estimators}
        onToggle={(v) => toggleFilter('estimators', v)}
      />

      <div className="flex gap-1">
        {(['Gain', 'Fade'] as const).map((gf) => (
          <button
            key={gf}
            onClick={() => toggleGainFade(gf)}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
              state.filters.gainFade.includes(gf)
                ? gf === 'Gain' ? 'border-gain bg-gain/10 text-gain' : 'border-fade bg-fade/10 text-fade'
                : 'border-border text-muted-foreground hover:bg-accent'
            )}
          >
            {gf}
          </button>
        ))}
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
