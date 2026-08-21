import {
  PoundSterling, Link2, Share2, UserPlus, Award, Lightbulb,
  Handshake, Smartphone, Users, TrendingUp, Gift, RotateCw, QrCode
} from "lucide-react";

const nodes = [
  { label: "Broker Retention", detail: "Client stays connected", Icon: Handshake, bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-600" },
  { label: "Client Engagement", detail: "Rewards, journey tracking & referral CTAs", Icon: Smartphone, bg: "bg-teal-500/10", border: "border-teal-500/25", text: "text-teal-600" },
  { label: "Referrals", detail: "Broker tracking link — auto-linked on signup", Icon: Users, bg: "bg-cyan-500/10", border: "border-cyan-500/25", text: "text-cyan-600" },
  { label: "Revenue Growth", detail: "Wealth commission + affiliate income", Icon: TrendingUp, bg: "bg-sky-500/10", border: "border-sky-500/25", text: "text-sky-600" },
  { label: "Better Rewards", detail: "Revenue funds richer rewards & features", Icon: Gift, bg: "bg-blue-500/10", border: "border-blue-500/25", text: "text-blue-600" },
];

const N = 5;
const START_ANGLE = -90;
function angleForNode(i: number) { return START_ANGLE + (i * 360) / N; }
function toRad(deg: number) { return (deg * Math.PI) / 180; }

export default function Slide6ReferralEngine() {
  const R = 100;
  const CX = 170;
  const CY = 170;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-3">
          <PoundSterling className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-700">Revenue Engine</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-2" data-testid="text-slide-title">
          Referral Engine &
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> Network Effect</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          A self-reinforcing growth flywheel where every client acquired becomes a channel for the next.
        </p>
      </div>

      <div className="w-full max-w-5xl flex flex-col gap-4">
        <div className="liquid-glass p-6 relative" data-testid="card-flywheel">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-teal-50/15 pointer-events-none rounded-[1.25rem]" />
          <div className="relative">
            <h3 className="text-lg font-heading font-bold text-gray-900 mb-2 text-center">Growth Flywheel</h3>
            <div className="relative mx-auto" style={{ width: "340px", height: "340px" }}>
              <svg viewBox="0 0 340 340" className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.35" />
                  </linearGradient>
                </defs>
                <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#ringGrad)" strokeWidth="3" strokeDasharray="8 6" />
              </svg>
              <div className="absolute flex items-center justify-center" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                <RotateCw className="h-8 w-8 text-primary/20" />
              </div>
              {nodes.map((node, i) => {
                const angle = angleForNode(i);
                const rad = toRad(angle);
                const nodeX = CX + R * Math.cos(rad);
                const nodeY = CY + R * Math.sin(rad);
                const labelDist = R + 62;
                const labelX = CX + labelDist * Math.cos(rad);
                const labelY = CY + labelDist * Math.sin(rad);
                const isLeft = Math.cos(rad) < -0.3;
                const isRight = Math.cos(rad) > 0.3;
                const nudgeX = isLeft ? -15 : isRight ? 25 : 0;
                const nudgeY = i === 0 ? 12 : 0;
                const finalLabelX = labelX + nudgeX;
                return (
                  <div key={i}>
                    <div
                      className={`absolute flex items-center justify-center rounded-full ${node.bg} border-2 ${node.border}`}
                      style={{ left: `${(nodeX / 340) * 100}%`, top: `${(nodeY / 340) * 100}%`, transform: "translate(-50%, -50%)", width: "44px", height: "44px" }}
                    >
                      <node.Icon className={`h-5 w-5 ${node.text}`} strokeWidth={2} />
                    </div>
                    <div
                      className="absolute flex flex-col items-center text-center"
                      style={{ left: `${(finalLabelX / 340) * 100}%`, top: `${((labelY + nudgeY) / 340) * 100}%`, transform: "translate(-50%, -50%)", width: "120px" }}
                      data-testid={`flywheel-node-${i}`}
                    >
                      <span className="text-xs font-bold text-gray-900 leading-tight">{node.label}</span>
                      <span className="text-[9px] text-muted-foreground leading-snug mt-0.5">{node.detail}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="liquid-glass p-5 relative" data-testid="card-how-it-works">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 via-transparent to-cyan-50/15 pointer-events-none rounded-[1.25rem]" />
          <div className="relative">
            <h3 className="text-base font-heading font-bold text-gray-900 mb-3">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="liquid-glass-sm p-3 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 shrink-0">
                  <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Referral CTAs</p>
                  <p className="text-[10px] text-muted-foreground">In-app prompts at key moments</p>
                </div>
              </div>
              <div className="liquid-glass-sm p-3 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 shrink-0">
                  <Link2 className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Tracking Link</p>
                  <p className="text-[10px] text-muted-foreground">Every signup tracked to broker</p>
                </div>
              </div>
              <div className="liquid-glass-sm p-3 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 shrink-0">
                  <UserPlus className="h-3.5 w-3.5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Auto-Linked</p>
                  <p className="text-[10px] text-muted-foreground">Client instantly connected</p>
                </div>
              </div>
              <div className="liquid-glass-sm p-3 flex items-start gap-2.5 border border-primary/20">
                <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                  <Award className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Referrer Rewarded</p>
                  <p className="text-[10px] text-muted-foreground">Incentivises further sharing</p>
                </div>
              </div>
              <div className="liquid-glass-sm p-3 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-violet-500/10 shrink-0">
                  <QrCode className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">QR Code</p>
                  <p className="text-[10px] text-muted-foreground">Share in person or online</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 rounded-2xl flex items-start gap-3 bg-amber-50/60 border border-amber-200/40" data-testid="pill-referral-stat">
          <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold text-gray-900">Digital referral programmes generate 2.3x more conversions</span> than traditional word-of-mouth — and rewards are funded by wealth referral income at zero cost to the broker.
          </p>
        </div>
      </div>
    </div>
  );
}
