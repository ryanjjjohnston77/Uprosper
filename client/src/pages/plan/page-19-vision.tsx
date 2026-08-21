import { useLocation } from "wouter";
import { Eye, Home, Shield, Zap, CreditCard, Wrench, Leaf } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 19;

const expansions = [
  { icon: Shield, title: "Insurance Integration", desc: "Home insurance, life insurance, and income protection — surfaced at the right moment in the homeowner journey and facilitated through the broker's existing network." },
  { icon: Wrench, title: "Home Maintenance", desc: "Scheduled maintenance reminders, trusted tradesperson recommendations, and home warranty products. Keeps the app useful between mortgage events." },
  { icon: Zap, title: "Energy & Utilities", desc: "Energy switching, smart home products, and home efficiency improvements. Partners with utility comparison services to generate referral income while saving homeowners money." },
  { icon: CreditCard, title: "Open Banking", desc: "Financial health scoring, spending insights, and personalised savings recommendations based on real transaction data. Creates the most personalised homeowner finance experience in the market." },
  { icon: Home, title: "Property Marketplace", desc: "When clients are ready to move, Uprosper connects them to estate agents, conveyancers, and removal services — keeping the entire property lifecycle within the platform ecosystem." },
  { icon: Leaf, title: "Green Home", desc: "EPC improvements, solar panel financing, heat pump subsidies, and green mortgage products. Aligns with government policy direction and creates new referral revenue channels." },
];

export default function Page19Vision() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-19">
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
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Long-Term Vision</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              The Super App
            </h1>
            <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 font-heading font-semibold mb-4">
              From broker retention tool to the homeowner financial platform
            </p>
          </div>

          <div className="space-y-4 text-[15px] text-gray-700 leading-relaxed mb-6">
            <p>
              Uprosper's immediate focus is solving the broker retention problem. But the long-term vision is significantly larger: to become the central financial platform for UK homeowners — a "Monzo for homeowners" that manages every aspect of the homeownership financial lifecycle.
            </p>
            <p>
              The broker relationship is the entry point. Once a homeowner is on the platform and engaged with their Prosperity Journey, Uprosper becomes the natural hub for all home-related financial decisions. Each new service integrated into the platform increases client engagement, generates additional revenue, and deepens the moat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {expansions.map((e, i) => (
              <div key={i} className="liquid-glass p-4" data-testid={`expansion-${i}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/8 shrink-0">
                    <e.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-heading font-bold text-gray-900">{e.title}</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-heading font-bold text-gray-900">The platform play:</span> Each of these verticals represents an additional revenue stream and a reason for clients to keep using the platform. The combination of broker distribution, homeowner engagement, and financial data creates a platform that becomes more valuable with every user — and increasingly difficult to replicate.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
