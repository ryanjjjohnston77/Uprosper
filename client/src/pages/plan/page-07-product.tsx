import { useLocation } from "wouter";
import { Layers, User, Briefcase, Building2 } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 7;

export default function Page07Product() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-7">
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
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">The Product</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Three Layers, One Platform
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              Uprosper serves three distinct audiences through a unified platform — each with a dedicated experience tailored to their needs and responsibilities.
            </p>
          </div>

          <div className="space-y-5 mb-6">
            <div className="liquid-glass p-5 md:p-6" data-testid="tier-client-app">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-primary/8">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900">Client App — The Prosperity Journey</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                A mobile-first experience that puts the homeowner at the centre. Clients track their financial journey through visual milestones — from first purchase through to wealth building. The app delivers smart push notifications at key moments, surfaces personalised offers and rewards, and maintains a direct line back to their broker.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {["Financial journey tracking", "Milestone rewards", "Personalised offers", "Digital wallet", "Appointment booking", "Push notifications"].map((f, i) => (
                  <div key={i} className="liquid-glass-sm px-3 py-2 text-xs text-gray-700 rounded-lg">{f}</div>
                ))}
              </div>
            </div>

            <div className="liquid-glass p-5 md:p-6" data-testid="tier-broker-dashboard">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-primary/8">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900">Broker Dashboard — Client Management Hub</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                The broker's command centre for managing their client portfolio. Track enquiries, send messages, set renewal alerts, and monitor commission earnings — all in one place. The dashboard surfaces actionable insights: which clients are approaching remortgage, who might benefit from wealth planning, and where revenue opportunities exist.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {["Client portfolio management", "Renewal alerts", "Commission tracking", "Direct messaging", "Referral tools", "Performance analytics"].map((f, i) => (
                  <div key={i} className="liquid-glass-sm px-3 py-2 text-xs text-gray-700 rounded-lg">{f}</div>
                ))}
              </div>
            </div>

            <div className="liquid-glass p-5 md:p-6" data-testid="tier-company-dashboard">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-primary/8">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900">Company Dashboard — Oversight & Revenue</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                For firm principals and network managers. A high-level view of broker performance, aggregate revenue, team management, and growth metrics. Enables firms to monitor retention across their entire brokerage and identify top-performing advisors.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {["Team management", "Aggregate performance", "Revenue tracking", "Leaderboard", "Broker communications", "Growth metrics"].map((f, i) => (
                  <div key={i} className="liquid-glass-sm px-3 py-2 text-xs text-gray-700 rounded-lg">{f}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="liquid-glass p-5">
            <h3 className="text-sm font-heading font-bold text-gray-900 mb-2">Technical Approach</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Built as a Progressive Web App (PWA) — works on any device without app store approval. FCA-compliant referral tracking, real-time push notifications via Web Push, QR code client onboarding, and integrated financial journey tracking. The platform is designed for rapid iteration and can be extended with native mobile wrappers when scale demands it.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
