import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, Milestone, MessageSquare, Calendar, Gift,
  ShieldCheck, Lock, Heart, Sparkles, TrendingUp,
  ChevronRight, Users, Star, Menu, X, LogIn, UserPlus, Sparkles as SparklesIcon, FileText, ShieldAlert, Briefcase, Home
} from "lucide-react";
import { useAffiliateDeals, type AffiliateDeal } from "@/lib/affiliate-deals";
import { PrivacyPolicyDialog, TermsConditionsDialog, DisclaimerDialog } from "@/components/legal-dialogs";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

function LandingPartnerCarousel() {
  const { data: deals = [] } = useAffiliateDeals();
  if (deals.length === 0) return <div className="h-32" />;
  const tripled = [...deals, ...deals, ...deals];
  return (
    <div className="flex gap-5 animate-partner-scroll" style={{ width: 'max-content' }}>
      {tripled.map((deal, i) => (
        <PartnerCard key={`${deal.id}-${i}`} deal={deal} index={i} />
      ))}
    </div>
  );
}

function PartnerCard({ deal, index }: { deal: AffiliateDeal; index: number }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="shrink-0 w-[300px] rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(68,186,132,0.15)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.6) inset',
      }}
      data-testid={`card-partner-${deal.id}`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: deal.accentBg, border: `1px solid ${deal.accentColor}20` }}
        >
          {!imgError ? (
            <img
              src={deal.logoUrl}
              alt={deal.storeName}
              className="w-9 h-9 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-2xl">{deal.logoFallback}</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{deal.storeName}</h3>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block mt-1"
            style={{ background: deal.accentBg, color: deal.accentColor }}
          >
            {deal.category}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 font-medium leading-snug">{deal.dealTitle}</p>
      <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-2">{deal.dealDescription}</p>
    </div>
  );
}

const steps = [
  {
    number: "01",
    title: "Sign Up & Connect",
    description: "Create your free account and link with your mortgage broker using their unique code.",
    icon: Users,
    gradient: "from-emerald-50/40 to-green-50/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    number: "02",
    title: "Track Your Journey",
    description: "Follow your financial milestones from mortgage completion through to wealth planning.",
    icon: Milestone,
    gradient: "from-teal-50/40 to-cyan-50/30",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
  },
  {
    number: "03",
    title: "Unlock Rewards",
    description: "Earn rewards as you progress through each milestone on your prosperity journey.",
    icon: Gift,
    gradient: "from-blue-50/40 to-indigo-50/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "Track Your Mortgage",
    description: "See exactly where you are in your mortgage journey — upcoming renewals, key dates, and what comes next.",
    gradient: "from-rose-50/30 via-transparent to-pink-50/20",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
    span: "",
  },
  {
    icon: MessageSquare,
    title: "Your Broker, One Tap Away",
    description: "Message, share documents and stay in the loop with your broker — no phone tag, no missed emails.",
    gradient: "from-teal-50/30 via-transparent to-cyan-50/20",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
    span: "",
  },
  {
    icon: TrendingUp,
    title: "Financial Milestone Tracking",
    description: "See your full financial journey laid out — from mortgage secured through insurance, wealth planning, and beyond.",
    gradient: "from-emerald-50/30 via-transparent to-green-50/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    span: "",
  },
  {
    icon: Gift,
    title: "Rewards & Achievements",
    description: "Earn rewards as you complete financial milestones. Track your progress and unlock new levels.",
    gradient: "from-violet-50/30 via-transparent to-purple-50/20",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
    span: "",
  },
  {
    icon: Star,
    title: "Homeware Discounts",
    description: "Exclusive cashback and discounts from leading household brands — perfect for making your new house your own.",
    gradient: "from-amber-50/30 via-transparent to-orange-50/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    span: "",
  },
  {
    icon: Calendar,
    title: "Appointment Booking",
    description: "Book appointments with your broker at a time that works for you, all within the app.",
    gradient: "from-cyan-50/30 via-transparent to-blue-50/20",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-600",
    span: "",
  },
];

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Regulated Brokers",
    description: "Your broker is authorised and regulated by the Financial Conduct Authority.",
  },
  {
    icon: Lock,
    title: "Your Data is Secure",
    description: "Industry-standard encryption keeps your personal and financial information safe.",
  },
  {
    icon: Heart,
    title: "Free for Clients",
    description: "Uprosper is completely free to use. No hidden fees, no subscriptions.",
  },
];

