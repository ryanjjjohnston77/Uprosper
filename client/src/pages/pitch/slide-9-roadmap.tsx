import { Map, CheckCircle, Wrench, Users, TrendingUp, Rocket } from "lucide-react";

const stages = [
  {
    label: "Today",
    subtitle: "Validated Starting Point",
    time: "Now",
    icon: CheckCircle,
    color: "emerald",
    active: true,
    tagline: "You Are Here",
    bullets: [
      "Functional MVP built and demonstrated",
      "15+ years of mortgage industry expertise validated",
      "Founding team in place with clear product vision",
      "Early conversations with broker networks underway",
    ],
  },
  {
    label: "Build",
    subtitle: "0–6 Months",
    time: "0–6 mo",
    icon: Wrench,
    color: "teal",
    active: false,
    tagline: "Live, Production-Ready Platform",
    bullets: [
      "Complete production backend and infrastructure",
      "Rewards partner integration fully operational",
      "Wealth referral partner established and contracted",
      "Pilot broker companies onboarded and configured",
    ],
  },
  {
    label: "Pilot",
    subtitle: "6–9 Months",
    time: "6–9 mo",
    icon: Users,
    color: "cyan",
    active: false,
    tagline: "First Users & Live Transactions",
    bullets: [
      "Launch with initial adviser network",
      "Validate marketplace and referral revenue model",
      "Generate first real client transactions and data",
      "Refine product based on live broker feedback",
    ],
  },
  {
    label: "Engage Seed Investors",
    subtitle: "9–11 Months",
    time: "9–11 mo",
    icon: TrendingUp,
    color: "sky",
    active: false,
    tagline: "Strong Investor Signal",
    bullets: [
      "Present validated traction metrics to investors",
      "Demonstrate proven retention and engagement rates",
      "Showcase live revenue from affiliate and SaaS channels",
      "Build strategic pipeline for next-stage growth",
    ],
  },
  {
    label: "Seed Round",
    subtitle: "11–12 Months",
    time: "11–12 mo",
    icon: Rocket,
    color: "blue",
    active: false,
    tagline: "Runway for Growth",
    bullets: [
      "Raise £250K–£500K+ to accelerate growth",
      "Expand engineering, sales, and partnerships team",
      "Scale broker acquisition across the UK market",
      "Deepen product offering with new financial verticals",
    ],
  },
];

const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600", dot: "bg-emerald-500" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-600", dot: "bg-teal-500" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-600", dot: "bg-cyan-500" },
  sky: { bg: "bg-sky-500/10", text: "text-sky-600", dot: "bg-sky-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600", dot: "bg-blue-500" },
};

export default function Slide9Roadmap() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-4">
          <Map className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-gray-700">Roadmap</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-2" data-testid="text-slide-title">
          The
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> Journey</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Our path from validated concept to scalable platform.
        </p>
      </div>

      <div className="w-full max-w-5xl relative px-4">
        <div className="absolute left-1/2 top-[10%] bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-teal-500 via-cyan-500 via-sky-500 to-blue-500 -translate-x-1/2 hidden md:block" />

        <div className="space-y-3 md:space-y-0 md:grid md:grid-rows-5 md:gap-0">
          {stages.map((stage, idx) => {
            const colors = colorMap[stage.color];
            const isLeft = idx % 2 === 0;

            return (
              <div key={idx} className="relative md:flex md:items-center" data-testid={`timeline-stage-${idx}`}>
                <div className="hidden md:block absolute left-1/2 -translate-x-1/2 z-10">
                  <div className={`w-4 h-4 rounded-full ${colors.dot} ring-4 ring-white shadow-lg`} />
                </div>

                <div className={`md:w-1/2 ${isLeft ? "md:pr-8 md:text-right" : "md:pl-8 md:ml-auto"}`}>
                  <div className={`liquid-glass p-3.5 relative ${stage.active ? "ring-2 ring-primary/30" : ""}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none rounded-[1.25rem]" />
                    <div className="relative">
                      <div className={`flex items-center gap-2 mb-1.5 ${isLeft ? "md:justify-end" : ""}`}>
                        <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                          <stage.icon className={`h-3.5 w-3.5 ${colors.text}`} />
                        </div>
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{stage.subtitle}</span>
                        </div>
                        {stage.active && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <h3 className={`text-sm font-heading font-bold text-gray-900 mb-1 ${isLeft ? "md:text-right" : ""}`}>{stage.label}</h3>
                      <ul className={`space-y-0.5 mb-1.5 ${isLeft ? "md:text-right" : ""}`}>
                        {stage.bullets.map((b, bi) => (
                          <li key={bi} className={`text-xs text-gray-600 flex items-start gap-1.5 ${isLeft ? "md:flex-row-reverse md:text-right" : ""}`}>
                            <span className={`inline-block w-1 h-1 rounded-full ${colors.dot} mt-1.5 shrink-0`} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <p className={`text-[10px] italic text-muted-foreground ${isLeft ? "md:text-right" : ""}`}>{stage.tagline}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="liquid-glass-sm mt-4 px-5 py-3 rounded-2xl max-w-5xl w-full flex items-center justify-center gap-2">
        <span className="text-sm text-gray-700 text-center">
          <span className="font-semibold text-gray-900">£75K unlocks market proof</span> — from MVP to live transactions and seed round within 12 months.
        </span>
      </div>
    </div>
  );
}
