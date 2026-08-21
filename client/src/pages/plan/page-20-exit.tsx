import { useLocation } from "wouter";
import { DoorOpen, Building2, TrendingUp, Globe, Database } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 20;

const acquirers = [
  {
    icon: Building2,
    title: "Mortgage Networks",
    examples: "Primis, TMA, L&G Network, Openwork",
    rationale: "Large broker networks would acquire Uprosper to offer retention technology to their members as a value-add — differentiating their network from competitors and capturing referral revenue at scale.",
  },
  {
    icon: TrendingUp,
    title: "Wealth Platforms",
    examples: "St. James's Place, Quilter, Hargreaves Lansdown",
    rationale: "Wealth management firms would acquire Uprosper for its distribution channel — direct access to homeowners at the point where wealth planning becomes relevant. The referral pipeline would be worth significantly more than the platform cost.",
  },
  {
    icon: Globe,
    title: "Fintech / Banking Groups",
    examples: "Starling, Monzo, NatWest, Nationwide",
    rationale: "Banks and digital lenders would acquire Uprosper for its broker distribution network and homeowner engagement data. The platform provides a white-label retention solution that banks could offer to their intermediary partners.",
  },
  {
    icon: Database,
    title: "PropTech / InsurTech",
    examples: "Zoopla, Rightmove, Comparethemarket",
    rationale: "Property and insurance platforms would acquire Uprosper for its unique homeowner data asset and the ability to reach homeowners through trusted broker relationships — a significantly more effective channel than direct advertising.",
  },
];

export default function Page20Exit() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-20">
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
              <DoorOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Exit Opportunity</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Strategic Value
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              While Uprosper is building for long-term growth, the platform's strategic value to potential acquirers is significant. The combination of broker distribution, homeowner data, and referral infrastructure creates multiple acquisition pathways.
            </p>
          </div>

          <div className="space-y-4 text-[15px] text-gray-700 leading-relaxed mb-6">
            <p>
              UK fintech acquisitions in the property and wealth space have valued platforms at 8–15x annual revenue. Comparable exits include Habito's £35M raise (at £120M+ valuation), Mojo Mortgages' acquisition by RVU, and numerous CRM acquisitions by mortgage networks seeking technology differentiation. Uprosper's unique positioning — sitting between broker CRMs and wealth platforms — places it in a strategic sweet spot for multiple buyer categories.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {acquirers.map((a, i) => (
              <div key={i} className="liquid-glass p-5" data-testid={`acquirer-${i}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/8 shrink-0">
                    <a.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-heading font-bold text-gray-900">{a.title}</h3>
                    <p className="text-[11px] text-gray-400">{a.examples}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{a.rationale}</p>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5">
            <h3 className="text-sm font-heading font-bold text-gray-900 mb-2">Exit Timeline Considerations</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              The most likely exit window is 3–5 years post-launch, once the platform has demonstrated retention metrics, referral revenue traction, and a growing broker base. At 500+ brokers and £1.8M+ ARR, Uprosper would be positioned for either a trade sale to a strategic acquirer or a larger funding round to pursue the super-app vision independently.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
