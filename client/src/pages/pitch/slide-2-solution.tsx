import {
  Sparkles, Heart, MessageCircle,
  Layers, TrendingUp, UserPlus, LayoutDashboard,
  Handshake, Gift, Users, ChevronRight
} from "lucide-react";

const solutions = [
  {
    icon: Heart,
    title: "Lifelong Client Loyalty",
    description: "A loyalty platform that turns brokers from one-time advisors into lifelong financial partners.",
    color: "from-emerald-50/40 to-green-50/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    icon: TrendingUp,
    title: "Meaningful Engagement",
    description: "Milestones, rewards, and personalised nudges that keep clients engaged between mortgage events.",
    color: "from-blue-50/40 to-indigo-50/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  {
    icon: MessageCircle,
    title: "Unlocked Referral Revenue",
    description: "Built-in referral pathways into wealth planning, investments, and wills — so brokers never miss an opportunity.",
    color: "from-teal-50/40 to-cyan-50/30",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
  },
  {
    icon: Layers,
    title: "Improved Client Relationship",
    description: "One platform to replace scattered WhatsApp, email, and CRMs with personalised, human communication.",
    color: "from-violet-50/40 to-purple-50/30",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
];

export default function Slide2Solution() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-6">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-700">The Solution</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4" data-testid="text-slide-title">
          Introducing
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> Uprosper</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A client engagement platform that keeps brokers connected — and earning — long after completion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl">
        {solutions.map((item, index) => (
          <div
            key={index}
            className="liquid-glass p-6 hover:scale-[1.02] transition-all duration-300"
            data-testid={`card-solution-${index}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} pointer-events-none rounded-[1.25rem]`} />
            <div className="relative">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${item.iconBg} backdrop-blur-sm shrink-0`}>
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-gray-900 text-lg">{item.title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="liquid-glass-sm mt-6 px-6 py-5 rounded-2xl max-w-5xl w-full" data-testid="card-user-journey">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-4">Client Journey</p>
        <div className="flex items-center justify-between gap-1">
          {[
            { icon: UserPlus, label: "Sign Up", desc: "Broker invites client", color: "bg-emerald-500/10", iconColor: "text-emerald-600" },
            { icon: LayoutDashboard, label: "Explore", desc: "Dashboard & offers", color: "bg-blue-500/10", iconColor: "text-blue-600" },
            { icon: Handshake, label: "Engage", desc: "Wealth partner intro", color: "bg-teal-500/10", iconColor: "text-teal-600" },
            { icon: Gift, label: "Receive", desc: "Unlock rewards", color: "bg-amber-500/10", iconColor: "text-amber-600" },
            { icon: Users, label: "Refer", desc: "Refer & earn more", color: "bg-violet-500/10", iconColor: "text-violet-600" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex flex-col items-center text-center flex-1 min-w-0">
                <div className={`p-2.5 rounded-xl ${step.color} mb-2`}>
                  <step.icon className={`h-5 w-5 ${step.iconColor}`} />
                </div>
                <p className="text-xs font-heading font-bold text-gray-900">{step.label}</p>
                <p className="text-[10px] text-muted-foreground">{step.desc}</p>
              </div>
              {i < 4 && (
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 -mt-3" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
