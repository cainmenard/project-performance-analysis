import { BarChart3, TrendingUp, PieChart, Shield } from 'lucide-react';
import { CsvUploader, SampleDataButton } from '@/components/upload/CsvUploader';
import { TemplateDownload } from '@/components/upload/TemplateDownload';
import { Header } from '@/components/layout/Header';

const features = [
  { icon: BarChart3, title: 'Portfolio Overview', desc: 'KPIs, revenue, and margin analysis across all projects' },
  { icon: TrendingUp, title: 'Gain/Fade Analysis', desc: 'Track estimating accuracy from original to final values' },
  { icon: PieChart, title: 'Cost Breakdowns', desc: 'Labor, materials, equipment, and subcontractor analysis' },
  { icon: Shield, title: 'Market Segments', desc: 'Compare performance across market segments and divisions' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 lg:py-20">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              Project Performance Analysis
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Upload your completed contracts data and instantly get interactive dashboards
              with gain/fade analysis, cost breakdowns, and market segment insights.
            </p>
          </div>

          <div className="mt-10">
            <CsvUploader />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <SampleDataButton />
            <TemplateDownload />
          </div>

          <div className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center text-xs text-muted-foreground">
            <p>Your data stays in your browser. Nothing is uploaded to any server.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
