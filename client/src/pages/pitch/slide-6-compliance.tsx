import {
  ShieldCheck, Handshake, Gift, Link2, Scale, CheckCircle2, XCircle,
} from "lucide-react";

const pillars = [
  {
    icon: Handshake,
    title: "Introducer Only",
    accent: "emerald",
    points: [
      "Introductions to authorised product providers (home/life cover, wealth advice)",
      "No arranging, no advising, no execution-only dealing",
    ],
  },
  {
    icon: Gift,
    title: "Rewards & Loyalty",
    accent: "teal",
    subtitle: "Fully decoupled from regulated products",
    points: [
      "Points earned only via non-regulated actions: engagement, profile, education, surveys, non-regulated referrals",
      "No points or rewards for clicking regulated links, applications, or purchases",
      "Redeemable only for neutral rewards — vouchers, experiences, shopping credits",
    ],
  },
  {
    icon: Link2,
    title: "Partner Links & Referrals",
    accent: "cyan",
    points: [
      "Curated value-add opportunities surfaced in a marketplace section",
      "Standard referral commissions from partners, 100% retained by Uprosper",
      "Full disclosure of commercial arrangements in T&Cs and privacy policy",
      "All communications fair, clear, and not misleading",
    ],
  },
  {
    icon: Scale,
    title: "Governance & Consumer Duty",
    accent: "blue",
    points: [
      "Delivers fair value, avoids foreseeable harm, promotes good customer outcomes",
      "Financial promotions (where applicable) approved or overseen by authorised broker partners",
      "Transparent operations with regular compliance reviews",
    ],
  },
];

const accentMap: Record<string, { bg: string; text: string; ring: string; dot: string; soft: string; from: string; to: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600", ring: "ring-emerald-500/20", dot: "bg-emerald-500", soft: "from-emerald-50/30", from: "from-emerald-50/30", to: "to-emerald-50/10" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-600", ring: "ring-teal-500/20", dot: "bg-teal-500", soft: "from-teal-50/30", from: "from-teal-50/30", to: "to-cyan-50/10" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-600", ring: "ring-cyan-500/20", dot: "bg-cyan-500", soft: "from-cyan-50/30", from: "from-cyan-50/30", to: "to-sky-50/10" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600", ring: "ring-blue-500/20", dot: "bg-blue-500", soft: "from-blue-50/30", from: "from-blue-50/30", to: "to-indigo-50/10" },
};

export default function Slide6Compliance() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-700">Compliant by Design</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900" data-testid="text-slide-title">
            Fully{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500">
              FCA Compliant
            </span>{" "}
            Operations
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            A platform engineered from day one to sit safely outside regulated activity — earning trust with brokers, partners, and the FCA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((p, i) => {
            const c = accentMap[p.accent];
            return (
              <div key={i} className="liquid-glass p-5 relative" data-testid={`card-compliance-pillar-${i}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${c.from} via-transparent ${c.to} pointer-events-none rounded-[1.25rem]`} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${c.bg}`}>
                      <p.icon className={`h-5 w-5 ${c.text}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-heading font-bold text-gray-900 leading-tight">{p.title}</h3>
                      {p.subtitle && (
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{p.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {p.points.map((pt, pi) => (
                      <li key={pi} className="flex items-start gap-2 text-xs text-gray-700 leading-snug">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5 shrink-0`} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="liquid-glass-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 leading-snug">
              <span className="font-semibold text-gray-900">We do:</span> introduce, engage, educate, and reward neutral behaviours.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 leading-snug">
              <span className="font-semibold text-gray-900">We don't:</span> advise, arrange, or reward regulated activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
