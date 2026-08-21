import { useLocation } from "wouter";
import { Scale, Shield, FileCheck, Lock, Eye, CheckCircle2 } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 17;

const areas = [
  {
    icon: Shield,
    title: "FCA Positioning",
    desc: "Uprosper itself is not an FCA-regulated entity. As a SaaS platform, it provides technology tools to regulated mortgage brokers — it does not provide financial advice, arrange mortgages, or hold client money. This is an important distinction: Uprosper operates as a technology enabler within the regulatory framework, not as a regulated firm.",
    detail: "However, the platform is designed with FCA awareness throughout. All referral tracking, commission transparency, and client communication features are built to help brokers meet their regulatory obligations — not circumvent them."
  },
  {
    icon: FileCheck,
    title: "Consumer Duty Alignment",
    desc: "The FCA's Consumer Duty (effective July 2023) requires regulated firms to deliver good outcomes for retail customers and to act in their clients' interests throughout the customer lifecycle. This regulation directly supports Uprosper's value proposition.",
    detail: "Uprosper helps brokers demonstrate ongoing engagement, proactive communication, and client-focused service — providing an auditable trail of client interactions that supports Consumer Duty compliance. The platform turns a regulatory obligation into a commercial advantage."
  },
  {
    icon: Lock,
    title: "Data Protection (GDPR)",
    desc: "Uprosper processes personal data of both brokers and their clients, making GDPR compliance essential. The platform is designed with privacy-by-design principles: data minimisation, purpose limitation, and clear consent mechanisms throughout.",
    detail: "Client data is encrypted at rest and in transit. Brokers can only access their own clients' data. Deletion and portability requests are handled through automated workflows. A Data Protection Officer role is planned as part of the compliance budget."
  },
  {
    icon: Eye,
    title: "Referral Compliance",
    desc: "Wealth and financial product referrals are a core revenue stream. All referrals through Uprosper are tracked transparently, with clear disclosure to clients about the nature of the referral, any commission earned, and the independence of the advice they will receive.",
    detail: "The platform maintains a complete audit trail of every referral — who initiated it, when, what was referred, and the outcome. This transparency protects brokers, clients, and Uprosper itself from regulatory risk."
  },
];

export default function Page17Compliance() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-17">
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
              <Scale className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Compliance & Regulatory</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Regulatory Positioning
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              Operating within financial services requires careful regulatory positioning. Uprosper is designed to work within the existing regulatory framework — making compliance a competitive advantage rather than a barrier.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {areas.map((a, i) => (
              <div key={i} className="liquid-glass p-5" data-testid={`compliance-area-${i}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/8 shrink-0">
                    <a.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-heading font-bold text-gray-900">{a.title}</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                  <p>{a.desc}</p>
                  <p>{a.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-heading font-bold text-gray-900">Compliance as a moat:</span> By building regulatory awareness into the product from day one, Uprosper creates a trust advantage with brokers who are increasingly focused on compliance risk. Competitors entering the market later will need to retrofit compliance features — a costly and time-consuming process that Uprosper has already completed.
            </p>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
