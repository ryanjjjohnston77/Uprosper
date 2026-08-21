import { useLocation } from "wouter";
import { Rocket, CheckCircle2, MessageSquare, Users, Code } from "lucide-react";
import PlanNav, { TOTAL_PAGES } from "./plan-nav";

const PAGE_NUM = 13;

const validationPoints = [
  { icon: Code, title: "High-Fidelity Prototype Built", desc: "A fully functional prototype of the Uprosper platform has been developed, demonstrating the client app, broker dashboard, and company dashboard. The prototype includes the Prosperity Journey, reward system, push notifications, QR onboarding, and referral tracking — giving investors and partners a tangible demonstration of the product vision." },
  { icon: MessageSquare, title: "Industry Validation", desc: "Strategic consultation with The Mortgage Shop (Dublin HQ) validated the core business model and confirmed the retention gap that Uprosper addresses. Conversations with independent brokers and small networks consistently confirm that client retention is their single biggest challenge — and that no current tool solves it." },
  { icon: Users, title: "Founding Team Credibility", desc: "Founded by Phillip Johnston, a mortgage broker with 30+ years of experience in financial services who identified the retention gap firsthand. Supported by Yasir Sheikh (CTO, platform architecture and fintech security) and Ryan Johnston (Head of Design & Dev, UX/UI specialist). The team combines deep industry knowledge with technical execution capability." },
];

const nextMilestones = [
  "Complete production infrastructure and architecture",
  "Onboard 10 pilot broker firms for beta testing",
  "Establish wealth partner contracts for referral revenue",
  "Build affiliate partnership network via AWIN",
  "Generate first live referral transaction data",
  "Validate retention metrics against industry benchmarks",
];

export default function Page13Traction() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="plan-page-13">
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
              <span className="text-sm font-semibold text-gray-700">Early Validation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Traction & Vision
            </h1>
            <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              As a pre-revenue startup, Uprosper's current traction is measured in product development progress, industry validation, and the credibility of the founding team. Here is what we've achieved and where we're heading.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {validationPoints.map((v, i) => (
              <div key={i} className="liquid-glass p-5" data-testid={`validation-${i}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/8 shrink-0">
                    <v.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-heading font-bold text-gray-900">{v.title}</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

          <div className="liquid-glass p-5 md:p-6">
            <h3 className="text-sm font-heading font-bold text-gray-900 mb-4">Next 12-Month Milestones</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
              {nextMilestones.map((m, i) => (
                <div key={i} className="flex items-start gap-2" data-testid={`milestone-next-${i}`}>
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#44ba84' }} />
                  <span className="text-sm text-gray-700">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PlanNav pageNum={PAGE_NUM} />
      </div>
    </div>
  );
}
