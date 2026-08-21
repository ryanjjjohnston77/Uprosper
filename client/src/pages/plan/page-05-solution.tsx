import { useLocation } from "wouter";
import { Sparkles, Heart, MessageSquare, PoundSterling, Users } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 5;

const pillars = [
  { icon: Heart, title: "Lifelong Client Loyalty", desc: "Moves brokers from one-time advisors to lifelong financial partners. Clients stay connected through personalised milestones, rewards, and proactive engagement — not cold emails." },
  { icon: MessageSquare, title: "Meaningful Engagement", desc: "Smart push notifications, financial journey tracking, and personalised nudges keep clients engaged between mortgage events. Every interaction reinforces the broker-client relationship." },
  { icon: PoundSterling, title: "Unlocked Revenue", desc: "Built-in pathways for wealth planning, investment referrals, protection reviews, and affiliate partnerships. Revenue that would otherwise be lost is captured automatically through the platform." },
  { icon: Users, title: "Centralised Communications", desc: "Replaces scattered WhatsApp messages, emails, and outdated CRMs with a unified, human-centric platform that both brokers and clients actually want to use." },
];

export default function Page05Solution() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-5">
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
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">The Solution</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Uprosper
            </h1>
            <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 font-heading font-semibold">
              A client engagement platform that turns one-time mortgages into lifelong relationships
            </p>
          </div>

          <div className="space-y-4 text-[15px] text-gray-700 leading-relaxed mb-6">
            <p>
              Uprosper is a dual-sided platform — a consumer app for homeowners and a management dashboard for brokers — that keeps the broker-client relationship alive long after the mortgage completes. Instead of silence after completion, Uprosper creates an ongoing engagement channel that delivers real value to both sides.
            </p>
            <p>
              For clients, it provides a financial journey experience — tracking their homeownership milestones, surfacing relevant offers, and keeping them connected to the broker who helped them get on the ladder. For brokers, it provides a retention engine — keeping their client base warm, surfacing remortgage opportunities, and generating referral income from wealth planning and affiliate partnerships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {pillars.map((p, i) => (
              <div key={i} className="liquid-glass p-5" data-testid={`pillar-${p.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/8 shrink-0">
                    <p.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-heading font-bold text-gray-900">{p.title}</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-heading font-bold text-gray-900">The result:</span> Uprosper transforms the mortgage broker's role from a transactional advisor into a financial partner. The platform generates revenue through SaaS subscriptions, wealth referral commissions, and affiliate partnerships — while delivering measurable retention improvements for every broker who uses it.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
