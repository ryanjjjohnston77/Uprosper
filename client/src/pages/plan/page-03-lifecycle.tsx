import { useLocation } from "wouter";
import { RotateCcw, Search, FileText, CheckCircle2, HelpCircle, ArrowRight } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 3;

const stages = [
  { icon: Search, label: "Lead", desc: "Client searches for a mortgage, gets referred or finds a broker online." },
  { icon: FileText, label: "Advice", desc: "Broker provides advice, sources products, and submits applications." },
  { icon: CheckCircle2, label: "Completion", desc: "Mortgage completes. Broker earns commission. Job done." },
  { icon: HelpCircle, label: "Silence", desc: "No follow-up system. Client drifts. Broker moves to next lead.", highlight: true },
];

export default function Page03Lifecycle() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-3">
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
              <RotateCcw className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">The Broken Mortgage Lifecycle</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Where the Relationship
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400"> Breaks</span>
            </h1>
          </div>

          <div className="space-y-4 text-[15px] text-gray-700 leading-relaxed mb-6">
            <p>
              The traditional mortgage journey follows a predictable arc: a client finds a broker, receives advice, secures a mortgage, and completes. At this point, the broker earns their commission and moves on to the next lead. The client is left alone — with no structured follow-up, no ongoing guidance, and no reason to stay connected to their broker.
            </p>
            <p>
              This creates a "black hole" after completion. For the next 2–5 years (until remortgage), the broker has no systematic way to stay in touch. The client forgets who advised them, goes direct to their lender, or uses a comparison site when their deal expires. The relationship — and all its future value — is lost.
            </p>
          </div>

          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            {stages.map((s, i) => (
              <div key={i} className="flex items-center gap-3 shrink-0">
                <div className={`liquid-glass p-4 text-center min-w-[140px] ${s.highlight ? 'border-2 border-red-300/50' : ''}`} data-testid={`stage-${s.label.toLowerCase()}`}>
                  <div className={`p-2 rounded-lg mx-auto w-fit mb-2 ${s.highlight ? 'bg-red-500/10' : 'bg-primary/8'}`}>
                    <s.icon className={`h-4 w-4 ${s.highlight ? 'text-red-500' : 'text-primary'}`} />
                  </div>
                  <p className={`text-sm font-heading font-bold mb-1 ${s.highlight ? 'text-red-600' : 'text-gray-900'}`}>{s.label}</p>
                  <p className="text-[11px] text-gray-500 leading-snug">{s.desc}</p>
                </div>
                {i < stages.length - 1 && <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />}
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5 mb-5">
            <h3 className="text-sm font-heading font-bold text-gray-900 mb-3">What Happens After Completion</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-red-500 mb-1">Client Drifts</p>
                <p className="text-sm text-gray-600 leading-relaxed">Without proactive contact, clients forget their broker and turn to comparison sites or go direct when their deal expires.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-500 mb-1">Revenue Lost</p>
                <p className="text-sm text-gray-600 leading-relaxed">Every lost client represents missed remortgage income, protection renewals, and wealth referral commissions worth thousands.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-500 mb-1">No System Exists</p>
                <p className="text-sm text-gray-600 leading-relaxed">Generic CRMs track pipelines, not relationships. No tool in the market is built for post-completion client engagement.</p>
              </div>
            </div>
          </div>

          <div className="liquid-glass p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-heading font-bold text-gray-900">The scale of this problem is enormous:</span> with approximately 1.8 million remortgage events due each year in the UK, most brokers have no system to capture that business from their own past clients. Uprosper is designed to close exactly this gap — turning the post-completion silence into an ongoing, revenue-generating relationship.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
