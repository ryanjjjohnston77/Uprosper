import { useLocation } from "wouter";
import { Gift, Coffee, CreditCard, ShoppingBag, Bell, Trophy } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 9;

const rewardTypes = [
  { icon: Coffee, title: "Engagement Rewards", desc: "Clients earn small rewards for regular platform interaction — logging in, checking their journey, responding to surveys. Think Costa coffees, Amazon vouchers, and meal deals. These are low-cost, high-impact incentives that keep clients opening the app." },
  { icon: Trophy, title: "Milestone Bonuses", desc: "Larger rewards triggered at significant homeownership milestones — 1-year anniversary, equity growth targets, remortgage completion. These create emotional connection and celebrate financial progress alongside the broker." },
  { icon: ShoppingBag, title: "Affiliate Offers", desc: "Discounted products from partner brands (IKEA, B&Q, Dunelm, Screwfix, John Lewis, Wayfair). Homeowners get genuine savings on things they need, while Uprosper earns commission on every qualifying purchase through AWIN and direct partnerships." },
  { icon: CreditCard, title: "Wallet & Cashback", desc: "A digital wallet where rewards accumulate. Clients can redeem for gift cards, donate to charity, or apply as cashback. The wallet creates a retention loop — clients check their balance, discover new offers, and stay engaged with the platform." },
];

export default function Page09Rewards() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-9">
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
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Rewards & Engagement</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              The Engagement Engine
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              Rewards are the glue that keeps clients engaged between mortgage events. Uprosper's reward system is designed to create habitual platform usage — ensuring clients stay connected to their broker even during the 2–5 year gap between mortgage events.
            </p>
          </div>

          <div className="space-y-4 text-[15px] text-gray-700 leading-relaxed mb-6">
            <p>
              The key insight is that mortgage-related interactions happen infrequently — perhaps every 2–5 years. Without a reason to stay engaged between these events, clients naturally drift. Uprosper's reward system solves this by creating regular, low-friction touchpoints that keep the platform (and the broker) top of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {rewardTypes.map((r, i) => (
              <div key={i} className="liquid-glass p-5" data-testid={`reward-type-${i}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/8 shrink-0">
                    <r.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-heading font-bold text-gray-900">{r.title}</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-heading font-bold text-gray-900">Smart Notification System</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Push notifications are sent at precisely the right moments — remortgage reminders 3–6 months before a deal expires, protection review prompts, anniversary celebrations, and new reward availability. Notifications are personalised based on the client's journey stage, engagement history, and financial profile. The goal is relevance, not spam — every notification should deliver genuine value.
            </p>
          </div>

          <div className="liquid-glass p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-heading font-bold text-gray-900">Critically, rewards are funded through affiliate partnerships — not broker costs.</span> Brokers don't pay for client rewards. Instead, the reward programme is self-sustaining through commission income from affiliate partners. This means the reward system costs the broker nothing while delivering measurable retention improvements.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
