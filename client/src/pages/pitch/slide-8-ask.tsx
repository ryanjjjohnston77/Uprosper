import { useLocation } from "wouter";
import {
  Rocket, Target, PoundSterling, Users,
  Code, Megaphone, Shield, Sparkles, Mail, RotateCcw
} from "lucide-react";

export default function Slide8Ask() {
  const [, setLocation] = useLocation();
  const fundAllocation = [
    { label: "Product Development", percentage: 60, amount: "£45,000", icon: Code, color: "bg-emerald-500", pastel: "from-emerald-50/40 to-green-50/30", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
    { label: "Team Expansion", percentage: 15, amount: "£11,250", icon: Users, color: "bg-teal-500", pastel: "from-teal-50/40 to-cyan-50/30", iconBg: "bg-teal-500/10", iconColor: "text-teal-600" },
    { label: "Compliance & Legal", percentage: 15, amount: "£11,250", icon: Shield, color: "bg-cyan-500", pastel: "from-sky-50/40 to-blue-50/30", iconBg: "bg-sky-500/10", iconColor: "text-sky-600" },
    { label: "Marketing", percentage: 10, amount: "£7,500", icon: Megaphone, color: "bg-blue-500", pastel: "from-violet-50/40 to-purple-50/30", iconBg: "bg-violet-500/10", iconColor: "text-violet-600" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-5">
          <Rocket className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-700">Investment Opportunity</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-slide-title">
          The
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> Ask</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Improving the mortgage and financial journey for everyone — clients, brokers, and companies alike.
        </p>
      </div>

      <div className="w-full max-w-5xl flex flex-col gap-5">
        <div className="liquid-glass p-6 relative" data-testid="card-investment-ask">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-green-50/15 to-teal-50/20 pointer-events-none rounded-[1.25rem]" />
          <div className="relative text-center space-y-3">
            <div className="liquid-glass-sm p-3 rounded-2xl w-fit mx-auto">
              <PoundSterling className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pre-Seed Round</p>
            <p className="text-5xl md:text-6xl font-heading font-bold text-gray-900">£75,000</p>
            <p className="text-sm font-semibold text-emerald-600">Retention, Referrals & Rewards</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Uprosper is not another fintech app — it's the engagement layer for financial services.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="card-use-of-funds">
          {fundAllocation.map((item, index) => (
            <div key={index} className="liquid-glass p-5 relative hover:scale-[1.01] transition-all" data-testid={`fund-allocation-${index}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${item.pastel} pointer-events-none rounded-[1.25rem]`} />
              <div className="relative flex flex-col items-center text-center gap-2">
                <div className={`p-2.5 rounded-xl ${item.iconBg} backdrop-blur-sm`}>
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-2xl font-heading font-bold text-gray-900">{item.percentage}%</p>
                <p className="text-xs font-semibold text-primary">{item.amount}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="liquid-glass p-6 relative text-center" data-testid="card-closing">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-orange-50/15 to-yellow-50/20 pointer-events-none rounded-[1.25rem]" />
          <div className="relative space-y-3">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900">
              Let's build the future of mortgage client prosperity together.
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Uprosper transforms every mortgage completion into a lifelong client relationship — creating value for brokers, companies, and homeowners alike.
            </p>
            <div className="pt-2 flex flex-col items-center gap-3">
              <a
                href="mailto:ryanjjjohnston@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl text-white px-8 py-3 font-medium transition-colors"
                style={{ background: '#44ba84' }}
                data-testid="button-get-in-touch"
              >
                <Mail className="h-4 w-4" /> Get in Touch
              </a>
              <button
                onClick={() => setLocation("/pitch/1")}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-medium transition-colors bg-white"
                style={{ border: '1.5px solid rgba(68,186,132,0.2)', color: '#44ba84' }}
                data-testid="button-restart-deck"
              >
                <RotateCcw className="h-4 w-4" /> Restart Deck
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
