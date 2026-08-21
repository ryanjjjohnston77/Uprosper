import { useLocation } from "wouter";
import { Route, UserPlus, QrCode, Bell, Gift, RefreshCw, ArrowDown } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 6;

const steps = [
  { icon: UserPlus, title: "Broker Signs Up", desc: "A broker creates their Uprosper account, sets up their profile, and connects their firm. Onboarding takes under 10 minutes with guided setup." },
  { icon: QrCode, title: "Clients Are Invited", desc: "Brokers invite existing and new clients via unique QR codes, email links, or in-person onboarding. The client signs up in seconds — no app store download required (PWA)." },
  { icon: Route, title: "Journey Begins", desc: "Each client is placed on a personalised 'Prosperity Journey' — a visual timeline that tracks their homeownership milestones, from first purchase through to wealth building." },
  { icon: Bell, title: "Smart Engagement", desc: "Push notifications and in-app nudges keep clients engaged at key moments: remortgage windows, protection reviews, anniversary milestones, and personalised offers." },
  { icon: Gift, title: "Rewards & Offers", desc: "Clients earn rewards for engagement — coffees, gift cards, homeware discounts, and milestone bonuses. These are funded through affiliate partnerships, not broker costs." },
  { icon: RefreshCw, title: "Retention Loop", desc: "When a remortgage, investment, or protection need arises, the client naturally returns to their broker through the platform — closing the retention loop." },
];

export default function Page06UserJourney() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-6">
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
              <Route className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">User Journey</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              How Uprosper Works
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              From broker sign-up to lifelong client retention — a six-step journey that creates value for both sides at every stage.
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4" data-testid={`step-${i + 1}`}>
                <div className="flex flex-col items-center shrink-0">
                  <div className="p-2.5 rounded-xl bg-primary/8">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 w-px my-1" style={{ background: 'rgba(68,186,132,0.2)' }} />
                  )}
                </div>
                <div className="liquid-glass p-4 flex-1 mb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)' }}>Step {i + 1}</span>
                    <h3 className="text-sm font-heading font-bold text-gray-900">{s.title}</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
