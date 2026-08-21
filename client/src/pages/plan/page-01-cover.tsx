import { useLocation } from "wouter";
import { Briefcase } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 1;

export default function Page01Cover() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-1">
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

        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-6">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Executive Summary</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-2" data-testid="text-page-title">
              Uprosper
            </h1>
            <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 font-heading font-semibold mb-8">
              Transforming a one-time transaction into a lifelong financial relationship
            </p>
          </div>

          <div className="space-y-5 text-[15px] text-gray-700 leading-relaxed mb-8">
            <p>
              Uprosper is a homeowner financial journey platform designed to help mortgage brokers maintain lifelong relationships with their clients while unlocking new revenue streams through wealth referrals, partnerships, and financial services.
            </p>
            <p>
              Today, the relationship between mortgage brokers and homeowners typically ends after the mortgage completes. This results in lost client relationships, missed cross-selling opportunities, and significant unrealised revenue. What should be a lifelong financial relationship is reduced to a one-time transaction.
            </p>
            <p>
              Uprosper solves this by providing brokers with a digital platform that keeps them connected to their clients throughout the entire homeowner lifecycle — transforming a one-time transaction into a lifelong financial relationship.
            </p>
          </div>

          <div className="liquid-glass p-6 mb-8">
            <p className="text-sm font-semibold text-gray-900 mb-4">Through a consumer app and broker platform, Uprosper enables:</p>
            <ul className="space-y-2.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Long-term client engagement
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Wealth and investment referrals
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Financial service partnerships
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Digital rewards and incentives
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Broker-client relationship retention
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-[15px] text-gray-700 leading-relaxed">
            <p>
              Uprosper generates revenue through broker SaaS subscriptions, referral commissions from financial services, affiliate partnerships, and premium consumer subscriptions.
            </p>
            <p className="font-heading font-bold text-gray-900">
              The company is positioned to become the central platform for the homeowner financial lifecycle.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
