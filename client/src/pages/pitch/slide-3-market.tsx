import {
  Globe, TrendingUp, Users, Building2,
  PoundSterling, ArrowUpRight
} from "lucide-react";

const marketStats = [
  {
    icon: PoundSterling,
    value: "£2.4B+",
    label: "Wealth Referral Commission (TAM)",
    description: "Calculated from the £12Bn UK wealth advisor market annually*",
    color: "from-emerald-50/40 to-green-50/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    icon: Building2,
    value: "5,700+",
    label: "Brokerage Firms",
    description: "Mortgage intermediary companies and networks*",
    color: "from-blue-50/40 to-indigo-50/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  {
    icon: Users,
    value: "29,000+",
    label: "Active Brokers",
    description: "FCA-registered mortgage brokers across the UK*",
    color: "from-teal-50/40 to-cyan-50/30",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
  },
  {
    icon: TrendingUp,
    value: "87→91%",
    label: "Growing Industry",
    description: "Intermediary share rising from 87% (2024) to 91% (2026) — IMLA*",
    color: "from-violet-50/40 to-purple-50/30",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
];

const trends = [
  { label: "Avg. Industry retention*", value: "~30%", detail: "average broker client retention rate — top performers hit 93% with engagement tools (MPA Magazine, 2024)" },
  { label: "Online platform growth*", value: "10.2%", detail: "CAGR for digital broker platforms through 2030, outpacing the wider market (Mordor Intelligence)" },
];

export default function Slide3Market() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-6">
          <Globe className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-700">Market Opportunity</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4" data-testid="text-slide-title">
          A
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> Massive </span>
          Underserved Market
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The UK mortgage broker market is booming — but lacks a dedicated referral, retention and engagement platform.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mb-8">
        {marketStats.map((stat, index) => (
          <div
            key={index}
            className="liquid-glass p-5 text-center hover:scale-[1.02] transition-all duration-300"
            data-testid={`card-market-stat-${index}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} pointer-events-none rounded-[1.25rem]`} />
            <div className="relative">
              <div className={`p-2.5 rounded-xl ${stat.iconBg} backdrop-blur-sm inline-flex mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div className="text-3xl font-heading font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="liquid-glass p-6 w-full max-w-4xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-teal-50/20 pointer-events-none rounded-[1.25rem]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-heading font-bold text-gray-900">Growth Trends</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.map((trend, index) => (
              <div key={index} className="liquid-glass-sm p-4 hover:scale-[1.01] transition-all" data-testid={`card-trend-${index}`}>
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1 shrink-0">
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    <span className="text-xl font-heading font-bold text-emerald-600">{trend.value}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{trend.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{trend.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center">*Source: MPAMAG.com</p>
    </div>
  );
}
