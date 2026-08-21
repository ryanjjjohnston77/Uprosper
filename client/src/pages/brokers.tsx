import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, Sparkles, ShieldCheck, TrendingUp, Users, Repeat, Award,
  Heart, PoundSterling, LineChart, Gift, Store, MessageSquare, BarChart3,
  Bell, CheckCircle2, XCircle, Calendar, FileText, Star, Briefcase,
  Menu, X, LogIn, UserPlus, Sparkles as SparklesIcon, ShieldAlert, Home
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { PrivacyPolicyDialog, TermsConditionsDialog, DisclaimerDialog } from "@/components/legal-dialogs";

const GREEN = "#44ba84";
const GREEN_DEEP = "#0f766e";

const greenPastel = {
  bg: "rgba(68,186,132,0.10)",
  border: "rgba(68,186,132,0.28)",
  text: GREEN_DEEP,
};
const amberPastel = {
  bg: "rgba(245,158,11,0.10)",
  border: "rgba(245,158,11,0.28)",
  text: "#b45309",
};
const skyPastel = {
  bg: "rgba(14,165,233,0.10)",
  border: "rgba(14,165,233,0.25)",
  text: "#0369a1",
};
const violetPastel = {
  bg: "rgba(139,92,246,0.10)",
  border: "rgba(139,92,246,0.25)",
  text: "#6d28d9",
};
const rosePastel = {
  bg: "rgba(244,63,94,0.08)",
  border: "rgba(244,63,94,0.22)",
  text: "#be123c",
};

