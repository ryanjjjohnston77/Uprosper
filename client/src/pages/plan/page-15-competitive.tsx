import { useLocation } from "wouter";
import { Swords, X, CheckCircle2 } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 15;

const competitors = [
  {
    name: "Broker CRMs",
    examples: "Mortgage Brain, Salesforce, Pipedrive",
    strengths: "Pipeline management, compliance tracking, sourcing integration",
    gap: "No post-completion engagement. No client-facing app. No retention tools. Manages the transaction, not the relationship.",
  },
  {
    name: "Fintech Lenders",
    examples: "Habito, Trussle, Mojo",
    strengths: "Digital mortgage applications, comparison tools, consumer convenience",
    gap: "High acquisition costs. Tend to disintermediate the broker rather than support them. No ongoing client engagement after completion.",
  },
  {
    name: "Property Platforms",
    examples: "Sprive, Koodoo",
    strengths: "Overpayment tools, rate tracking, consumer-facing mortgage features",
    gap: "No broker channel. No referral revenue model. Limited to mortgage-specific features without broader financial engagement.",
  },
  {
    name: "Wealth Platforms",
    examples: "St. James's Place, Quilter",
    strengths: "Full financial planning, investment management, estate planning",
    gap: "Don't serve mortgage brokers. No integration with the mortgage lifecycle. High-touch, high-cost advisory model.",
  },
];

export default function Page15Competitive() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-15">
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
              <Swords className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Competitive Landscape</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              We Are Not a CRM
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              Uprosper occupies a unique position in the market. We are not a CRM, not a lead generator, and not a lender. We are a client loyalty platform — the only one purpose-built for mortgage brokers.
            </p>
          </div>

          <div className="space-y-4 text-[15px] text-gray-700 leading-relaxed mb-6">
            <p>
              Existing tools in the mortgage space fall into distinct categories — none of which address the post-completion retention gap that Uprosper solves. Here is how the competitive landscape breaks down and where each category falls short:
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {competitors.map((c, i) => (
              <div key={i} className="liquid-glass p-5" data-testid={`competitor-${i}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-heading font-bold text-gray-900">{c.name}</h3>
                  <span className="text-[11px] text-gray-400">{c.examples}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="h-3 w-3 text-gray-400" />
                      <p className="text-[11px] font-semibold text-gray-500">Their Strengths</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{c.strengths}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <X className="h-3 w-3 text-red-400" />
                      <p className="text-[11px] font-semibold text-red-400">The Gap</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{c.gap}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-heading font-bold text-gray-900">Uprosper's position is distinct:</span> we sit between the CRM (pre-completion) and the wealth platform (long-term), creating a new category — the broker-client loyalty platform. No existing tool combines a client-facing app, broker dashboard, wealth referral system, affiliate marketplace, and reward engine in a single product designed specifically for mortgage brokers.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
