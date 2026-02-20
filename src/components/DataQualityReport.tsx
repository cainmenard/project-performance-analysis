import { calculateDataQuality } from '@/lib/calculations';
import { formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { ProjectRecord } from '@/lib/types';

export function DataQualityReport({ projects }: { projects: ProjectRecord[] }) {
  const report = calculateDataQuality(projects);
  const [expanded, setExpanded] = useState(false);

  const scoreColor = report.overallScore >= 80 ? 'text-gain' : report.overallScore >= 60 ? 'text-chart-3' : 'text-fade';
  const scoreBg = report.overallScore >= 80 ? 'bg-gain/10' : report.overallScore >= 60 ? 'bg-chart-3/10' : 'bg-fade/10';

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Summary Bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn('rounded-lg p-2', scoreBg)}>
            <Shield className={cn('h-4 w-4', scoreColor)} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">Data Quality Report</h3>
            <p className="text-xs text-muted-foreground">
              {report.totalRows} projects loaded — {report.warnings.length === 0 ? 'No issues detected' : `${report.warnings.length} item${report.warnings.length > 1 ? 's' : ''} to review`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={cn('text-lg font-bold', scoreColor)}>{report.overallScore}</p>
            <p className="text-[10px] text-muted-foreground">Quality Score</p>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-5">
          {/* Warnings */}
          {report.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issues</h4>
              {report.warnings.map((w, i) => (
                <div key={i} className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm', {
                  'bg-destructive/10 text-destructive': w.severity === 'error',
                  'bg-chart-3/10 text-chart-3': w.severity === 'warning',
                  'bg-primary/10 text-primary': w.severity === 'info',
                })}>
                  {w.severity === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> :
                   w.severity === 'warning' ? <AlertTriangle className="h-4 w-4 shrink-0" /> :
                   <Info className="h-4 w-4 shrink-0" />}
                  <span>{w.message}</span>
                  <span className="ml-auto font-medium">{w.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Completeness Grid */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Field Completeness</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {report.completeness.map((c) => (
                <div key={c.field} className="rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground truncate">{c.field}</span>
                    {c.pct >= 1 ? (
                      <CheckCircle2 className="h-3 w-3 text-gain shrink-0" />
                    ) : c.pct >= 0.8 ? (
                      <AlertTriangle className="h-3 w-3 text-chart-3 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-fade shrink-0" />
                    )}
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={cn('h-1.5 rounded-full transition-all', c.pct >= 1 ? 'bg-gain' : c.pct >= 0.8 ? 'bg-chart-3' : 'bg-fade')}
                      style={{ width: `${c.pct * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{c.filledCount}/{c.totalCount} ({formatPercent(c.pct)})</p>
                </div>
              ))}
            </div>
          </div>

          {/* Outliers */}
          {report.outliers.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Outliers Detected</h4>
              <div className="space-y-1">
                {report.outliers.slice(0, 10).map((o, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                    <span className="text-foreground font-medium truncate max-w-[200px]">{o.projectName}</span>
                    <span className="text-muted-foreground">{o.reason}</span>
                  </div>
                ))}
                {report.outliers.length > 10 && (
                  <p className="text-xs text-muted-foreground px-3">...and {report.outliers.length - 10} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