function Bento({
  children,
  className = "",
  tone = greenPastel,
  testId,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: { bg: string; border: string; text: string };
  testId?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

function IconTile({
  Icon,
  tone = greenPastel,
  size = "md",
}: {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  tone?: { bg: string; border: string; text: string };
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const iconSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div
      className={`${dim} rounded-xl flex items-center justify-center shrink-0`}
      style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
    >
      <Icon className={iconSize} style={{ color: tone.text }} />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-3xl mb-12 ${alignClass}`}>
      {eyebrow && (
        <p
          className="text-xs font-semibold tracking-wider uppercase mb-3"
          style={{ color: GREEN }}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-5xl font-heading font-bold text-gray-900 mb-4 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base md:text-lg text-gray-600 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

const benefits = [
  {
    icon: Heart,
    title: "Increase Client Loyalty & Engagement",
    desc: "Stay top of mind with milestone tracking, helpful nudges, and a branded app your clients actually open.",
    tone: greenPastel,
  },
  {
    icon: Repeat,
    title: "Capture More Remortgage Opportunities",
    desc: "Surface fixed-rate expiry dates, rate alerts and review prompts so remortgage conversations happen with you — not a comparison site.",
    tone: amberPastel,
  },
  {
    icon: Award,
    title: "Become Your Clients' Go-To Advisor for Life",
    desc: "Be the trusted financial partner across mortgages, protection and wealth — not a one-time transaction.",
    tone: skyPastel,
  },
  {
    icon: PoundSterling,
    title: "Generate Passive Referral Commission",
    desc: "Earn introducer commissions on insurance, life cover and wealth referrals — fully FCA compliant, fully hands-off.",
    tone: violetPastel,
  },
  {
    icon: LineChart,
    title: "Strengthen & Monetise Your Client Book",
    desc: "Build a richer, more valuable client book with engagement data buyers love — boosting your business valuation when you exit.",
    tone: rosePastel,
  },
];

const tiers = [
  {
    name: "Starter",
    price: "£20",
    period: "per month",
    desc: "For solo brokers building their first engaged client book.",
    features: [
      "Up to 250 clients",
      "Branded client app",
      "Milestone tracking & nudges",
      "Marketplace referral revenue",
      "Email support",
    ],
    featured: false,
  },
  {
    name: "Growth",
    price: "£50",
    period: "per month",
    desc: "For growing firms ready to scale retention and referral income.",
    bands: [
      { label: "1–5 brokers", price: "£50" },
      { label: "5–10 brokers", price: "£75" },
      { label: "10+ brokers", price: "£100" },
    ],
    features: [
      "Up to 1,500 clients",
      "Everything in Starter",
      "Advanced engagement analytics",
      "Remortgage pipeline & alerts",
      "Wealth & protection partner referrals",
      "Priority support",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For networks, mortgage clubs and larger broker firms.",
    features: [
      "Unlimited clients & advisors",
      "Everything in Growth",
      "Custom branding & domain",
      "API & CRM integrations",
      "Dedicated success manager",
      "FCA compliance support",
    ],
    featured: false,
  },
];

const testimonials = [
  {
    quote:
      "We've turned past clients into a recurring revenue stream. Remortgage retention is up, and the referral income from protection partners covers our subscription many times over.",
    name: "James Whitworth",
    role: "Director, Whitworth Mortgages",
  },
  {
    quote:
      "Clients actually open our branded app. We finally have a way to stay relevant between mortgage events without spamming people.",
    name: "Priya Shah",
    role: "Senior Broker, Beacon Financial",
  },
  {
    quote:
      "When I started thinking about exiting the business, I realised how much more my client book is worth with Uprosper engagement data behind it.",
    name: "Tom Reilly",
    role: "Founder, Reilly Mortgage Advisors",
  },
];

export default function BrokersPage() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [growthBand, setGrowthBand] = useState(0);

  return (
    <div className="min-h-screen bg-white text-gray-900" data-testid="page-brokers">
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
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
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(68,186,132,0.04) 50%, rgba(255,255,255,0.95) 100%)' }}
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
                        Your Financial Journey Starts Here
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
          <Link href="/broker-signup">
            <button className="group liquid-glass-sm px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-300 flex items-center gap-1.5 hover:scale-105 hover:brightness-110" style={{ background: '#44ba84', border: '1px solid rgba(255,255,255,0.25)' }} data-testid="link-signup-nav">
              Sign Up <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>
      </nav>

      <div className="relative">
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
        <div className="text-center max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: "rgba(68,186,132,0.10)",
              border: "1px solid rgba(68,186,132,0.25)",
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: GREEN }} />
            <span className="text-sm font-semibold" style={{ color: GREEN_DEEP }}>
              Built for mortgage brokers
            </span>
          </div>
          <h1
            className="text-5xl md:text-7xl font-heading font-bold text-gray-900 mb-7 leading-[1.05]"
            data-testid="text-broker-hero-heading"
          >
            One-Time Transactions into{" "}
            <span style={{ color: GREEN }}>Lifetime Clients</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            An always-on client platform that drives loyalty, remortgage retention, and referral revenue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="px-6 py-3 rounded-xl text-base font-semibold text-white transition-transform hover:scale-[1.02] inline-flex items-center gap-2 w-[70%] sm:w-auto justify-center cursor-pointer"
              style={{ background: GREEN }}
              data-testid="link-hero-trial"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://calendly.com/ryanjjjohnston/uprosper-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl text-base font-semibold transition-colors inline-flex items-center gap-2 w-[70%] sm:w-auto justify-center"
              style={{
                color: GREEN_DEEP,
                background: "rgba(68,186,132,0.08)",
                border: "1px solid rgba(68,186,132,0.28)",
              }}
              data-testid="link-hero-demo"
            >
              Book a Demo
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4" style={{ color: GREEN }} />
            <span data-testid="text-hero-trust">Fully FCA Compliant • No setup fees</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-5xl mx-auto">
          <Bento tone={greenPastel} testId="hero-stat-retention">
            <div className="flex items-center gap-3 mb-2">
              <IconTile Icon={Heart} tone={greenPastel} size="sm" />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GREEN_DEEP }}>
                Retention
              </p>
            </div>
            <p className="text-3xl font-heading font-bold text-gray-900">3–5×</p>
            <p className="text-sm text-gray-600 mt-1">higher remortgage retention vs. unmanaged client books</p>
          </Bento>
          <Bento tone={amberPastel} testId="hero-stat-revenue">
            <div className="flex items-center gap-3 mb-2">
              <IconTile Icon={PoundSterling} tone={amberPastel} size="sm" />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: amberPastel.text }}>
                Extra revenue
              </p>
            </div>
            <p className="text-3xl font-heading font-bold text-gray-900">+£12k–60k</p>
            <p className="text-sm text-gray-600 mt-1">per year in passive introducer commission</p>
          </Bento>
          <Bento tone={skyPastel} testId="hero-stat-valuation">
            <div className="flex items-center gap-3 mb-2">
              <IconTile Icon={TrendingUp} tone={skyPastel} size="sm" />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: skyPastel.text }}>
                Book value
              </p>
            </div>
            <p className="text-3xl font-heading font-bold text-gray-900">2× higher</p>
            <p className="text-sm text-gray-600 mt-1">valuation on engaged client books at exit</p>
          </Bento>
        </div>
        </section>
      </div>

      <section className="bg-gray-50/60 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionHeading
            eyebrow="The problem"
            title="Most Mortgage Clients Slip Away After Completion"
            subtitle="After the mortgage completes, many clients quietly disappear. Without ongoing engagement, you lose value at every turn."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {[
              { Icon: Repeat, text: "Valuable remortgage opportunities every 2–5 years" },
              { Icon: PoundSterling, text: "Future cross-sale revenue from insurance, life cover and wealth products" },
              { Icon: Award, text: "The chance to remain your client's trusted advisor for life" },
              { Icon: TrendingUp, text: "Significant value in your client book when you eventually exit the business" },
            ].map(({ Icon, text }, i) => (
              <Bento
                key={i}
                tone={greenPastel}
                className="flex items-start gap-4"
                testId={`problem-card-${i}`}
              >
                <IconTile Icon={Icon} tone={greenPastel} />
                <p className="text-base text-gray-800 leading-relaxed pt-1.5">{text}</p>
              </Bento>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8 max-w-2xl mx-auto" data-testid="text-problem-subtext">
            Client books with low engagement are worth far less. High churn means missed
            revenue and weaker business valuation.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionHeading
            eyebrow="What you get"
            title="Five ways Uprosper grows your business"
            subtitle="A single platform that strengthens every part of the broker–client relationship."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => (
              <Bento key={i} tone={b.tone} testId={`benefit-card-${i}`}>
                <IconTile Icon={b.icon} tone={b.tone} />
                <h3 className="font-heading font-bold text-lg text-gray-900 mt-4 mb-2">
                  {b.title}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">{b.desc}</p>
              </Bento>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50/60 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <SectionHeading
                eyebrow="Broker dashboard"
                title="Your Complete Broker Dashboard"
                subtitle="Manage every client in one place. Send personalised communications, track engagement, monitor your remortgage pipeline, and see real ROI from the platform."
                align="left"
              />
              <ul className="space-y-3">
                {[
                  { Icon: Users, text: "Client list with engagement scores and next-action prompts" },
                  { Icon: MessageSquare, text: "Send messages, document requests and review reminders in one click" },
                  { Icon: Calendar, text: "Remortgage pipeline with fixed-rate expiry timelines" },
                  { Icon: BarChart3, text: "Analytics on retention, referral revenue and platform ROI" },
                ].map(({ Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-3" data-testid={`dashboard-feature-${i}`}>
                    <IconTile Icon={Icon} tone={greenPastel} size="sm" />
                    <span className="text-base text-gray-800 pt-2">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Bento tone={greenPastel} className="p-5" testId="dashboard-mockup">
              <div className="rounded-xl bg-white p-5" style={{ border: "1px solid rgba(68,186,132,0.18)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: GREEN }}>
                      Broker Dashboard
                    </p>
                    <p className="font-heading font-bold text-gray-900 text-lg">Welcome back, Sarah</p>
                  </div>
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ background: greenPastel.bg, border: `1px solid ${greenPastel.border}` }}
                  >
                    <Bell className="h-5 w-5" style={{ color: GREEN_DEEP }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Active clients", value: "284", tone: greenPastel },
                    { label: "Remortgages due", value: "17", tone: amberPastel },
                    { label: "Referral £ MTD", value: "£3.2k", tone: skyPastel },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-3"
                      style={{ background: s.tone.bg, border: `1px solid ${s.tone.border}` }}
                    >
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        {s.label}
                      </p>
                      <p className="text-lg font-heading font-bold text-gray-900 mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Today's pipeline
                  </p>
                  {[
                    { name: "M. Patel", action: "Fixed rate ends in 90 days", tone: amberPastel },
                    { name: "L. Bennett", action: "Engagement score up 12%", tone: greenPastel },
                    { name: "R. Olson", action: "Insurance review due", tone: violetPastel },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5"
                      style={{ background: row.tone.bg, border: `1px solid ${row.tone.border}` }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{row.name}</p>
                        <p className="text-xs text-gray-600">{row.action}</p>
                      </div>
                      <ArrowRight className="h-4 w-4" style={{ color: row.tone.text }} />
                    </div>
                  ))}
                </div>
              </div>
            </Bento>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <Bento tone={violetPastel} className="p-8" testId="rewards-card">
              <IconTile Icon={Gift} tone={violetPastel} />
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-gray-900 mt-5 mb-3">
                Reward Your Clients — Increase Loyalty & Engagement
              </h2>
              <p className="text-base text-gray-700 leading-relaxed mb-5">
                Homeowners earn points for non-regulated actions — using the app, completing
                educational journeys, and hitting milestones. They redeem for lifestyle rewards
                that keep them coming back to your branded app and staying connected to you.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Branded points programme — your firm, your colours",
                  "Reward catalog of lifestyle, travel and home offers",
                  "Push notifications drive repeat app sessions",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: violetPastel.text }} />
                    {t}
                  </li>
                ))}
              </ul>
            </Bento>

            <Bento tone={amberPastel} className="p-8" testId="marketplace-card">
              <IconTile Icon={Store} tone={amberPastel} />
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-gray-900 mt-5 mb-3">
                Extra Revenue Stream — Introducer Only
              </h2>
              <p className="text-base text-gray-700 leading-relaxed mb-5">
                A curated homeowner marketplace pairs lifestyle deals with vetted Financial
                Protection Partners. You earn standard referral commissions on insurance, life
                cover and wealth introductions — while your clients get genuine value.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Standard introducer commissions on protection & wealth referrals",
                  "Curated home & lifestyle marketplace for homeowners",
                  "Fully FCA compliant — you remain strictly an introducer only",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: amberPastel.text }} />
                    {t}
                  </li>
                ))}
              </ul>
            </Bento>
          </div>
        </div>
      </section>

      <section className="bg-gray-50/60 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionHeading
            eyebrow="The exit picture"
            title="What Happens When You Exit Your Broker Business?"
            subtitle="The same client list can be worth a fraction — or a multiple — depending on the engagement data behind it."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            <Bento tone={rosePastel} className="p-7" testId="comparison-without">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ background: rosePastel.bg, border: `1px solid ${rosePastel.border}` }}
                >
                  <XCircle className="h-5 w-5" style={{ color: rosePastel.text }} />
                </div>
                <h3 className="font-heading font-bold text-xl text-gray-900">Without Uprosper</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Scattered client data across spreadsheets and inboxes",
                  "Low engagement and patchy contact history",
                  "Clients drift to comparison sites and direct lenders for remortgages",
                  "Missed cross-sale opportunities each year",
                  "Lower client book valuation when you sell or exit",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                    <span
                      className="mt-2 h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: rosePastel.text }}
                    />
                    {t}
                  </li>
                ))}
              </ul>
            </Bento>

            <Bento tone={greenPastel} className="p-7" testId="comparison-with">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ background: greenPastel.bg, border: `1px solid ${greenPastel.border}` }}
                >
                  <CheckCircle2 className="h-5 w-5" style={{ color: greenPastel.text }} />
                </div>
                <h3 className="font-heading font-bold text-xl text-gray-900">With Uprosper</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Rich, ongoing engagement history for every client",
                  "Higher lifetime value per relationship",
                  "Stronger remortgage retention — clients come back to you",
                  "Ongoing referral revenue from protection & wealth partners",
                  "Significantly higher business valuation when you sell or exit",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: greenPastel.text }} />
                    {t}
                  </li>
                ))}
              </ul>
            </Bento>
          </div>
        </div>
      </section>

      <section className="py-20 scroll-mt-20" id="pricing">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple Monthly SaaS Pricing"
            subtitle="No setup fees. No hidden costs. Cancel anytime."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {tiers.map((t, i) => {
              const tone = t.featured ? greenPastel : { bg: "rgba(255,255,255,1)", border: "rgba(0,0,0,0.08)", text: GREEN_DEEP };
              return (
                <div
                  key={i}
                  className="rounded-2xl p-7 flex flex-col"
                  style={{
                    background: t.featured ? greenPastel.bg : "#ffffff",
                    border: t.featured
                      ? `1.5px solid ${greenPastel.border}`
                      : "1px solid rgba(0,0,0,0.08)",
                  }}
                  data-testid={`pricing-tier-${t.name.toLowerCase()}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-bold text-xl text-gray-900">{t.name}</h3>
                    {t.featured && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{
                          background: GREEN,
                          color: "white",
                        }}
                      >
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{t.desc}</p>
                  {t.bands && (
                    <div className="mb-4" data-testid="growth-band-selector">
                      <div className="flex items-center gap-2">
                        {t.bands.map((band, bi) => {
                          const selected = bi === growthBand;
                          return (
                            <button
                              key={bi}
                              type="button"
                              onClick={() => setGrowthBand(bi)}
                              aria-label={band.label}
                              aria-pressed={selected}
                              className="flex-1 py-2 group cursor-pointer"
                              data-testid={`growth-band-${bi + 1}`}
                            >
                              <span
                                className="block h-1.5 rounded-full transition-all group-hover:opacity-90"
                                style={{
                                  background: selected ? GREEN : "rgba(68,186,132,0.22)",
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-600 mt-2 font-medium" data-testid="growth-band-label">
                        {t.bands[growthBand].label}
                      </p>
                    </div>
                  )}
                  <div className="mb-5">
                    <span className="text-3xl font-heading font-bold text-gray-900">
                      {t.bands ? t.bands[growthBand].price : t.price}
                    </span>
                    {t.period && <span className="text-sm text-gray-500 ml-1.5">/ {t.period}</span>}
                  </div>
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {t.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-800">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: GREEN }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://calendly.com/ryanjjjohnston/uprosper-demo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.01] inline-flex items-center justify-center"
                      style={{
                        background: "rgba(68,186,132,0.08)",
                        color: GREEN_DEEP,
                        border: "1px solid rgba(68,186,132,0.28)",
                      }}
                      data-testid={`link-tier-demo-${t.name.toLowerCase()}`}
                    >
                      Book a Demo
                    </a>
                    {t.name !== "Enterprise" && (
                      <Link
                        href={
                          t.bands
                            ? `/broker-signup?plan=growth&band=${growthBand + 1}`
                            : `/broker-signup?plan=${t.name.toLowerCase()}`
                        }
                        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.01] inline-flex items-center justify-center"
                        style={{
                          background: GREEN,
                          color: "white",
                        }}
                        data-testid={`link-tier-trial-${t.name.toLowerCase()}`}
                      >
                        Start Free Trial
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-gray-500 mt-6 max-w-2xl mx-auto">
            All plans include FCA-compliant introducer workflows. Pricing tiers based on
            firm size; final pricing confirmed during onboarding.
          </p>
        </div>
      </section>

      <section className="bg-gray-50/60 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionHeading
            eyebrow="Brokers love it"
            title="What broker firms are saying"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <Bento key={i} tone={greenPastel} testId={`testimonial-${i}`}>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" style={{ color: GREEN }} />
                  ))}
                </div>
                <p className="text-sm text-gray-800 leading-relaxed mb-5">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </Bento>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <Bento tone={greenPastel} className="p-10 md:p-14 text-center" testId="final-cta">
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-gray-900 mb-4 leading-tight">
              Ready to Own Your Client Relationships for Life?
            </h2>
            <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto mb-8 leading-relaxed">
              Join the brokers building richer, more valuable client books with Uprosper.
              No setup fees, fully FCA compliant.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/broker-signup"
                className="px-6 py-3 rounded-xl text-base font-semibold text-white transition-transform hover:scale-[1.02] inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                style={{ background: GREEN }}
                data-testid="link-final-trial"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:hello@uprosper.app?subject=Book%20a%20demo"
                className="px-6 py-3 rounded-xl text-base font-semibold transition-colors inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                style={{
                  color: GREEN_DEEP,
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(68,186,132,0.35)",
                }}
                data-testid="link-final-demo"
              >
                Book Your Demo Today
              </a>
            </div>
          </Bento>
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(68,186,132,0.18)",
                    border: "1px solid rgba(68,186,132,0.35)",
                  }}
                >
                  <Briefcase className="h-4 w-4" style={{ color: GREEN }} />
                </div>
                <span className="font-heading font-bold text-base" style={{ color: GREEN_DEEP }}>
                  Uprosper for Brokers
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                The client engagement platform built for modern UK mortgage brokers.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Product
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><a href="#features" className="hover:text-gray-900" data-testid="link-footer-features">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-900" data-testid="link-footer-pricing">Pricing</a></li>
                <li><a href="#marketplace" className="hover:text-gray-900" data-testid="link-footer-marketplace">Marketplace</a></li>
                <li><a href="#compliance" className="hover:text-gray-900" data-testid="link-footer-compliance">Compliance</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Company
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><Link href="/" className="hover:text-gray-900" data-testid="link-footer-homeowners">For Homeowners</Link></li>
                <li><Link href="/investor" className="hover:text-gray-900" data-testid="link-footer-investors">Investors</Link></li>
                <li><a href="mailto:hello@uprosper.app" className="hover:text-gray-900" data-testid="link-footer-contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Legal
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><a href="#" className="hover:text-gray-900" data-testid="link-footer-privacy">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900" data-testid="link-footer-terms">Terms &amp; Conditions</a></li>
                <li><a href="#" className="hover:text-gray-900" data-testid="link-footer-disclaimer">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div
            className="pt-6 text-xs text-gray-500 leading-relaxed"
            style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="mb-2">
              © {new Date().getFullYear()} Uprosper. All rights reserved.
            </p>
            <p>
              Uprosper provides software-as-a-service tools for FCA-authorised mortgage
              brokers. Brokers using Uprosper remain strictly an introducer for insurance,
              protection and wealth referrals. Pricing shown is indicative and confirmed
              during onboarding. Stated outcomes (retention, referral revenue and book
              valuations) are illustrative and not guarantees of results.
            </p>
          </div>
        </div>
      </footer>

      <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
      <TermsConditionsDialog open={showTerms} onOpenChange={setShowTerms} />
      <DisclaimerDialog open={showDisclaimer} onOpenChange={setShowDisclaimer} />
    </div>
  );
}
