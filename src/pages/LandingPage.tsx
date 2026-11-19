import {
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  ArrowRight,
  LineChart,
  ListTree,
  Scale,
  Clock,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import { CsvUploader, SampleDataButton } from '@/components/upload/CsvUploader';
import { TemplateDownload } from '@/components/upload/TemplateDownload';
import { Header } from '@/components/layout/Header';
import { sampleData } from '@/lib/sampleData';
import { calculatePortfolioCostTotals, calculatePortfolioSummary, portfolioLaborSplit } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';

// Every figure on this page is computed from the sample portfolio at build time, by the same
// functions the dashboard uses. Nothing here is typed in by hand, so the page cannot quote a
// number the tool does not produce. (The page used to open with three industry statistics
// that had no source.)
const cost = calculatePortfolioCostTotals(sampleData);
const labor = portfolioLaborSplit(sampleData);
const summary = calculatePortfolioSummary(sampleData);
const overrunVsOriginal = cost.finalCost - cost.originalCost;
// Mean of the project margins, shown only to contrast it with profit over revenue.
const meanProjectMargin = sampleData.reduce((s, p) => s + p.finalGrossProfitMargin, 0) / sampleData.length;
const marginGapPoints = (meanProjectMargin - summary.portfolioMargin) * 100;
const hoursShare = labor.totalVariance !== 0 ? labor.hoursEffect / labor.totalVariance : 0;

const findings = [
  {
    icon: Scale,
    stat: `${formatCurrency(overrunVsOriginal)} or ${formatCurrency(cost.executionVariance)}`,
    headline: 'Two answers to "how far over did we run?"',
    detail: `Against the original estimate, final cost ran ${formatCurrency(overrunVsOriginal)} over. ${formatCurrency(cost.scopeChange)} of that is approved change-order cost the owner paid for. Against the revised budget, the overrun is ${formatCurrency(cost.executionVariance)} (${formatPercent(cost.executionVariancePct)}).`,
  },
  {
    icon: Clock,
    stat: formatPercent(hoursShare),
    headline: 'of the labor overrun is hours, not wage rate',
    detail: `Labor finished ${formatCurrency(labor.totalVariance)} over budget. ${formatCurrency(labor.hoursEffect)} came from hours worked beyond budget and ${formatCurrency(labor.rateEffect)} from the rate paid per hour, which are two different problems with two different owners.`,
  },
  {
    icon: Percent,
    stat: `${marginGapPoints.toFixed(1)} pts`,
    headline: 'between average project margin and margin earned',
    detail: `The mean of ${sampleData.length} project margins is ${formatPercent(meanProjectMargin)}. Total profit over total revenue is ${formatPercent(summary.portfolioMargin)}. Small jobs carry higher margins, so the simple average overstates what the company earned.`,
  },
];

const capabilities = [
  {
    icon: BarChart3,
    title: 'Portfolio summary',
    desc: 'Revenue, profit over revenue, gain rate and net gain/fade across every completed job in the file.',
  },
  {
    icon: TrendingUp,
    title: 'Gain/fade analysis',
    desc: "Each job's final profit against its original estimate, split into change-order impact and execution variance.",
  },
  {
    icon: PieChart,
    title: 'Cost category breakdown',
    desc: 'Labor, materials, equipment, subcontracts and other cost against the revised budget, with labor split into hours and rate.',
  },
  {
    icon: Target,
    title: 'Segment and customer comparison',
    desc: 'Margin, gain rate and fade drivers by market segment, division, customer, project manager and estimator.',
  },
  {
    icon: LineChart,
    title: 'Market exposure',
    desc: "How far a BLS price index moved between each job's bid month and its completion, next to what the job's materials cost did.",
  },
  {
    icon: ListTree,
    title: 'Project drill-down',
    desc: "Any job's cost table: original estimate, change orders, budget, final cost and variance by category.",
  },
];

const methodNotes = [
  'Gain/fade is final profit minus the profit in the original estimate.',
  'Cost variance is final cost minus the revised budget (original estimate plus approved change orders).',
  'Margin is total profit over total revenue, not an average of project margins.',
  'Labor variance is split into an hours effect and a rate effect, project by project.',
  "Market exposure is budgeted materials times the change in a BLS price index from the bid month to the job's average month.",
  'Index values are copied without change from data.cainmenard.com, which pulls them from BLS.',
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
              <BarChart3 className="h-3.5 w-3.5" />
              Gain/fade analysis for completed construction projects
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-5xl text-foreground">
              Which jobs faded,<br />
              <span className="text-primary">and what drove it</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base lg:text-lg text-muted-foreground leading-relaxed">
              Upload a completed-contracts export and see which jobs gained or faded against the original estimate,
              which cost category drove each one, and how much of the variance was change-order scope and how much
              was execution.
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
            Your data stays in your browser. Nothing is uploaded to any server.
          </p>
        </div>

        {/* Findings from the sample portfolio */}
        <div className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Three places a job cost report misleads
              </h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
                Figures below come from the sample portfolio: {sampleData.length} synthetic projects
                and {formatCurrency(summary.totalRevenue)} in revenue. Load it to see where each one comes from.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {findings.map((f) => (
                <div
                  key={f.headline}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-lg bg-fade/10 p-2">
                      <f.icon className="h-5 w-5 text-fade" />
                    </div>
                    <span className="text-xl font-bold text-foreground">{f.stat}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{f.headline}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What the analysis covers */}
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              What the analysis covers
            </h2>
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

        {/* How the numbers are built */}
        <div className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                How the numbers are built
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {methodNotes.map((note) => (
                <div key={note} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gain" />
                  <p className="text-sm text-foreground">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 lg:p-12 text-center">
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
              Built by Cain Menard
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
              This is a working demo. It reads one CSV of completed projects and runs in your browser.
              If a file will not load, or a number looks wrong, tell me.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://cainmenard.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 hover:shadow-lg"
              >
                cainmenard.com <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          <p>Your data stays in your browser. Nothing is uploaded to any server.</p>
          <p className="mt-1">Sample data is synthetic. Every company, project and person in it is invented.</p>
        </div>
      </main>
    </div>
  );
}
