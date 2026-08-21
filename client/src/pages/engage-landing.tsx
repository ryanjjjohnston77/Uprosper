import { useEffect } from "react";
import {
  ArrowRight, MessageSquare, Bell, CalendarDays, Sparkles,
  Scale, Calculator, Stethoscope, Briefcase, Building2, HeartPulse,
  Users, Settings2, Send, Mail, ShieldCheck,
} from "lucide-react";

const CONTACT_EMAIL = "phil@uprosper.app";

const features = [
  {
    icon: MessageSquare,
    title: "Automated Messaging",
    description: "Schedule personalised, on-brand messages so your clients always hear from you at the right moment.",
    palette: { bg: "rgba(209,250,229,0.7)", border: "rgba(16,185,129,0.22)", text: "#047857", iconBg: "rgba(16,185,129,0.14)" },
  },
  {
    icon: Bell,
    title: "Reminders",
    description: "Send timely nudges and follow-ups so important touchpoints with your clients never slip through the cracks.",
    palette: { bg: "rgba(219,234,254,0.7)", border: "rgba(59,130,246,0.22)", text: "#1d4ed8", iconBg: "rgba(59,130,246,0.14)" },
  },
  {
    icon: CalendarDays,
    title: "Scheduling",
    description: "Let clients book appointments and consultations at times that work for both of you, with calendar sync built in.",
    palette: { bg: "rgba(237,233,254,0.7)", border: "rgba(139,92,246,0.22)", text: "#6d28d9", iconBg: "rgba(139,92,246,0.14)" },
  },
];

const audiences = [
  { icon: Scale, label: "Solicitors", color: "#1d4ed8", bg: "rgba(219,234,254,0.7)", border: "rgba(59,130,246,0.22)" },
  { icon: Calculator, label: "Accountants", color: "#047857", bg: "rgba(209,250,229,0.7)", border: "rgba(16,185,129,0.22)" },
  { icon: Stethoscope, label: "Dentists & Clinics", color: "#be123c", bg: "rgba(255,228,230,0.7)", border: "rgba(244,63,94,0.22)" },
  { icon: Briefcase, label: "Consultants", color: "#b45309", bg: "rgba(254,243,199,0.7)", border: "rgba(245,158,11,0.22)" },
  { icon: Building2, label: "Agencies", color: "#6d28d9", bg: "rgba(237,233,254,0.7)", border: "rgba(139,92,246,0.22)" },
  { icon: HeartPulse, label: "Wellbeing & Therapists", color: "#0f766e", bg: "rgba(204,251,241,0.7)", border: "rgba(20,184,166,0.22)" },
];

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Connect your client list",
    description: "Bring your existing client contacts into one tidy, secure place — no setup headaches.",
    palette: { bg: "rgba(209,250,229,0.7)", border: "rgba(16,185,129,0.22)", text: "#047857", iconBg: "rgba(16,185,129,0.14)" },
  },
  {
    number: "02",
    icon: Settings2,
    title: "Set up your touchpoints",
    description: "Choose the messages, reminders and scheduling options that match how you work.",
    palette: { bg: "rgba(204,251,241,0.7)", border: "rgba(20,184,166,0.22)", text: "#0f766e", iconBg: "rgba(20,184,166,0.14)" },
  },
  {
    number: "03",
    icon: Send,
    title: "Stay top of mind",
    description: "Uprosper handles the cadence in the background so your clients feel looked after, automatically.",
    palette: { bg: "rgba(219,234,254,0.7)", border: "rgba(59,130,246,0.22)", text: "#1d4ed8", iconBg: "rgba(59,130,246,0.14)" },
  },
];

