import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Smartphone, BarChart3, Building2,
  Trophy, Bell, MessageSquare, Shield, Heart, Wallet, Users,
  ClipboardList, TrendingUp, Megaphone, PoundSterling, Zap, Layers, Home
} from "lucide-react";

const TOTAL_SLIDES = 11;
const SLIDE_NUM = 6;

const tiers = [
  {
    icon: Smartphone,
    title: "Client App",
    subtitle: "Prosperity Journey",
    description: "A financial journey experience with rewards that keeps clients engaged and progressing through key milestones.",
    features: [
      { icon: Trophy, label: "Financial journey with rewards" },
      { icon: Bell, label: "Smart push notifications" },
      { icon: Heart, label: "Wealth & referral prompts" },
      { icon: MessageSquare, label: "Direct broker messaging" },
      { icon: Shield, label: "Financial milestone tracking" },
      { icon: ClipboardList, label: "Product enquiry forms" },
    ],
    color: "from-emerald-50/40 to-green-50/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    borderColor: "ring-emerald-200/50",
  },
  {
    icon: BarChart3,
    title: "Broker Dashboard",
    subtitle: "Client Management Hub",
    description: "Everything a broker needs to manage clients, track enquiries, schedule meetings, and grow revenue in one place.",
    features: [
      { icon: Users, label: "Client portfolio management" },
      { icon: ClipboardList, label: "Enquiry & meeting tracker" },
      { icon: Wallet, label: "Commission & wallet system" },
      { icon: MessageSquare, label: "Two-way client messaging" },
      { icon: Bell, label: "Smart offer & nudge sending" },
      { icon: TrendingUp, label: "Performance analytics" },
    ],
    color: "from-teal-50/40 to-cyan-50/30",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
    borderColor: "ring-teal-200/50",
  },
  {
    icon: Building2,
    title: "Company Dashboard",
    subtitle: "Oversight & Revenue",
    description: "Full visibility over broker performance, revenue splits, announcements, and company-wide metrics.",
    features: [
      { icon: BarChart3, label: "Revenue & analytics dashboard" },
      { icon: Users, label: "Broker leaderboard & management" },
      { icon: PoundSterling, label: "Commission split tracking" },
      { icon: Megaphone, label: "Company announcements" },
      { icon: MessageSquare, label: "Broker messaging system" },
      { icon: TrendingUp, label: "Growth & retention metrics" },
    ],
    color: "from-blue-50/40 to-indigo-50/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    borderColor: "ring-blue-200/50",
  },
];

export default function Slide4Product() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="pitch-slide-4">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/30 via-cyan-50/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-indigo-50/20 to-violet-50/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col min-h-screen">
        <div id="pitch-slide-content">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-logo-home">
          </div>
          <div className="flex items-center gap-2">
            <div className="liquid-glass-sm px-4 py-1.5 rounded-full">
              <span className="text-xs font-semibold text-primary">{SLIDE_NUM} / {TOTAL_SLIDES}</span>
            </div>
            <button onClick={() => setLocation("/")} className="liquid-glass-sm px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors" data-testid="button-home">
              <Home className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-6">
              <Layers className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-gray-700">Product</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4" data-testid="text-slide-title">
              Three Layers,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> One Platform</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Uprosper connects clients, brokers, and companies through a unified platform designed for engagement and growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className={`liquid-glass p-6 hover:scale-[1.02] transition-all duration-300 ring-1 ${tier.borderColor}`}
                data-testid={`card-product-tier-${index}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} pointer-events-none rounded-[1.25rem]`} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl ${tier.iconBg} backdrop-blur-sm`}>
                      <tier.icon className={`h-6 w-6 ${tier.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-gray-900 text-lg">{tier.title}</h3>
                      <p className="text-xs text-muted-foreground">{tier.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 mt-3">{tier.description}</p>
                  <div className="space-y-2.5">
                    {tier.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2.5">
                        <div className={`p-1 rounded-lg ${tier.iconBg}`}>
                          <feature.icon className={`h-3 w-3 ${tier.iconColor}`} />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{feature.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="liquid-glass-sm px-6 py-4 rounded-2xl mt-8 max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <Zap className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-medium text-gray-700">
                Live product — fully functional client app, broker dashboard, and company panel with <span className="font-bold text-emerald-600">real-time data</span>
              </p>
            </div>
          </div>
        </div>
        </div>

        <div className="flex items-center justify-between pt-8 pb-4">
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() => setLocation("/pitch/5")}
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
              <button
                key={i}
                onClick={() => setLocation(`/pitch/${i + 1}`)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i + 1 === SLIDE_NUM ? "w-8" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                style={i + 1 === SLIDE_NUM ? { background: '#44ba84' } : undefined}
                data-testid={`dot-slide-${i + 1}`}
              />
            ))}
          </div>
          <Button
            className="gap-2 rounded-xl text-white"
            style={{ background: '#44ba84' }}
            onClick={() => setLocation("/pitch/7")}
            data-testid="button-next-slide"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
