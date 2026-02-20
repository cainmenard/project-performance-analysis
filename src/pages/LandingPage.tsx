import {
  BarChart3,
  TrendingUp,
  PieChart,
  Shield,
  DollarSign,
  AlertTriangle,
  Target,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Zap,
} from 'lucide-react';
import { CsvUploader, SampleDataButton } from '@/components/upload/CsvUploader';
import { TemplateDownload } from '@/components/upload/TemplateDownload';
import { Header } from '@/components/layout/Header';

const painPoints = [
  {
    icon: AlertTriangle,
    stat: '67%',
    headline: 'of construction projects exceed their budget',
    detail: 'Without real-time cost visibility, margin erosion happens silently across your portfolio — you find out at close-out, not when you can still act.',
  },
  {
    icon: Clock,
    stat: '$4.7M',
    headline: 'average annual profit leakage per mid-size contractor',
    detail: 'Estimating inaccuracies, untracked change orders, and inconsistent execution compound into millions in preventable losses.',
  },
  {
    icon: Eye,
    stat: '0%',
    headline: 'visibility into which segments actually make you money',
    detail: 'Most contractors chase revenue. The profitable ones know exactly which market segments, project types, and divisions drive margin — and which destroy it.',
  },
];

const capabilities = [
  {
    icon: BarChart3,
    title: 'Portfolio Performance Intelligence',
    desc: 'See every KPI that matters — revenue, margins, gain/fade rates, and profit trends across your entire book of work.',
  },
  {
    icon: TrendingUp,
    title: 'Gain/Fade Analysis',
    desc: 'Know exactly which projects gained vs. faded from original estimate to final — and why. Identify systemic estimating patterns.',
  },
  {
    icon: PieChart,
    title: 'Cost Category Deep Dive',
    desc: 'Labor, materials, equipment, subs — see where every dollar went vs. where it was supposed to go. Spot overruns before they compound.',
  },
  {
    icon: Target,
    title: 'Market Segment Profitability',
    desc: 'Compare performance across segments and divisions. Stop guessing which work is worth pursuing — let the data decide.',
  },
];

const outcomes = [
  { icon: DollarSign, text: 'Identify 3-8% margin improvement opportunities hidden in your project data' },
  { icon: Shield, text: 'Eliminate estimating blind spots that cause projects to fade' },
  { icon: Zap, text: 'Make go/no-go decisions backed by historical segment performance' },
  { icon: TrendingUp, text: 'Build a data-driven culture that compounds profitability year over year' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl px-4 pt-12 lg:pt-20 pb-8">
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              Built for Construction Executives Who Refuse to Leave Money on the Table
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-5xl text-foreground">
              Your Projects Have a Story.<br />
              <span className="text-primary">Are You Reading It?</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base lg:text-lg text-muted-foreground leading-relaxed">
              Upload your completed contracts data and instantly see what's really happening across your portfolio —
              which projects gained, which faded, where your margins are bleeding, and exactly where to focus
              to protect and grow profitability.
            </p>
          </div>

          {/* Upload Section */}
          <div className="mt-10">
            <CsvUploader />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <SampleDataButton />
            <TemplateDownload />
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Your data stays in your browser. Nothing is uploaded to any server. Completely private.
          </p>
        </div>

        {/* Pain Points Section */}
        <div className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                The Problem Nobody Talks About at the Executive Table
              </h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
                Construction companies are running multi-million dollar portfolios with rear-view mirror visibility.
                By the time you see the numbers, the damage is done.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {painPoints.map((p) => (
                <div
                  key={p.headline}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-lg bg-fade/10 p-2">
                      <p.icon className="h-5 w-5 text-fade" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">{p.stat}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{p.headline}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              From Raw Data to Actionable Intelligence in Seconds
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
              This isn't another spreadsheet. It's the executive-level visibility you need to run your business
              with the precision your projects demand.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {capabilities.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-2.5">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outcomes / What Becomes Possible */}
        <div className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                What Becomes Possible With Real-Time Project Intelligence
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {outcomes.map((o) => (
                <div key={o.text} className="flex items-start gap-3 rounded-lg border border-gain/20 bg-gain/5 p-4">
                  <div className="shrink-0 rounded-md bg-gain/10 p-1.5">
                    <o.icon className="h-4 w-4 text-gain" />
                  </div>
                  <p className="text-sm text-foreground">{o.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 lg:p-12 text-center">
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
              This Demo is Just the Beginning
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
              What you see here is a snapshot of what's possible. The full engagement includes
              live ERP integration, real-time dashboards, automated alerts, estimating feedback loops,
              and the change management to make your team actually use it.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://automized.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 hover:shadow-lg"
              >
                Talk to Us About Your Portfolio <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gain" /> ERP Integration (Viewpoint, Sage, Procore)</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gain" /> Real-Time Dashboards</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gain" /> Change Management Support</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          <p>
            Powered by{' '}
            <a href="https://automized.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              Automized
            </a>
            {' '}— Software, Process & Change Management for Construction Intelligence
          </p>
        </div>
      </main>
    </div>
  );
}