export default function LandingPage() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-green-100/30 via-emerald-50/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-r from-teal-50/20 to-cyan-50/15 rounded-full blur-3xl" />
      </div>

      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="liquid-glass-sm flex items-center justify-center h-11 w-11 rounded-full transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(68,186,132,0.3)', boxShadow: '0 0 8px rgba(68,186,132,0.08)' }}
                data-testid="button-menu-toggle"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" style={{ color: '#1a7a5c' }} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[320px] sm:w-[360px] p-0 overflow-hidden border-0 [&>button.absolute]:hidden"
            >
              <div
                className="flex flex-col h-full px-5 pt-6 pb-6 gap-4 overflow-y-auto"
                style={{ background: '#ffffff' }}
              >
                <div className="flex items-stretch gap-3">
                  <div
                    className="flex flex-1 items-stretch gap-2.5 rounded-2xl p-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(68,186,132,0.10) 0%, rgba(68,186,132,0.04) 100%)',
                      border: '1px solid rgba(68,186,132,0.18)',
                      boxShadow: '0 1px 2px rgba(68,186,132,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
                    }}
                  >
                    <Link
                      href="/"
                      onClick={() => setMenuOpen(false)}
                      aria-label="Go to homepage"
                      data-testid="link-menu-home"
                      className="flex items-center justify-center aspect-square rounded-lg bg-emerald-100 transition-colors hover:bg-emerald-200/80 shrink-0 self-stretch"
                    >
                      <Home className="h-5 w-5 text-emerald-600" />
                    </Link>
                    <div className="flex-1 min-w-0 py-1">
                      <h2 className="text-lg font-heading font-bold tracking-tight leading-tight" style={{ color: '#1a7a5c' }}>
                        Uprosper
                      </h2>
                      <p className="text-[10px] mt-1 leading-snug whitespace-nowrap" style={{ color: '#2d8b63' }}>
                        Empowering homeowners across the UK
                      </p>
                    </div>
                  </div>
                  <SheetClose asChild>
                    <button
                      type="button"
                      aria-label="Close menu"
                      data-testid="button-menu-close"
                      className="flex items-center justify-center rounded-2xl w-[58px] shrink-0 transition-colors hover:bg-emerald-50/60"
                      style={{
                        background: 'linear-gradient(135deg, rgba(68,186,132,0.08) 0%, rgba(68,186,132,0.03) 100%)',
                        border: '1px solid rgba(68,186,132,0.18)',
                        boxShadow: '0 1px 2px rgba(68,186,132,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
                      }}
                    >
                      <X className="h-5 w-5" style={{ color: '#1a7a5c' }} />
                    </button>
                  </SheetClose>
                </div>

                <div
                  className="rounded-2xl py-2"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(68,186,132,0.12)',
                    boxShadow: '0 1px 2px rgba(68,186,132,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
                  }}
                >
                  <Link href="/signup">
                    <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50/40 transition-colors text-left rounded-xl" data-testid="menu-item-signup">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-teal-100">
                        <UserPlus className="h-4 w-4 text-teal-500" />
                      </span>
                      Sign Up
                    </button>
                  </Link>
                  <Link href="/login">
                    <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50/40 transition-colors text-left rounded-xl" data-testid="menu-item-login">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100">
                        <LogIn className="h-4 w-4 text-blue-500" />
                      </span>
                      Member Portal
                    </button>
                  </Link>
                  <Link href="/investor">
                    <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50/40 transition-colors text-left rounded-xl" data-testid="menu-item-investor">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100">
                        <SparklesIcon className="h-4 w-4 text-amber-500" />
                      </span>
                      Investor Area
                    </button>
                  </Link>
                </div>

                <div
                  className="rounded-2xl py-2"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(68,186,132,0.12)',
                    boxShadow: '0 1px 2px rgba(68,186,132,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
                  }}
                >
                  <Link href="/brokers">
                    <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50/40 transition-colors text-left rounded-xl" data-testid="menu-item-broker-signup">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100">
                        <Briefcase className="h-4 w-4 text-emerald-500" />
                      </span>
                      Broker Sign Up
                    </button>
                  </Link>
                  <Link href="/login">
                    <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50/40 transition-colors text-left rounded-xl" data-testid="menu-item-broker-portal">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-100">
                        <LogIn className="h-4 w-4 text-violet-500" />
                      </span>
                      Broker Portal
                    </button>
                  </Link>
                </div>

                <div
                  className="rounded-2xl py-2"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(68,186,132,0.12)',
                    boxShadow: '0 1px 2px rgba(68,186,132,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
                  }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); setShowPrivacy(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50/40 transition-colors text-left rounded-xl"
                    data-testid="menu-item-privacy"
                  >
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-purple-100">
                      <ShieldCheck className="h-4 w-4 text-purple-500" />
                    </span>
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setShowTerms(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50/40 transition-colors text-left rounded-xl"
                    data-testid="menu-item-terms"
                  >
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-100">
                      <FileText className="h-4 w-4 text-indigo-500" />
                    </span>
                    Terms &amp; Conditions
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setShowDisclaimer(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50/40 transition-colors text-left rounded-xl"
                    data-testid="menu-item-disclaimer"
                  >
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-100">
                      <ShieldAlert className="h-4 w-4 text-rose-500" />
                    </span>
                    Disclaimer
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <button className="liquid-glass-sm px-5 py-2 rounded-full text-sm font-medium hover:bg-white/60 transition-all" style={{ color: '#1a7a5c', border: '1px solid rgba(20,184,166,0.4)', boxShadow: '0 0 8px rgba(20,184,166,0.1)' }} data-testid="link-login">
              Member Portal
            </button>
          </Link>
          <Link href="/signup">
            <button className="group liquid-glass-sm px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-300 flex items-center gap-1.5 hover:scale-105 hover:brightness-110" style={{ background: '#44ba84', border: '1px solid rgba(255,255,255,0.25)' }} data-testid="link-signup-nav">
              Sign Up <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>
      </nav>

      <div className="absolute inset-x-0 top-0 h-[600px] md:h-[700px] z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 700" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100 80 C400 20, 600 180, 900 120 S1300 40, 1540 100" stroke="rgba(20,184,166,0.035)" strokeWidth="0.8" />
          <path d="M-100 120 C300 50, 550 220, 860 160 S1250 70, 1540 140" stroke="rgba(20,184,166,0.04)" strokeWidth="0.9" />
          <path d="M-100 160 C380 80, 580 260, 880 190 S1280 100, 1540 180" stroke="rgba(20,184,166,0.05)" strokeWidth="1" />
          <path d="M-100 200 C200 100, 400 350, 720 280 S1100 150, 1540 250" stroke="rgba(20,184,166,0.08)" strokeWidth="1.5" />
          <path d="M-100 230 C260 140, 430 370, 740 300 S1130 180, 1540 280" stroke="rgba(20,184,166,0.05)" strokeWidth="1" />
          <path d="M-100 260 C250 160, 450 400, 750 330 S1150 200, 1540 310" stroke="rgba(20,184,166,0.06)" strokeWidth="1.2" />
          <path d="M-100 290 C280 190, 470 420, 760 350 S1170 220, 1540 340" stroke="rgba(20,184,166,0.04)" strokeWidth="0.9" />
          <path d="M-100 320 C300 220, 500 450, 780 380 S1200 250, 1540 370" stroke="rgba(20,184,166,0.05)" strokeWidth="1" />
          <path d="M-100 355 C240 280, 510 470, 790 400 S1140 310, 1540 405" stroke="rgba(20,184,166,0.06)" strokeWidth="1.1" />
          <path d="M-100 400 C180 320, 520 500, 800 420 S1120 340, 1540 440" stroke="rgba(20,184,166,0.07)" strokeWidth="1.3" />
          <path d="M-100 430 C210 350, 540 520, 820 450 S1140 370, 1540 470" stroke="rgba(20,184,166,0.05)" strokeWidth="1" />
          <path d="M-100 460 C230 380, 560 540, 830 470 S1160 390, 1540 500" stroke="rgba(20,184,166,0.05)" strokeWidth="1" />
          <path d="M-100 490 C260 410, 530 560, 840 490 S1180 410, 1540 530" stroke="rgba(20,184,166,0.04)" strokeWidth="0.9" />
          <path d="M-100 520 C280 440, 500 580, 850 520 S1180 440, 1540 560" stroke="rgba(20,184,166,0.04)" strokeWidth="0.8" />
          <path d="M-100 560 C320 480, 550 610, 870 550 S1200 470, 1540 600" stroke="rgba(20,184,166,0.035)" strokeWidth="0.8" />
          <path d="M-100 600 C360 520, 580 640, 890 580 S1220 500, 1540 640" stroke="rgba(20,184,166,0.03)" strokeWidth="0.7" />
        </svg>
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-20">
        <div className="text-center max-w-3xl mx-auto animate-fade-in-1">
          <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-10">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-gray-700">Empowering homeowners across the UK</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-gray-900 mb-8 leading-tight" data-testid="text-hero-heading">
            Your Mortgage is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
              Just the Beginning
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Stay on top of your home finances, keep connected with your broker, and unlock rewards along the way.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-[70%] sm:w-auto">
              <button className="group liquid-glass w-full sm:w-auto px-6 py-3 rounded-xl text-base font-bold text-white transition-all duration-300 inline-flex items-center justify-center gap-2 hover:scale-105 hover:brightness-110" style={{ background: '#44ba84', border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} data-testid="button-hero-signup">
                Sign Up Free <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href="/login" className="w-[70%] sm:w-auto">
              <button className="liquid-glass-sm w-full sm:w-auto px-6 py-3 rounded-xl text-base font-medium hover:scale-[1.02] transition-all inline-flex items-center justify-center gap-2" style={{ color: '#1a7a5c', border: '1px solid rgba(20,184,166,0.4)', boxShadow: '0 0 10px rgba(20,184,166,0.1)' }} data-testid="button-hero-login">
                Member Portal
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-12 md:py-16 overflow-hidden animate-fade-in-2" data-testid="section-partner-rewards">
        <div className="text-center mb-12 px-6">
          <p className="text-sm font-semibold tracking-wide uppercase mb-3" style={{ color: '#44ba84' }}>Homeowner Deals</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Deals from brands you love
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Many new homeowners want to make their house their own — so we've partnered with leading household brands to bring you exclusive discounts and cashback offers.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, var(--background, #f8faf9), transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, var(--background, #f8faf9), transparent)' }} />

          <LandingPartnerCarousel />
        </div>

      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-16" data-testid="section-features">
        <div className="text-center mb-12 animate-fade-in-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Everything You Need,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
              One Platform
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Tools to help you stay on top of your finances and connected with your broker.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`liquid-glass p-6 relative hover:scale-[1.02] transition-all duration-300 ${feature.span} animate-fade-in-${index + 3}`}
              data-testid={`card-feature-${index}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} pointer-events-none rounded-[1.25rem]`} />
              <div className="relative">
                <div className={`p-3 rounded-xl ${feature.iconBg} backdrop-blur-sm w-fit mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-16" data-testid="section-how-it-works">
        <div className="text-center mb-12 animate-fade-in-6">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Get started in minutes — it's simple, free, and designed around you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`liquid-glass p-6 relative hover:scale-[1.02] transition-all duration-300 animate-fade-in-${index + 7}`}
              data-testid={`card-step-${index}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} pointer-events-none rounded-[1.25rem]`} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-heading font-bold text-primary/20">{step.number}</span>
                  <div className={`p-2.5 rounded-xl ${step.iconBg} backdrop-blur-sm`}>
                    <step.icon className={`h-5 w-5 ${step.iconColor}`} />
                  </div>
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-16" data-testid="section-trust">
        <div className="text-center mb-12 animate-fade-in-13">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Built on Trust
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Your security and confidence are at the heart of everything we do.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className={`liquid-glass-sm p-6 text-center animate-fade-in-${index + 14}`}
              data-testid={`card-trust-${index}`}
            >
              <div className="p-3 rounded-xl backdrop-blur-sm w-fit mx-auto mb-4" style={{ background: 'rgba(45, 160, 155, 0.1)' }}>
                <item.icon className="h-6 w-6" style={{ color: '#2DA09B' }} />
              </div>
              <h3 className="font-heading font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-20" data-testid="section-final-cta">
        <div className="liquid-glass p-10 md:p-14 text-center relative animate-fade-in-17">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-teal-50/20 to-green-50/25 pointer-events-none rounded-[1.25rem]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <Heart className="h-5 w-5 text-rose-500" />
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
              Ready to Start Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                Prosperity Journey
              </span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-8">
              Join Uprosper today — it's free, simple, and puts you in control of your financial milestones.
            </p>
            <Link href="/signup">
              <button className="group liquid-glass px-7 py-3.5 rounded-xl text-base font-bold text-white transition-all duration-300 flex items-center gap-2 mx-auto hover:scale-105 hover:brightness-110" style={{ background: '#44ba84', border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} data-testid="button-cta-signup">
                Get Started Free <ChevronRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-gray-200/50 mt-8 animate-fade-in-18">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/">
              <img src="/logo.png" alt="Uprosper" className="h-7 w-7 cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-gray-900 transition-colors" data-testid="link-footer-login">Log In</Link>
              <Link href="/signup" className="hover:text-gray-900 transition-colors" data-testid="link-footer-signup">Sign Up</Link>
              <button
                onClick={() => setShowPrivacy(true)}
                className="hover:text-gray-900 transition-colors cursor-pointer"
                data-testid="button-footer-privacy"
              >
                Privacy
              </button>
              <button
                onClick={() => setShowTerms(true)}
                className="hover:text-gray-900 transition-colors cursor-pointer"
                data-testid="button-footer-terms"
              >
                Terms
              </button>
              <button
                onClick={() => setShowDisclaimer(true)}
                className="hover:text-gray-900 transition-colors cursor-pointer"
                data-testid="button-footer-disclaimer"
              >
                Disclaimer
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Uprosper. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
      <TermsConditionsDialog open={showTerms} onOpenChange={setShowTerms} />
      <DisclaimerDialog open={showDisclaimer} onOpenChange={setShowDisclaimer} />
    </div>
  );
}
