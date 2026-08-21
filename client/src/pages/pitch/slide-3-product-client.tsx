import {
  Sparkles, Heart, PoundSterling, Gift, ShoppingBag, Shield
} from "lucide-react";

const brokerFeatures = [
  {
    icon: PoundSterling,
    title: "FCA-Compliant Wealth Introductions",
    description: "Earn referral commission from wealth planning, pensions, and estate partners — all FCA-compliant and built into the client experience, with zero extra workload for the broker.",
    color: "from-blue-50/40 to-indigo-50/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    highlight: true,
  },
  {
    icon: Heart,
    title: "Client Retention",
    description: "Keep clients engaged long after completion with rewards, remortgage reminders, and proactive financial nudges — turning one-time borrowers into repeat remortgage clients.",
    color: "from-emerald-50/40 to-green-50/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    highlight: false,
  },
];

const rewardFeatures = [
  {
    icon: Gift,
    title: "Milestone Rewards",
    desc: "Unlock rewards as clients progress through their financial journey — from completion day gifts to anniversary bonuses.",
    color: "from-violet-50/40 to-purple-50/30",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
  {
    icon: ShoppingBag,
    title: "Homeowner Discounts",
    desc: "Exclusive deals on furniture, DIY, appliances and home improvements through affiliate partners like IKEA, B&Q, and Dunelm.",
    color: "from-sky-50/40 to-blue-50/30",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-600",
  },
];

export default function Slide3ProductClient() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-5">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-700">The Product</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-slide-title">
          Built for
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> Brokers</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Brokers sit at the start of a person's financial life — a trusted advisor in one of the biggest decisions they'll ever make. Uprosper gives them the tools to stay there.
        </p>
      </div>

      <div className="w-full max-w-5xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {brokerFeatures.map((item, index) => (
            <div
              key={index}
              className={`liquid-glass p-6 relative ${item.highlight ? "ring-2 ring-blue-200/60" : ""}`}
              data-testid={`card-broker-feature-${index}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} pointer-events-none rounded-[1.25rem]`} />
              <div className="relative flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${item.iconBg} backdrop-blur-sm shrink-0`}>
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-heading font-bold text-gray-900 text-base">{item.title}</h3>
                    {item.highlight && (
                      <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/40">
                        <Shield className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />FCA
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="liquid-glass p-6 relative" data-testid="card-rewards-section">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/20 via-transparent to-orange-50/15 pointer-events-none rounded-[1.25rem]" />
          <div className="relative">
            <h3 className="text-base font-heading font-bold text-gray-900 mb-1">Client Engagement Layer</h3>
            <p className="text-sm text-muted-foreground mb-4">Rewards and perks that keep clients coming back — making the broker's retention job effortless.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewardFeatures.map((f, i) => (
                <div key={i} className="liquid-glass-sm p-5 relative" data-testid={`card-reward-${i}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} pointer-events-none rounded-xl`} />
                  <div className="relative flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${f.iconBg} shrink-0`}>
                      <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-heading font-bold text-gray-900 mb-1">{f.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
