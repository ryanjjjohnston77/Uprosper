import { useLocation } from "wouter";
import { Map, CheckCircle2 } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 18;

const phases = [
  {
    title: "Phase 1 — MVP Core Build",
    timeline: "Months 0–6",
    colour: "emerald",
    items: [
      "Client onboarding flow with QR code signup",
      "Broker dashboard with client portfolio management",
      "Financial journey tracking and milestone engine",
      "Reward and offer system with wallet integration",
      "Push notification infrastructure (Web Push)",
      "Authentication and role-based access (client, broker, company)",
      "Core referral tracking and commission transparency",
    ],
  },
  {
    title: "Phase 2 — Revenue & Pilot",
    timeline: "Months 6–9",
    colour: "teal",
    items: [
      "Wealth referral system with FCA-compliant tracking",
      "AWIN affiliate integration for homeware partnerships",
      "Commission tracking and broker payout reporting",
      "Company dashboard with team performance analytics",
      "Appointment booking and renewal alert automation",
      "Pilot deployment with 10 broker firms",
      "Live transaction data generation and validation",
    ],
  },
  {
    title: "Phase 3 — Scale & Optimise",
    timeline: "Months 9–12",
    colour: "blue",
    items: [
      "API integrations with mortgage CRMs and sourcing systems",
      "Advanced analytics and broker leaderboard",
      "White-label options for broker networks",
      "Performance optimisation and security hardening",
      "Onboard to 50+ brokers with dedicated customer success",
    ],
  },
  {
    title: "Phase 4 — Expansion",
    timeline: "Year 2+",
    colour: "violet",
    items: [
      "Native mobile app wrappers (iOS & Android)",
      "Open banking integration for financial insight",
      "Insurance and conveyancing referral partnerships",
      "Geographic expansion planning (Ireland, Australia)",
      "Seed round (£250K–£500K) to accelerate growth to 500+ brokers",
    ],
  },
];

export default function Page18Roadmap() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-18">
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
              <Map className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Product Roadmap</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Building the Platform
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              Uprosper's development roadmap is structured in four phases — from core MVP through to market expansion. Each phase builds on the previous, with clear milestones and revenue validation gates.
            </p>
          </div>

          <div className="space-y-4">
            {phases.map((p, i) => (
              <div key={i} className="liquid-glass p-5" data-testid={`roadmap-phase-${i}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-heading font-bold text-gray-900">{p.title}</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)' }}>{p.timeline}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  {p.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#44ba84' }} />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
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
