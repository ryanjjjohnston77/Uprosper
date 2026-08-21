import { useLocation } from "wouter";
import { Target, PoundSterling, Users, TrendingUp, Smartphone, Zap } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 4;

const stats = [
  { icon: PoundSterling, label: "Outstanding Mortgage Debt", value: "£300B+", desc: "The UK mortgage market is one of the largest in Europe, with ~1.5 million new mortgages originated annually." },
  { icon: Users, label: "Broker Market Share", value: "~80%", desc: "Of UK mortgages are arranged through intermediaries, a share that has grown from 70% to over 80% in the past decade." },
  { icon: TrendingUp, label: "Industry Retention", value: "~30%", desc: "The average broker retention rate. Top performers using engagement tools achieve 93% — proving the gap is solvable." },
  { icon: Smartphone, label: "Consumer Expectation", value: "App-First", desc: "Consumers now expect digital-first financial experiences. Monzo, Starling, and Revolut have set the bar — mortgages haven't caught up." },
];

export default function Page04Opportunity() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-4">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-50/30 via-green-50/15 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-logo-home">
            <img src="/logo.png" alt="Uprosper" className="h-8 w-8" />
          </div>
          <div className="liquid-glass-sm px-4 py-1.5 rounded-full">
            <span className="text-xs font-semibold" style={{ color: '#44ba84' }}>{PAGE_NUM} / {TOTAL_PAGES}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-5">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">The Opportunity</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Market Gap
            </h1>
            <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 font-heading font-semibold">
              A £300B+ market with no purpose-built retention platform
            </p>
          </div>

          <div className="space-y-4 text-[15px] text-gray-700 leading-relaxed mb-6">
            <p>
              The UK has over 29,000 active mortgage brokers operating within approximately 5,700 brokerage firms. Together, they originate the vast majority of UK residential mortgages. Yet not a single platform exists that is purpose-built to help these brokers retain their clients after the mortgage completes.
            </p>
            <p>
              CRM tools like Salesforce, Pipedrive, and mortgage-specific systems like Mortgage Brain manage the transaction pipeline — enquiry to completion. But none extend into the post-completion lifecycle. None offer a client-facing experience. None create a direct engagement channel between broker and homeowner beyond email and phone.
            </p>
            <p>
              This represents a significant and underserved market gap. The brokers we've spoken to consistently identify client retention as their biggest challenge — and the one area where technology has failed to help. Uprosper is built to fill exactly this gap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {stats.map((s, i) => (
              <div key={i} className="liquid-glass p-5" data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/8 shrink-0">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                    <p className="text-xl font-heading font-bold text-gray-900 mb-1">{s.value}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-heading font-bold text-gray-900">First-Mover Advantage</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              No competitor has built a client-facing loyalty platform specifically for mortgage brokers. This gives Uprosper a genuine first-mover advantage in a market that is both large and underserved. The platform that becomes the default retention tool for brokers will benefit from network effects, data compounding, and deep integration that make switching costly.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
