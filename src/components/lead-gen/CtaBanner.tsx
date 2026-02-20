import { ArrowRight } from 'lucide-react';

export function CtaBanner() {
  return (
    <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
      <h3 className="text-lg font-semibold text-foreground">
        Want a deeper dive into your project performance?
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Our team specializes in construction financial analysis and can help you identify trends,
        improve estimating accuracy, and boost profitability.
      </p>
      <a
        href="https://automized.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90"
      >
        Learn More <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
