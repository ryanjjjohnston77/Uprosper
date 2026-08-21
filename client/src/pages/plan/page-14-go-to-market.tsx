import { useLocation } from "wouter";
import { Megaphone, Target, Users, Building2, Globe } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 14;

const phases = [
  {
    phase: "Phase 1 — Foundation",
    timeline: "Months 1–6",
    target: "10 brokers",
    items: [
      "Direct outreach to independent broker firms — personal demos and relationship-led sales",
      "Target firms with 5–20 brokers: large enough to generate meaningful data, small enough to onboard quickly",
      "Focus on brokers who already refer to wealth advisors — they'll see immediate value from the commission-sharing model",
      "Build case studies and testimonials from early adopters to support Phase 2 sales",
    ],
  },
  {
    phase: "Phase 2 — Growth",
    timeline: "Months 6–12",
    target: "100 brokers",
    items: [
      "Expand to small networks and multi-branch firms",
      "Launch content marketing: broker-focused blog, social media presence, and industry event attendance",
      "Introduce referral incentives for existing broker customers who bring in new firms",
      "Develop integration partnerships with mortgage CRM providers (Mortgage Brain, Smartr365)",
    ],
  },
  {
    phase: "Phase 3 — Scale",
    timeline: "Year 2+",
    target: "500+ brokers",
    items: [
      "Enterprise partnerships with national broker networks (e.g., Primis, TMA, L&G Network)",
      "White-label options for large networks who want Uprosper technology under their own brand",
      "API marketplace enabling third-party integrations and data partnerships",
      "Geographic expansion planning (Ireland, Australia — similar broker-dominated markets)",
    ],
  },
];

export default function Page14GoToMarket() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-14">
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
              <Megaphone className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Go-To-Market Strategy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              How We Get There
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              Uprosper's go-to-market strategy is built around a land-and-expand approach — starting with independent brokers who can be onboarded quickly, then expanding into networks and enterprise accounts as the platform matures.
            </p>
          </div>

          <div className="space-y-4 text-[15px] text-gray-700 leading-relaxed mb-6">
            <p>
              A critical advantage of Uprosper's model is the built-in viral loop: once a broker signs up, they onboard their own clients via QR codes. Each new broker immediately brings 50–500 clients onto the platform — driving affiliate and referral revenue from day one. This means Uprosper's client acquisition cost is effectively zero: brokers do the work for us.
            </p>
          </div>

          <div className="space-y-5 mb-6">
            {phases.map((p, i) => (
              <div key={i} className="liquid-glass p-5 md:p-6" data-testid={`phase-${i + 1}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-heading font-bold text-gray-900">{p.phase}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{p.timeline}</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)' }}>{p.target}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {p.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-heading font-bold text-gray-900">Key insight:</span> The mortgage broking industry is a relationship-driven community. Brokers talk to each other at industry events, in networks, and through professional associations. A product that demonstrably improves retention and generates referral income will spread through word of mouth — making each successful broker our most powerful sales channel.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
