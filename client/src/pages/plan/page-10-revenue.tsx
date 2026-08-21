import { useLocation } from "wouter";
import {
  PoundSterling,
  CreditCard, Handshake, ShoppingBag,
  ArrowDown, User, Users, Building2, Globe
} from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 10;

export default function Page10Revenue() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-10">
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
              <PoundSterling className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Revenue Model</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              How We Make Money
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              Uprosper generates revenue through three complementary streams that scale together — creating a compounding income model where each new broker added to the platform multiplies revenue across all channels.
            </p>
          </div>

          <div className="space-y-5 mb-6">
            <div className="liquid-glass p-5 md:p-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-cyan-50/20 pointer-events-none rounded-[1.25rem]" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <Handshake className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-heading font-bold text-gray-900">1. Wealth Partner Referral Commission</h3>
                    <p className="text-xs text-gray-500">Primary revenue stream — highest margin, strongest growth potential</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-gray-700 leading-relaxed mb-4">
                  <p>
                    When a broker's client engages with a wealth partner (for pension advice, investment planning, protection, or estate planning), the wealth partner pays an introducer fee — typically 20–25% of their advice fee. Uprosper splits this commission 80/20 in the broker's favour, taking a 20% share as platform revenue.
                  </p>
                  <p>
                    For example: a £3,000 pension advice fee generates a ~£750 introducer commission. The broker receives £600 (80%) and Uprosper earns £150 (20%). With 500 brokers, each generating 20 referrals per year, this creates <span className="font-heading font-bold" style={{ color: '#44ba84' }}>£1.5M in annual revenue</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="liquid-glass p-5 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 via-transparent to-purple-50/20 pointer-events-none rounded-[1.25rem]" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-violet-500/10">
                      <ShoppingBag className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-bold text-gray-900">2. Affiliate Commission</h3>
                      <p className="text-[11px] text-gray-500">Homeware products via AWIN & direct</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Homeowners browse curated deals from brands like IKEA, B&Q, John Lewis, and Dunelm. Every qualifying purchase earns Uprosper a commission of £5–£15. With 50,000 clients and 50% engagement, this generates approximately <span className="font-heading font-bold" style={{ color: '#44ba84' }}>£250K/yr</span>.
                  </p>
                </div>
              </div>

              <div className="liquid-glass p-5 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-teal-50/20 pointer-events-none rounded-[1.25rem]" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-bold text-gray-900">3. SaaS Subscription</h3>
                      <p className="text-[11px] text-gray-500">£10/mo per broker seat</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Every broker pays a per-seat monthly subscription for access to the platform. At 500 brokers, this generates <span className="font-heading font-bold" style={{ color: '#44ba84' }}>£60K/yr</span>. While the smallest stream by value, SaaS provides predictable, recurring revenue that underpins the business model.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="liquid-glass-sm p-4 flex items-center justify-between border-2" style={{ borderColor: 'rgba(68,186,132,0.2)' }}>
            <span className="text-sm font-heading font-bold text-gray-900">Total Estimated Revenue (500 brokers)</span>
            <div className="text-right">
              <p className="text-2xl font-heading font-bold" style={{ color: '#44ba84' }}>£1.81M/yr</p>
              <p className="text-[11px] text-gray-500">Wealth £1.5M + Affiliate £250K + SaaS £60K</p>
            </div>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
