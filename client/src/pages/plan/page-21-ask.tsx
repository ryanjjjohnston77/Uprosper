import { useLocation } from "wouter";
import { Rocket, Code, Megaphone, Users, Shield, CheckCircle2, Mail } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 21;

const funds = [
  { icon: Code, pct: "60%", amount: "£45,000", label: "Product Development", desc: "Core platform build from prototype to production, integrations with wealth partners and affiliate networks, and launch infrastructure." },
  { icon: Users, pct: "15%", amount: "£11,250", label: "Team Expansion", desc: "Key hires for engineering and customer success. Additional development capacity to accelerate the roadmap and dedicated support for pilot broker firms." },
  { icon: Shield, pct: "15%", amount: "£11,250", label: "Compliance & Legal", desc: "FCA compliance review, legal framework establishment, data protection infrastructure, and terms of service. Critical for credibility with broker firms." },
  { icon: Megaphone, pct: "10%", amount: "£7,500", label: "Marketing & Growth", desc: "Broker acquisition campaigns, brand building, content marketing, industry event attendance, and sales materials for direct outreach." },
];

const milestones = [
  "Production-ready platform with client app, broker dashboard, and company dashboard",
  "10 broker firms onboarded and actively using the platform",
  "First wealth referral transactions generating live revenue data",
  "Affiliate partnership network established via AWIN and direct relationships",
  "FCA compliance review completed and documented",
  "Retention metrics validated against industry benchmarks",
  "Revenue model proven with real transaction data",
  "Positioned for £250K–£500K seed round at 11–12 months",
];

export default function Page21Ask() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-21">
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
              <Rocket className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">The Ask</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-2" data-testid="text-page-title">
              £75,000
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500"> Pre-Seed</span>
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              We are raising £75,000 to build Uprosper from high-fidelity prototype to market-ready product, onboard our first broker firms, and validate the revenue model with live transaction data.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {funds.map((f, i) => (
              <div key={i} className="liquid-glass p-4 text-center" data-testid={`fund-${i}`}>
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-primary/8">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-heading font-bold text-gray-900 mb-0.5">{f.pct}</p>
                <p className="text-xs font-semibold text-gray-900 mb-0.5">{f.label}</p>
                <p className="text-xs font-semibold mb-1" style={{ color: '#44ba84' }}>{f.amount}</p>
                <p className="text-[11px] text-gray-500 leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5 md:p-6 mb-6">
            <h3 className="text-sm font-heading font-bold text-gray-900 mb-4">What This Funding Achieves (18-Month Runway)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-2" data-testid={`ask-milestone-${i}`}>
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#44ba84' }} />
                  <span className="text-sm text-gray-700">{m}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="liquid-glass p-6 text-center">
            <h3 className="text-lg font-heading font-bold text-gray-900 mb-2">Let's Build the Future of Broker Retention</h3>
            <p className="text-sm text-gray-700 mb-4">
              Uprosper is positioned to become the central platform for the homeowner financial lifecycle. We're looking for investors who understand the mortgage industry's retention gap and want to help build the solution.
            </p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Mail className="h-4 w-4" style={{ color: '#44ba84' }} />
              <a href="mailto:hello@uprosper.com" className="text-sm font-heading font-semibold" style={{ color: '#44ba84' }} data-testid="link-email">hello@uprosper.com</a>
            </div>
            <p className="text-xs text-gray-400">Confidential — Uprosper Business Plan 2026</p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
