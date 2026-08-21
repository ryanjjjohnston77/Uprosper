import {
  UserX, Unplug, LayoutGrid, PoundSterling,
  AlertTriangle, Home, ShieldQuestion, Clock, Frown,
  Briefcase, Lightbulb
} from "lucide-react";

const clientProblems = [
  { icon: Home, text: "Left without support or guidance once the mortgage completes" },
  { icon: ShieldQuestion, text: "No visibility on when to remortgage or review protection" },
  { icon: Clock, text: "Communication drops off — no easy way to stay connected" },
  { icon: Frown, text: "Miss out on cashback, rewards, and financial planning opportunities" },
];

const brokerProblems = [
  { icon: UserX, text: "Lose touch after completion, missing repeat business" },
  { icon: Unplug, text: "No tools to deliver ongoing value between mortgage events" },
  { icon: LayoutGrid, text: "Fragmented comms — WhatsApp, emails, and outdated CRMs" },
  { icon: PoundSterling, text: "Wealth planning and referral revenue slips away uncaptured" },
];

export default function Slide1Problem() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-5">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-semibold text-gray-700">The Problem</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-slide-title">
          The Forgotten
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500"> Broker</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          A mortgage is a 25-year relationship — yet most brokers lose contact within months of completion. Retaining a client costs 5× less than acquiring a new one.*
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-5xl">
        <div className="liquid-glass p-6 relative" data-testid="card-client-problems">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-teal-50/20 pointer-events-none rounded-[1.25rem]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-primary/10 backdrop-blur-sm">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-gray-900 text-lg">The Client</h3>
                <p className="text-xs text-muted-foreground">What homeowners experience</p>
              </div>
            </div>
            <div className="space-y-3.5">
              {clientProblems.map((p, i) => (
                <div key={i} className="flex items-start gap-3" data-testid={`client-problem-${i}`}>
                  <div className="p-1.5 rounded-lg bg-primary/8 shrink-0 mt-0.5">
                    <p.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 relative" data-testid="card-broker-problems">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-transparent to-amber-50/20 pointer-events-none rounded-[1.25rem]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-orange-500/10 backdrop-blur-sm">
                <Briefcase className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-gray-900 text-lg">The Broker</h3>
                <p className="text-xs text-muted-foreground">What mortgage brokers face</p>
              </div>
            </div>
            <div className="space-y-3.5">
              {brokerProblems.map((p, i) => (
                <div key={i} className="flex items-start gap-3" data-testid={`broker-problem-${i}`}>
                  <div className="p-1.5 rounded-lg bg-orange-500/8 shrink-0 mt-0.5">
                    <p.icon className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="liquid-glass-sm mt-5 px-5 py-3 rounded-2xl max-w-5xl w-full flex items-start gap-3" data-testid="pill-insight">
        <div className="p-1.5 rounded-lg bg-amber-500/10 shrink-0 mt-0.5">
          <Lightbulb className="h-4 w-4 text-amber-500" />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="font-semibold text-gray-900">After 15 years as a mortgage broker</span>, one thing has remained constant — brokers and clients both suffer from a broken post-completion experience.
        </p>
      </div>
    </div>
  );
}
