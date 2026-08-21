import {
  Users, Shield,
  Home, Landmark, HeartHandshake, LineChart, Lock, Code, Figma, MonitorSmartphone, Paintbrush, Layers
} from "lucide-react";

export default function Slide7Team() {
  const phil = {
    name: "Phillip Johnston",
    role: "Founder & CEO",
    background: "30 years in financial services. Experienced mortgage broker with deep understanding of client retention challenges and the broker-client relationship.",
    initials: "PJ",
    avatarBg: "bg-emerald-500/10",
    avatarBorder: "border-emerald-500/20",
    avatarText: "text-emerald-600",
    cardGradient: "from-emerald-50/30 via-transparent to-teal-50/20",
    skills: [
      { label: "Mortgage Broking", icon: Home, bg: "bg-blue-50", border: "border-blue-200/60", text: "text-blue-600" },
      { label: "Financial Services", icon: Landmark, bg: "bg-blue-50", border: "border-blue-200/60", text: "text-blue-600" },
      { label: "Client Retention", icon: HeartHandshake, bg: "bg-blue-50", border: "border-blue-200/60", text: "text-blue-600" },
      { label: "Business Strategy", icon: LineChart, bg: "bg-blue-50", border: "border-blue-200/60", text: "text-blue-600" },
    ],
  };

  const yasir = {
    name: "Yasir Sheikh",
    role: "CTO",
    background: "Platform architecture, programming and security. Specialist in GDPR compliance, data governance and building secure fintech systems.",
    initials: "YS",
    avatarBg: "bg-teal-500/10",
    avatarBorder: "border-teal-500/20",
    avatarText: "text-teal-600",
    cardGradient: "from-teal-50/30 via-transparent to-cyan-50/20",
    skills: [
      { label: "Platform Eng.", icon: Code, bg: "bg-emerald-50", border: "border-emerald-200/60", text: "text-emerald-600" },
      { label: "GDPR & Security", icon: Lock, bg: "bg-emerald-50", border: "border-emerald-200/60", text: "text-emerald-600" },
      { label: "Governance", icon: Shield, bg: "bg-emerald-50", border: "border-emerald-200/60", text: "text-emerald-600" },
    ],
  };

  const ryan = {
    name: "Ryan Johnston",
    role: "Head of Design & Development",
    background: "UX/UI designer and frontend software developer. Combines digital design expertise with hands-on development to build engaging user experiences.",
    initials: "RJ",
    avatarBg: "bg-violet-500/10",
    avatarBorder: "border-violet-500/20",
    avatarText: "text-violet-600",
    cardGradient: "from-violet-50/30 via-transparent to-purple-50/20",
    skills: [
      { label: "UX/UI Design", icon: Figma, bg: "bg-violet-50", border: "border-violet-200/60", text: "text-violet-600" },
      { label: "Frontend Dev", icon: Code, bg: "bg-violet-50", border: "border-violet-200/60", text: "text-violet-600" },
      { label: "Digital Design", icon: Paintbrush, bg: "bg-violet-50", border: "border-violet-200/60", text: "text-violet-600" },
    ],
  };

  const renderCard = (member: typeof phil, idx: number, fullWidth = false) => (
    <div className={`liquid-glass p-5 relative ${fullWidth ? "" : ""}`} data-testid={`card-team-member-${idx}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${member.cardGradient} pointer-events-none rounded-[1.25rem]`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className={`h-12 w-12 rounded-2xl ${member.avatarBg} border ${member.avatarBorder} backdrop-blur-sm flex items-center justify-center shrink-0`}>
            <span className={`text-base font-heading font-bold ${member.avatarText}`}>{member.initials}</span>
          </div>
          <div>
            <h3 className="text-sm font-heading font-bold text-gray-900">{member.name}</h3>
            <p className="text-xs text-primary font-semibold">{member.role}</p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{member.background}</p>
        <div className="flex flex-wrap gap-2">
          {member.skills.map((s, i) => (
            <div key={i} className={`${s.bg} ${s.border} border rounded-xl px-3 py-1.5 flex items-center gap-2 backdrop-blur-sm`}>
              <s.icon className={`h-3.5 w-3.5 ${s.text}`} strokeWidth={2} />
              <span className={`text-[11px] font-semibold ${s.text}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full">
            <Users className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-700">The Team</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900" data-testid="text-slide-title">
            Built by Brokers,
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> for Brokers</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            A lean founding team combining 30 years of financial services expertise with full-stack product and design capability.
          </p>
        </div>

        {renderCard(phil, 0, true)}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderCard(yasir, 1)}
          {renderCard(ryan, 2)}
        </div>

        <div className="liquid-glass p-4 relative" data-testid="card-advisors">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/20 via-transparent to-orange-50/15 pointer-events-none rounded-[1.25rem]" />
          <div className="relative">
            <h3 className="text-xs font-heading font-bold text-gray-900 mb-1 flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-amber-500" />
              Industry Consultation
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-gray-900">The Mortgage Shop</span> — engaged in strategic consultation at their Dublin headquarters to evaluate Uprosper's business model and market opportunity. Their industry expertise validated the platform's value proposition and commercial viability within the UK and Irish mortgage sectors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
