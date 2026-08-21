import { useLocation } from "wouter";
import { BarChart3, Globe, Users, Target } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 12;

export default function Page12MarketSize() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-12">
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
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Market Size & Potential</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Addressable Market
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="liquid-glass p-5 text-center" data-testid="tam">
              <div className="p-2 rounded-lg bg-primary/8 w-fit mx-auto mb-2">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-gray-500 mb-1">TAM — Total Addressable Market</p>
              <p className="text-3xl font-heading font-bold text-gray-900 mb-2">£2.4B+</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                The UK wealth advisory market generates £12B+ annually. Uprosper targets the introducer commission layer — approximately 20–25% of advice fees flowing through mortgage broker referral channels.
              </p>
            </div>
            <div className="liquid-glass p-5 text-center" data-testid="sam">
              <div className="p-2 rounded-lg bg-primary/8 w-fit mx-auto mb-2">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-gray-500 mb-1">SAM — Serviceable Addressable</p>
              <p className="text-3xl font-heading font-bold text-gray-900 mb-2">29,000+</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Active mortgage brokers across approximately 5,700 brokerage firms in the UK. These are the direct customers for Uprosper's SaaS platform and the gateway to their client networks.
              </p>
            </div>
            <div className="liquid-glass p-5 text-center" data-testid="som">
              <div className="p-2 rounded-lg bg-primary/8 w-fit mx-auto mb-2">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-gray-500 mb-1">SOM — Serviceable Obtainable</p>
              <p className="text-3xl font-heading font-bold text-gray-900 mb-2">500</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Initial target of 500 brokers (1.5% market penetration) within 3 years. At this scale, the platform generates an estimated £1.81M in annual revenue across all streams.
              </p>
            </div>
          </div>

          <div className="liquid-glass p-5 md:p-6 mb-6">
            <h3 className="text-sm font-heading font-bold text-gray-900 mb-3">Market Growth Drivers</h3>
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                The UK intermediary mortgage market has grown consistently over the past decade, with broker market share rising from approximately 70% to over 80%. This trend is expected to continue as regulatory complexity increases and consumers seek professional guidance. The FCA's Consumer Duty regulations (effective July 2023) further strengthen the broker's role by requiring ongoing support and communication with clients — exactly what Uprosper facilitates.
              </p>
              <p>
                Additionally, online platform growth in financial services is running at approximately 10.2% annually (Mordor Intelligence), suggesting strong tailwinds for digital solutions in the mortgage space. The combination of growing broker market share and increasing digital adoption creates a favourable environment for Uprosper's growth.
              </p>
            </div>
          </div>

          <div className="liquid-glass p-5">
            <h3 className="text-sm font-heading font-bold text-gray-900 mb-2">Growth Projections</h3>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center">
                <p className="text-xs font-semibold" style={{ color: '#44ba84' }}>Year 1</p>
                <p className="text-xl font-heading font-bold text-gray-900">50</p>
                <p className="text-xs text-gray-500">brokers</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold" style={{ color: '#44ba84' }}>Year 2</p>
                <p className="text-xl font-heading font-bold text-gray-900">200</p>
                <p className="text-xs text-gray-500">brokers</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold" style={{ color: '#44ba84' }}>Year 3</p>
                <p className="text-xl font-heading font-bold text-gray-900">500+</p>
                <p className="text-xs text-gray-500">brokers</p>
              </div>
            </div>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
