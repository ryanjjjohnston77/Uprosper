import {
  PoundSterling,
  CreditCard, ArrowDown,
  ShoppingBag, Handshake, User, Globe,
  Smartphone, Users, TrendingUp, Gift, RotateCw, Lightbulb,
  Coffee, Ticket, ShoppingCart
} from "lucide-react";

const flywheelNodes = [
  { label: "Broker Retention", detail: "Client stays connected", Icon: Handshake, bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-600" },
  { label: "Client Engagement", detail: "Rewards, journey & referral CTAs", Icon: Smartphone, bg: "bg-teal-500/10", border: "border-teal-500/25", text: "text-teal-600" },
  { label: "Referrals", detail: "Mortgage and wealth", Icon: Users, bg: "bg-cyan-500/10", border: "border-cyan-500/25", text: "text-cyan-600" },
  { label: "Revenue Growth", detail: "Wealth + affiliate income", Icon: TrendingUp, bg: "bg-sky-500/10", border: "border-sky-500/25", text: "text-sky-600" },
  { label: "Better Rewards", detail: "Revenue funds richer rewards", Icon: Gift, bg: "bg-blue-500/10", border: "border-blue-500/25", text: "text-blue-600" },
];

const FN = 5;
const START_ANGLE = -90;
function angleForNode(i: number) { return START_ANGLE + (i * 360) / FN; }
function toRad(deg: number) { return (deg * Math.PI) / 180; }

export default function Slide5BusinessModel() {
  const R = 120;
  const CX = 200;
  const CY = 200;

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full">
            <PoundSterling className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-700">Revenue Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900" data-testid="text-slide-title">
            Income Model
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three complementary revenue streams creating a scalable income model
          </p>
        </div>

        <div className="liquid-glass p-6 relative" data-testid="card-revenue-stream-0">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-cyan-50/20 pointer-events-none rounded-[1.25rem]" />
          <div className="relative space-y-6">
            <div>
              <h3 className="text-lg font-heading font-bold text-gray-900 mb-1">Wealth Partner Referral Commission Structure <span className="text-sm font-normal text-gray-400">Primary Revenue</span></h3>
              <p className="text-sm text-muted-foreground">A mortgage broker's average wealth referral commission is ~25% of the initial advice fee (pension or investment). Uprosper splits this 80/20 in the broker's favour.</p>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                  <Handshake className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 w-px my-1" style={{ background: 'rgba(68,186,132,0.2)' }} />
                <ArrowDown className="h-4 w-4 shrink-0" style={{ color: '#44ba84' }} />
                <div className="flex-1 w-px my-1" style={{ background: 'rgba(68,186,132,0.2)' }} />
                <div className="p-2.5 rounded-xl bg-teal-500/10">
                  <PoundSterling className="h-5 w-5 text-teal-600" />
                </div>
                <div className="flex-1 w-px my-1" style={{ background: 'rgba(68,186,132,0.2)' }} />
                <ArrowDown className="h-4 w-4 shrink-0" style={{ color: '#44ba84' }} />
                <div className="flex-1 w-px my-1" style={{ background: 'rgba(68,186,132,0.2)' }} />
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 w-px my-1" style={{ background: 'rgba(68,186,132,0.2)' }} />
                <ArrowDown className="h-4 w-4 shrink-0" style={{ color: '#44ba84' }} />
                <div className="flex-1 w-px my-1" style={{ background: 'rgba(68,186,132,0.2)' }} />
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                  <Globe className="h-5 w-5 text-emerald-600" />
                </div>
              </div>

              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div className="liquid-glass-sm p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Client Engages with Wealth Partner</p>
                  <p className="text-xs text-muted-foreground">E.g. £3,000 pension advice fee → ~25% referral commission = <span className="font-bold" style={{ color: '#44ba84' }}>£750</span></p>
                </div>

                <div className="liquid-glass-sm p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Wealth Partner Pays Commission</p>
                  <p className="text-xs text-muted-foreground mb-2">£750 referral commission split 80/20 in the broker's favour</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Broker: £600 (80%)</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Uprosper: £150 (20%)</span>
                  </div>
                </div>

                <div className="liquid-glass-sm p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Annual Earnings per Broker</p>
                  <p className="text-xs text-muted-foreground">100 clients/yr × 20% engage = 20 referrals × £750 commission each</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Broker: 20 × £600 = £12,000/yr</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Uprosper: 20 × £150 = £3,000/yr</span>
                  </div>
                </div>

                <div className="liquid-glass-sm p-4 border-2" style={{ borderColor: 'rgba(68,186,132,0.2)' }}>
                  <p className="text-sm font-semibold text-gray-900 mb-2">500 Brokers on Uprosper <span className="text-xs font-normal text-muted-foreground">(1.5% broker penetration)</span></p>
                  <p className="text-xs text-muted-foreground">500 brokers × 100 clients/yr × 20% engagement × <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">£150 (Uprosper commission)</span> =</p>
                  <p className="text-2xl font-heading font-bold text-emerald-600 mt-1">£1.5M ARR <span className="text-sm font-normal text-muted-foreground">(Annual Recurring Revenue)</span></p>
                  <p className="text-[11px] text-gray-400 mt-2 italic">Based on industry cross-sell benchmarks of 15–30% for trusted advisor referrals</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">10% = £750K</span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">20% = £1.5M</span>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">30% = £2.25M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 relative" data-testid="card-supplementary-revenue">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-transparent to-slate-50/20 pointer-events-none rounded-[1.25rem]" />
          <div className="relative space-y-5">
            <h3 className="text-lg font-heading font-bold text-gray-900">Supplementary Revenue</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="liquid-glass-sm p-5 border-2 border-violet-300/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/10">
                    <ShoppingBag className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-bold text-gray-900">Affiliate Commission</h4>
                    <p className="text-xs text-muted-foreground">Homeware products via partners like AWIN</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">50,000 clients × 50% engage × £10 avg commission =</p>
                <p className="text-xl font-heading font-bold" style={{ color: '#44ba84' }}>£250K/yr</p>
              </div>

              <div className="liquid-glass-sm p-5 border-2 border-emerald-300/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-bold text-gray-900">SaaS Subscription</h4>
                    <p className="text-xs text-muted-foreground">£10/mo per seat (per broker)</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">500 brokers × £10/mo × 12 months =</p>
                <p className="text-xl font-heading font-bold" style={{ color: '#44ba84' }}>£60K/yr</p>
              </div>
            </div>
          </div>
        </div>

        <div className="liquid-glass-sm p-4 flex items-center justify-between border-2" style={{ borderColor: 'rgba(68,186,132,0.2)' }}>
          <span className="text-sm font-heading font-bold text-gray-900">Total Estimated Revenue</span>
          <div className="text-right">
            <p className="text-2xl font-heading font-bold" style={{ color: '#44ba84' }}>£1.81M/yr</p>
            <p className="text-[11px] text-muted-foreground">Wealth £1.5M + Affiliate £250K + SaaS £60K</p>
          </div>
        </div>

        <div className="liquid-glass relative" style={{ padding: "20px" }} data-testid="card-flywheel">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-teal-50/15 pointer-events-none rounded-[1.25rem]" />
          <div className="relative flex flex-col md:flex-row items-start" style={{ gap: "50px" }}>
            <div className="flex-1 min-w-0 pt-2">
              <h3 className="text-lg font-heading font-bold text-gray-900 mb-1">Growth Flywheel</h3>
              <p className="text-sm text-muted-foreground mb-4">A self-reinforcing loop where every retained client becomes a channel for the next.</p>
              <div className="liquid-glass-sm p-4" data-testid="card-reward-examples">
                <p className="text-xs font-semibold text-gray-900 mb-2">Reward Examples</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-700 bg-emerald-50 border border-emerald-200/40 px-2.5 py-1 rounded-full">
                    <Coffee className="h-3 w-3 text-emerald-600" />Coffees
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-700 bg-teal-50 border border-teal-200/40 px-2.5 py-1 rounded-full">
                    <Ticket className="h-3 w-3 text-teal-600" />Gift Cards
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-700 bg-blue-50 border border-blue-200/40 px-2.5 py-1 rounded-full">
                    <ShoppingCart className="h-3 w-3 text-blue-600" />Homeware Discounts
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-700 bg-violet-50 border border-violet-200/40 px-2.5 py-1 rounded-full">
                    <Gift className="h-3 w-3 text-violet-600" />Milestone Bonuses
                  </span>
                </div>
              </div>

              <div className="mt-3 px-4 py-3 rounded-2xl flex items-start gap-3 bg-amber-50/60 border border-amber-200/40">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">2.3× more conversions</span> than traditional word-of-mouth — rewards funded by wealth referral income at <span className="font-semibold text-gray-900">zero cost to the broker</span>.
                </p>
              </div>
            </div>

            <div className="shrink-0 relative overflow-visible" style={{ width: "420px", height: "340px" }}>
              <svg viewBox="0 0 420 340" className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.35" />
                  </linearGradient>
                </defs>
                <circle cx="210" cy="170" r="95" fill="none" stroke="url(#ringGrad)" strokeWidth="3" strokeDasharray="8 6" />
              </svg>
              <div className="absolute flex items-center justify-center" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                <RotateCw className="h-7 w-7 text-primary/20" />
              </div>
              {flywheelNodes.map((node, i) => {
                const angle = angleForNode(i);
                const rad = toRad(angle);
                const r = 95;
                const cx = 210;
                const cy = 170;
                const W = 420;
                const H = 340;
                const nodeX = cx + r * Math.cos(rad);
                const nodeY = cy + r * Math.sin(rad);
                const labelDist = r + 55;
                const labelX = cx + labelDist * Math.cos(rad);
                const labelY = cy + labelDist * Math.sin(rad);
                const isLeft = Math.cos(rad) < -0.3;
                const isRight = Math.cos(rad) > 0.3;
                const nudgeX = isLeft ? -12 : isRight ? 16 : 0;
                const nudgeY = i === 0 ? 10 : 0;
                return (
                  <div key={i}>
                    <div
                      className={`absolute flex items-center justify-center rounded-full ${node.bg} border-2 ${node.border}`}
                      style={{ left: `${(nodeX / W) * 100}%`, top: `${(nodeY / H) * 100}%`, transform: "translate(-50%, -50%)", width: "40px", height: "40px" }}
                    >
                      <node.Icon className={`h-4.5 w-4.5 ${node.text}`} strokeWidth={2} />
                    </div>
                    <div
                      className="absolute flex flex-col items-center text-center"
                      style={{ left: `${((labelX + nudgeX) / W) * 100}%`, top: `${((labelY + nudgeY) / H) * 100}%`, transform: "translate(-50%, -50%)", width: "110px" }}
                      data-testid={`flywheel-node-${i}`}
                    >
                      <span className="text-[11px] font-bold text-gray-900 leading-tight">{node.label}</span>
                      <span className="text-[9px] text-muted-foreground leading-snug mt-0.5">{node.detail}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
