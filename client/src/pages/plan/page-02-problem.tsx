import { useLocation } from "wouter";
import { AlertTriangle } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 2;

export default function Page02Problem() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-2">
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
              <AlertTriangle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">The Problem</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              The Forgotten Broker
            </h1>
            <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 font-heading font-semibold">
              A mortgage is a 25-year relationship — yet most brokers lose contact within months of completion.
            </p>
          </div>

          <div className="space-y-5 text-[15px] text-gray-700 leading-relaxed mb-6">
            <p>
              The UK mortgage market processes over 1.5 million new mortgages each year, the vast majority arranged through brokers. Yet once the mortgage completes, the relationship between broker and client effectively ends. There is no systematic way for brokers to stay connected with their clients — and no incentive structure that encourages ongoing engagement.
            </p>
            <p>
              The result is a staggering loss of lifetime value. The average UK broker retains just 30% of their client base. The remaining 70% drift away, going direct to lenders, using comparison sites, or simply forgetting who arranged their mortgage in the first place. For brokers, this means missing remortgage opportunities, cross-selling income, and wealth planning referrals worth thousands of pounds per client.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="liquid-glass p-5">
              <h3 className="text-sm font-heading font-bold text-gray-900 mb-3">For Clients</h3>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  Left without guidance after completion — no one proactively helps them plan ahead
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  No visibility on when to remortgage, review protection, or consider investments
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  Miss out on savings, rewards, and personalised financial planning
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  Expected app-first financial experience (set by Monzo, Starling) is absent
                </li>
              </ul>
            </div>

            <div className="liquid-glass p-5">
              <h3 className="text-sm font-heading font-bold text-gray-900 mb-3">For Brokers</h3>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  Lose touch with clients within months — no retention infrastructure
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  Miss repeat business: remortgages, additional purchases, product transfers
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  Fail to capture wealth planning and referral revenue worth £1,000+ per client
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  Rely on fragmented tools — WhatsApp, email, outdated CRMs — that manage transactions, not relationships
                </li>
              </ul>
            </div>
          </div>

          <div className="liquid-glass p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-heading font-bold text-gray-900">The core issue:</span> retaining a client costs 5x less than acquiring a new one, but current mortgage industry tools only manage the transaction — not the relationship. What should be a lifelong financial partnership is reduced to a one-time event. This is the gap Uprosper was built to close.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
