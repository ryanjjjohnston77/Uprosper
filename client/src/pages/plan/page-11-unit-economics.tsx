import { useLocation } from "wouter";
import { Calculator, TrendingUp, Users, PoundSterling } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 11;

const metrics = [
  { label: "Customer Acquisition Cost (CAC)", value: "~£150", desc: "Estimated cost to acquire one broker through direct outreach, demos, and content marketing. Significantly lower than traditional SaaS CAC due to the industry's tight-knit community and word-of-mouth dynamics." },
  { label: "Annual Revenue Per Broker", value: "£3,620", desc: "SaaS (£120/yr) + Wealth referral share (£3,000/yr) + Affiliate share (£500/yr). Driven primarily by wealth referral commissions, which scale with client engagement." },
  { label: "Lifetime Value (LTV)", value: "£18,100", desc: "Based on a 5-year average broker retention period and £3,620 annual revenue. The LTV grows as the broker's client base expands and more clients engage with referral and affiliate programmes." },
  { label: "LTV:CAC Ratio", value: "120:1", desc: "An exceptionally strong ratio driven by low acquisition costs and high per-broker revenue. Even at more conservative estimates (3-year retention, 50% lower referral income), the ratio remains above 30:1." },
];

const unitEconomics = [
  { label: "Revenue per client (Year 1)", value: "£35–£50", desc: "Initial affiliate commission + engagement rewards" },
  { label: "Revenue per client (Wealth referral)", value: "£150–£750", desc: "One-time wealth partner referral commission (Uprosper's 20% share)" },
  { label: "Revenue per client (Lifetime)", value: "£200–£1,000+", desc: "Affiliate + referral + remortgage retention over 5–10 years" },
  { label: "Cost to serve per client", value: "<£1/yr", desc: "Marginal — cloud hosting, notification delivery, minimal support" },
];

export default function Page11UnitEconomics() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-11">
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
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Unit Economics</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Per Broker / Per Client
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              Uprosper's unit economics are driven by the compounding nature of broker-client relationships. Each broker brings a portfolio of clients, and each client generates revenue across multiple channels over their homeownership lifetime.
            </p>
          </div>

          <h3 className="text-sm font-heading font-bold text-gray-900 mb-3">Per Broker Economics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {metrics.map((m, i) => (
              <div key={i} className="liquid-glass p-5" data-testid={`metric-${i}`}>
                <p className="text-xs text-gray-500 mb-0.5">{m.label}</p>
                <p className="text-2xl font-heading font-bold text-gray-900 mb-2">{m.value}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-heading font-bold text-gray-900 mb-3">Per Client Economics</h3>
          <div className="liquid-glass p-5 md:p-6 mb-6">
            <div className="space-y-4">
              {unitEconomics.map((u, i) => (
                <div key={i} className="flex items-start justify-between gap-4" data-testid={`unit-econ-${i}`}>
                  <div className="flex-1">
                    <p className="text-sm font-heading font-bold text-gray-900">{u.label}</p>
                    <p className="text-sm text-gray-600">{u.desc}</p>
                  </div>
                  <span className="text-lg font-heading font-bold shrink-0" style={{ color: '#44ba84' }}>{u.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="liquid-glass p-5">
            <h3 className="text-sm font-heading font-bold text-gray-900 mb-2">Break-Even Analysis</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              At projected costs of approximately £8,000/month in the early stages (hosting, development, and marketing), Uprosper reaches break-even at around 100 brokers — generating approximately £30K/month in combined SaaS and referral revenue. At the 500-broker target, operating margins exceed 60% as the platform's marginal cost per additional broker is near zero.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
