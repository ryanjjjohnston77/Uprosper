import {
  Sparkles, Smartphone, Heart,
  PoundSterling, Rocket
} from "lucide-react";

const benefits = [
  {
    icon: Heart,
    title: "Client Retention",
    description: "Keep clients engaged long after completion with rewards, remortgage reminders, and proactive financial nudges — turning one-time borrowers into repeat remortgage clients.",
    color: "from-emerald-50/40 to-green-50/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    icon: PoundSterling,
    title: "FCA-Compliant Introductions",
    description: "Earn referral commission from wealth planning, pensions, and estate partners — all FCA-compliant and built into the client experience, with zero extra workload.",
    color: "from-blue-50/40 to-indigo-50/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  {
    icon: Rocket,
    title: "Digital Referral Engine",
    description: "Every happy client becomes a referral source. Digital referrals spread faster, reach further, and never stop working — creating compounding, skyrocketing growth for the broker's book.",
    color: "from-violet-50/40 to-purple-50/30",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
  {
    icon: Smartphone,
    title: "Modern Client Experience",
    description: "Clients expect app-first, reward-driven experiences. Uprosper delivers loyalty perks, smart notifications, and a personalised financial journey that matches modern consumer expectations.",
    color: "from-teal-50/40 to-cyan-50/30",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
  },
];

export default function Slide4TargetMarket() {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-5xl">
        {benefits.map((item, index) => (
          <div
            key={index}
            className="liquid-glass p-6 hover:scale-[1.01] transition-all duration-300 relative"
            data-testid={`card-benefit-${index}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} pointer-events-none rounded-[1.25rem]`} />
            <div className="relative flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${item.iconBg} backdrop-blur-sm shrink-0`}>
                <item.icon className={`h-6 w-6 ${item.iconColor}`} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-gray-900 text-base mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