function scrollToContact(e: React.MouseEvent) {
  e.preventDefault();
  const el = document.getElementById("contact");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function EngageLanding() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Uprosper — Client engagement & communications platform";
    return () => {
      document.title = previous;
    };
  }, []);

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-violet-100/30 via-blue-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-r from-amber-50/30 to-rose-50/20 rounded-full blur-3xl" />
      </div>

      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <a
          href="#top"
          className="flex items-center gap-2"
          data-testid="link-engage-brand"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl" style={{ background: "rgba(68,186,132,0.14)", border: "1px solid rgba(68,186,132,0.22)" }}>
            <Sparkles className="h-4.5 w-4.5" style={{ color: "#1a7a5c" }} />
          </span>
          <span className="text-xl font-heading font-bold tracking-tight" style={{ color: "#1a7a5c" }}>Uprosper</span>
        </a>
        <button
          onClick={scrollToContact}
          className="group inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:brightness-110"
          style={{ background: "#44ba84", border: "1px solid rgba(255,255,255,0.25)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), 0 4px 10px rgba(68,186,132,0.22)" }}
          data-testid="button-nav-get-in-touch"
        >
          Get in touch <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </nav>

      <section id="top" className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-12 md:pt-20 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(68,186,132,0.22)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" }}>
          <Sparkles className="h-4 w-4" style={{ color: "#1a7a5c" }} />
          <span className="text-sm font-semibold text-gray-700">UK-based client engagement platform</span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-gray-900 mb-6 leading-[1.1]" data-testid="text-engage-hero-heading">
          Stay close to every client,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
            without lifting a finger
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Uprosper helps professional service businesses keep clients engaged through automated messaging, reminders, and scheduling — all from one calm, easy-to-use platform.
        </p>
        <div className="flex items-center justify-center">
          <button
            onClick={scrollToContact}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:brightness-110"
            style={{ background: "#44ba84", border: "1.5px solid rgba(255,255,255,0.25)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), 0 6px 18px rgba(68,186,132,0.25)" }}
            data-testid="button-hero-get-in-touch"
          >
            Get in touch <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-16" data-testid="section-engage-features">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-wide uppercase mb-3" style={{ color: "#44ba84" }}>What we do</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Three simple ways to stay connected
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Light-touch tools that quietly do the work of a thoughtful, attentive team.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.85) 0%, ${f.palette.bg} 100%)`,
                border: `1px solid ${f.palette.border}`,
                boxShadow: "0 4px 18px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
              data-testid={`card-engage-feature-${i}`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: f.palette.iconBg, border: `1px solid ${f.palette.border}` }}>
                <f.icon className="h-6 w-6" style={{ color: f.palette.text }} />
              </div>
              <h3 className="text-lg font-heading font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-16" data-testid="section-engage-audiences">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold tracking-wide uppercase mb-3" style={{ color: "#44ba84" }}>Who it's for</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Built for professional service businesses
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            If you look after clients over the long term, Uprosper helps you stay in their corner.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {audiences.map((a, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center text-center rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: a.bg,
                border: `1px solid ${a.border}`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
              data-testid={`card-engage-audience-${i}`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-2" style={{ background: "rgba(255,255,255,0.7)" }}>
                <a.icon className="h-5 w-5" style={{ color: a.color }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: a.color }}>{a.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-16" data-testid="section-engage-how">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-wide uppercase mb-3" style={{ color: "#44ba84" }}>How it works</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Up and running in three steps
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            No new habits to learn — Uprosper sits quietly behind the scenes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 relative transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.85) 0%, ${s.palette.bg} 100%)`,
                border: `1px solid ${s.palette.border}`,
                boxShadow: "0 4px 18px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
              data-testid={`card-engage-step-${i}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-heading font-bold" style={{ color: `${s.palette.text}55` }}>{s.number}</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.palette.iconBg, border: `1px solid ${s.palette.border}` }}>
                  <s.icon className="h-5 w-5" style={{ color: s.palette.text }} />
                </div>
              </div>
              <h3 className="text-lg font-heading font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-16" data-testid="section-engage-not">
        <div
          className="rounded-3xl p-8 md:p-10"
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(148,163,184,0.22)",
            boxShadow: "0 4px 24px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(148,163,184,0.14)", border: "1px solid rgba(148,163,184,0.25)" }}>
              <ShieldCheck className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">What we are not</p>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-4">A purely technology platform</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-3">
                Uprosper is a UK-based client engagement and communications platform designed for professional service providers. Our software helps businesses stay connected with their clients through automated messaging, reminders, and scheduling.
              </p>
              <p className="text-base text-gray-700 leading-relaxed">
                We do not provide financial advice, recommend financial products, or operate as a regulated financial services provider. Our platform is purely a technology solution that supports client communication and retention for companies.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-20 text-center scroll-mt-24" data-testid="section-engage-contact">
        <div
          className="rounded-3xl p-10 md:p-12"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(209,250,229,0.6) 100%)",
            border: "1px solid rgba(68,186,132,0.22)",
            boxShadow: "0 6px 28px rgba(68,186,132,0.10), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5" style={{ background: "rgba(68,186,132,0.14)", border: "1px solid rgba(68,186,132,0.22)" }}>
            <Mail className="h-7 w-7" style={{ color: "#1a7a5c" }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-3">Let's chat</h2>
          <p className="text-base md:text-lg text-gray-600 max-w-xl mx-auto mb-8">
            Tell us a bit about your business and how you keep in touch with clients today. We'll get back to you within one working day.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Uprosper%20enquiry`}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:brightness-110"
            style={{ background: "#44ba84", border: "1.5px solid rgba(255,255,255,0.25)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), 0 6px 18px rgba(68,186,132,0.25)" }}
            data-testid="link-engage-contact-email"
          >
            <Mail className="h-4.5 w-4.5" /> {CONTACT_EMAIL}
          </a>
        </div>
      </section>

      <footer className="relative z-10 border-t border-gray-200/60 mt-8">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg" style={{ background: "rgba(68,186,132,0.14)", border: "1px solid rgba(68,186,132,0.22)" }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#1a7a5c" }} />
            </span>
            <span className="text-sm font-heading font-bold tracking-tight" style={{ color: "#1a7a5c" }}>Uprosper</span>
            <span className="text-xs text-gray-400 ml-2">© Uprosper {year}</span>
          </div>
          <p className="text-xs text-gray-500 max-w-xl md:text-right" data-testid="text-engage-footer-disclaimer">
            Uprosper is a technology platform for client engagement and communications. We do not provide financial advice, recommend financial products, or operate as a regulated financial services provider.
          </p>
        </div>
      </footer>
    </div>
  );
}
