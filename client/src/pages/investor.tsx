import { Link } from "wouter";
import { Presentation, FileText, ChevronRight, Sparkles, ArrowLeft } from "lucide-react";
import { ALL_SLIDES } from "@/pages/pitch/pitch-config";
import { TOTAL_PAGES as PLAN_TOTAL_PAGES } from "@/pages/plan/plan-nav";

export default function InvestorPage() {
  const slideCount = ALL_SLIDES.length;

  return (
    <div className="relative min-h-screen overflow-hidden" data-testid="page-investor">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(68,186,132,0.10) 0%, transparent 45%), radial-gradient(circle at 80% 100%, rgba(45,160,155,0.08) 0%, transparent 45%), linear-gradient(180deg, #ffffff 0%, #f6fbf8 100%)",
        }}
      />

      <header className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-8 flex items-center justify-between">
        <Link href="/">
          <button
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            data-testid="link-back-home"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </Link>
        <Link href="/">
          <img
            src="/logo.png"
            alt="Uprosper"
            className="h-7 w-7 cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </header>

      <section className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
          style={{ background: "rgba(68,186,132,0.1)", border: "1px solid rgba(68,186,132,0.2)" }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: "#44ba84" }} />
          <span className="text-xs font-semibold" style={{ color: "#2d8b63" }}>
            Investor Area
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
          For Prospective{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
            Investors
          </span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
          Two ways to get to know Uprosper. Skim the pitch deck for the headline story, or read
          the full business plan for the depth.
        </p>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pitch Deck Bento */}
          <div
            className="liquid-glass p-7 md:p-8 relative flex flex-col hover:scale-[1.01] transition-all duration-300"
            data-testid="card-pitch-deck-overview"
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/30 pointer-events-none rounded-[1.25rem]"
            />
            <div className="relative flex flex-col flex-1">
              <div
                className="p-3 rounded-xl backdrop-blur-sm w-fit mb-5"
                style={{ background: "rgba(68,186,132,0.12)", border: "1px solid rgba(68,186,132,0.2)" }}
              >
                <Presentation className="h-6 w-6" style={{ color: "#2d8b63" }} />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900">
                  Investor Pitch Deck
                </h2>
              </div>
              <p className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: "#44ba84" }}>
                {slideCount} slides · ~5 minute read
              </p>

              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                The headline story: the problem we're solving, our solution, the market opportunity,
                our business model, and what we're raising.
              </p>

              <ul className="space-y-2 mb-7 flex-1">
                {[
                  "The £39B UK mortgage opportunity",
                  "How brokers turn one-time deals into lifelong relationships",
                  "Our SaaS + referral revenue model",
                  "Roadmap, team, and funding ask",
                ].map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#44ba84" }} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <Link href="/pitch/1">
                <button
                  className="group w-full px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] hover:brightness-110"
                  style={{
                    background: "#44ba84",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)",
                  }}
                  data-testid="button-open-pitch-deck"
                >
                  Open Pitch Deck
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>

          {/* Business Plan Bento */}
          <div
            className="liquid-glass p-7 md:p-8 relative flex flex-col hover:scale-[1.01] transition-all duration-300"
            data-testid="card-business-plan-overview"
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-teal-50/40 via-emerald-50/30 to-green-50/40 pointer-events-none rounded-[1.25rem]"
            />
            <div className="relative flex flex-col flex-1">
              <div
                className="p-3 rounded-xl backdrop-blur-sm w-fit mb-5"
                style={{ background: "rgba(45,160,155,0.12)", border: "1px solid rgba(45,160,155,0.2)" }}
              >
                <FileText className="h-6 w-6" style={{ color: "#2DA09B" }} />
              </div>

              <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900 mb-2">
                Business Plan
              </h2>
              <p className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: "#2DA09B" }}>
                {PLAN_TOTAL_PAGES} pages · in-depth
              </p>

              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                The full picture: market analysis, product strategy, unit economics, go-to-market
                plan, competitive moats, compliance, and the path to exit.
              </p>

              <ul className="space-y-2 mb-7 flex-1">
                {[
                  "Detailed market sizing and customer journeys",
                  "Product, rewards, and revenue mechanics",
                  "Unit economics, traction, and growth strategy",
                  "Competitive landscape, moats, and compliance",
                ].map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#2DA09B" }} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <Link href="/plan/1">
                <button
                  className="group w-full px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] hover:brightness-110"
                  style={{
                    background: "#2DA09B",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)",
                  }}
                  data-testid="button-open-business-plan"
                >
                  Open Business Plan
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          For investor enquiries: <span className="font-semibold text-gray-600">invest@uprosper.co.uk</span>
        </p>
      </section>
    </div>
  );
}
