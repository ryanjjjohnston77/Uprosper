import { useLocation } from "wouter";
import { Shield, Network, Database, Clock, Lock, Users } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 16;

const moats = [
  {
    icon: Network,
    title: "Network Effects",
    desc: "Every broker added to the platform brings 50–500 clients. More clients means better data, better offers, and more affiliate revenue — which funds better rewards. Better rewards drive higher retention, which attracts more brokers. This flywheel accelerates with scale and becomes increasingly difficult for competitors to replicate.",
  },
  {
    icon: Database,
    title: "Unique Data Asset",
    desc: "Uprosper accumulates a proprietary dataset of homeowner financial journeys — something no other platform collects. This data enables increasingly personalised engagement, better-targeted referrals, and predictive insights (e.g., identifying clients likely to remortgage or invest). Over time, this data becomes the platform's most valuable asset.",
  },
  {
    icon: Clock,
    title: "First-Mover Advantage",
    desc: "No purpose-built client loyalty platform exists for mortgage brokers. By establishing category leadership early, Uprosper can define the market standards, build deep integrations with CRMs and networks, and create switching costs before competitors emerge. Being first matters in a relationship-driven industry where trust is earned slowly.",
  },
  {
    icon: Users,
    title: "Two-Sided Market",
    desc: "Uprosper serves both brokers and their clients simultaneously. A competitor would need to build both sides — the broker management tools and the client engagement experience — and convince both parties to switch. This dual-sided relationship creates significantly higher switching costs than a single-sided SaaS product.",
  },
  {
    icon: Lock,
    title: "Integration Lock-In",
    desc: "As Uprosper integrates with broker CRMs, wealth partners, and affiliate networks, the cost of switching increases with every connection. Brokers who have onboarded hundreds of clients, built referral relationships, and configured their dashboard are unlikely to migrate to a competing platform — especially one that doesn't yet exist.",
  },
  {
    icon: Shield,
    title: "Regulatory Alignment",
    desc: "The FCA's Consumer Duty (July 2023) requires brokers to demonstrate ongoing support for their clients. Uprosper provides a documented, auditable engagement trail that helps brokers meet this obligation — making the platform not just commercially valuable but regulatory advantageous. Competitors building outside this framework face higher compliance barriers.",
  },
];

export default function Page16Moats() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-16">
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
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Defensibility</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Why We Win
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              Uprosper's competitive moats compound over time. Each broker onboarded, each client engaged, and each referral completed strengthens the platform's position — making it progressively harder for competitors to enter the market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moats.map((m, i) => (
              <div key={i} className="liquid-glass p-5" data-testid={`moat-${i}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/8 shrink-0">
                    <m.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-heading font-bold text-gray-900">{m.title}</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
