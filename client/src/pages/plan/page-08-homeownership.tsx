import { useLocation } from "wouter";
import { Home, Key, Wrench, RefreshCw, TrendingUp, Landmark } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 8;

const milestones = [
  { icon: Key, title: "First Home Purchase", desc: "The journey begins. The client completes their mortgage, receives their keys, and enters the Uprosper ecosystem. This is the moment of peak engagement — and where most brokers currently let go.", revenue: "Protection, home insurance referrals" },
  { icon: Wrench, title: "Home Setup & Renovation", desc: "In the first 6–12 months, homeowners spend an average of £5,000+ on furniture, appliances, and improvements. Uprosper surfaces relevant deals from affiliate partners, earning commission while helping clients save.", revenue: "Affiliate commission (AWIN, direct partnerships)" },
  { icon: RefreshCw, title: "Remortgage Window", desc: "Every 2–5 years, clients need to remortgage. Uprosper tracks fixed-rate end dates and proactively notifies both client and broker — ensuring the broker captures the remortgage instead of losing it to a comparison site.", revenue: "Remortgage commission retention" },
  { icon: TrendingUp, title: "Wealth Building", desc: "As equity grows, clients become candidates for investment advice, pension planning, and wealth management. Uprosper surfaces these opportunities and facilitates warm referrals to wealth partners.", revenue: "Wealth referral commissions (20% share)" },
  { icon: Landmark, title: "Legacy & Estate Planning", desc: "Established homeowners need wills, trusts, and estate planning. Uprosper connects them to legal and financial services through the broker — creating another revenue stream from a relationship that most brokers would have lost years ago.", revenue: "Estate planning referral fees" },
];

export default function Page08Homeownership() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-8">
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
              <Home className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">The Homeownership Journey</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              The Core Hook
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              The "Prosperity Journey" is the central feature of Uprosper. It transforms the homeownership lifecycle into a visual, interactive timeline — creating engagement opportunities and revenue moments at every stage.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {milestones.map((m, i) => (
              <div key={i} className="liquid-glass p-4" data-testid={`milestone-${i + 1}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/8 shrink-0 mt-0.5">
                    <m.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-heading font-bold text-gray-900 mb-1">{m.title}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{m.desc}</p>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)' }}>{m.revenue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-heading font-bold text-gray-900">Why this matters:</span> Each milestone represents both an engagement moment and a revenue opportunity. By structuring the homeownership journey into a visual timeline, Uprosper gives clients a reason to keep coming back — and gives brokers a natural way to stay relevant throughout the client's financial life.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
