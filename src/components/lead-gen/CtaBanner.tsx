import { ArrowRight, CheckCircle2, Phone } from 'lucide-react';

export function CtaBanner() {
  return (
    <div className="mt-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Next Step</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            This Is What Your Data Reveals. Imagine Seeing It in Real Time.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            You're looking at a static snapshot. We build live systems connected to your ERP that surface these
            insights as projects are happening — so you can intervene before margins erode, not after.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-gain" /> Live ERP integration</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-gain" /> Automated margin alerts</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-gain" /> PM scorecards</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-gain" /> Estimating feedback loops</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-gain" /> Change management support</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-2">
          <a
            href="https://cainmenard.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 hover:shadow-lg whitespace-nowrap"
          >
            Let's Talk <ArrowRight className="h-4 w-4" />
          </a>
          <span className="text-[10px] text-muted-foreground">Free portfolio assessment</span>
        </div>
      </div>
    </div>
  );
}
