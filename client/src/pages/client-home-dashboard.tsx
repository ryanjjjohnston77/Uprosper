import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, ArrowLeft, Wallet, Percent, CalendarDays, Hourglass } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Client } from "@shared/schema";
import MortgageProgressChart from "@/components/MortgageProgressChart";

const GREEN = {
  bg: "rgba(68,186,132,0.08)",
  border: "rgba(68,186,132,0.2)",
  text: "#0f766e",
  accent: "#44ba84",
} as const;

const PASTEL = {
  mint:     { bg: "#e9f7f0", border: "#44ba8455", icon: "#0f766e", iconBg: "#d6f3e6" },
  peach:    { bg: "#fdf0e3", border: "#f4a26155", icon: "#a85a1a", iconBg: "#fde6d3" },
  sky:      { bg: "#e6f2fd", border: "#63b3ed55", icon: "#1e5d9b", iconBg: "#d6ebff" },
  lavender: { bg: "#f1eafe", border: "#b794f455", icon: "#5b3b9e", iconBg: "#ede4ff" },
} as const;

const SECTION_CLASS = "rounded-2xl bg-white border border-gray-200 p-5 sm:p-6";

const NOT_SET_LABEL = "Not set";
const NOT_SET_CAPTION = "Ask your broker";

function calcMonthlyPayment(principal: number, ratePct: number, termYears: number): number {
  if (!(principal > 0 && termYears > 0)) return 0;
  if (ratePct <= 0) return principal / (termYears * 12);
  const r = ratePct / 100 / 12;
  const n = termYears * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function yearsUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diffMs = d.getTime() - Date.now();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

const SectionHeading = ({ title, badge }: { title: string; badge?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 rounded-full" style={{ background: GREEN.accent }} />
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
    </div>
    {badge && (
      <span
        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
        style={{ background: GREEN.bg, color: GREEN.text, border: `1px solid ${GREEN.border}` }}
      >
        {badge}
      </span>
    )}
  </div>
);

type Palette = keyof typeof PASTEL;

const BentoTile = ({
  label,
  value,
  caption,
  testId,
  muted,
  palette,
  Icon,
}: {
  label: string;
  value: string;
  caption: string;
  testId: string;
  muted?: boolean;
  palette: Palette;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) => {
  const p = PASTEL[palette];
  return (
    <div
      className="rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        background: muted ? "#ffffff" : p.bg,
        border: muted ? "1px dashed rgba(0,0,0,0.12)" : `1px solid ${p.border}`,
        boxShadow: muted ? "none" : "inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: muted ? "#f3f4f6" : p.iconBg }}
        >
          <Icon className="w-4 h-4" style={{ color: muted ? "#9ca3af" : p.icon }} />
        </div>
        <p
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: muted ? "#9ca3af" : p.icon }}
        >
          {label}
        </p>
      </div>
      <p
        className={`text-2xl sm:text-3xl font-bold tabular-nums ${muted ? "text-gray-400" : "text-gray-900"}`}
        data-testid={testId}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{caption}</p>
    </div>
  );
};

export default function ClientHomeDashboard() {
  const [, setLocation] = useLocation();

  const { data: clientMe } = useQuery<Client>({
    queryKey: ["/api/client/me"],
  });

  // Live values from broker-assigned data
  const realPrincipal = clientMe?.mortgageValue ? parseFloat(clientMe.mortgageValue) : 0;
  const realRate = clientMe?.interestRate ? parseFloat(clientMe.interestRate) : 0;
  const realTerm = clientMe?.mortgageTerm ?? 0;
  const storedMonthlyPayment = clientMe?.monthlyPayment ? parseFloat(clientMe.monthlyPayment) : 0;
  const realMonthlyPayment = storedMonthlyPayment > 0
    ? storedMonthlyPayment
    : calcMonthlyPayment(realPrincipal, realRate, realTerm);
  const yrsRemaining = yearsUntil(clientMe?.renewalDate);

  // Calculator state — pre-fills from real values once loaded
  const [mortgageAmount, setMortgageAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [mortgageTerm, setMortgageTerm] = useState("");
  const [prefilled, setPrefilled] = useState(false);
  const userInteractedRef = useRef(false);
  const calcEventFiredRef = useRef(false);

  const trackInteraction = () => {
    userInteractedRef.current = true;
  };

  useEffect(() => {
    if (prefilled || !clientMe) return;
    if (realPrincipal > 0) setMortgageAmount(String(realPrincipal));
    if (realRate > 0) setInterestRate(String(realRate));
    if (realTerm > 0) setMortgageTerm(String(realTerm));
    setPrefilled(true);
  }, [clientMe, prefilled, realPrincipal, realRate, realTerm]);

  const principal = parseFloat(mortgageAmount) || 0;
  const rate = parseFloat(interestRate) || 0;
  const term = parseFloat(mortgageTerm) || 0;
  const monthlyPayment = calcMonthlyPayment(principal, rate, term);

  useEffect(() => {
    if (calcEventFiredRef.current) return;
    if (!userInteractedRef.current) return;
    if (monthlyPayment <= 0) return;
    if (sessionStorage.getItem("uprosper:home_calc_fired") === "1") {
      calcEventFiredRef.current = true;
      return;
    }
    calcEventFiredRef.current = true;
    sessionStorage.setItem("uprosper:home_calc_fired", "1");
    fetch("/api/client/event", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "calculator_run", metadata: { source: "home" } }),
    }).catch(() => {});
  }, [monthlyPayment]);



  const inputClass =
    "mt-1 h-10 bg-white border-gray-200 shadow-none focus-visible:ring-1 focus-visible:ring-offset-0";

  // Tile presentation
  const valueTile = realPrincipal > 0
    ? {
        value: `£${realPrincipal.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`,
        caption: "Loan amount",
        muted: false,
      }
    : { value: NOT_SET_LABEL, caption: NOT_SET_CAPTION, muted: true };

  const rateTile = realRate > 0
    ? { value: `${realRate}%`, caption: "Annual rate", muted: false }
    : { value: NOT_SET_LABEL, caption: NOT_SET_CAPTION, muted: true };

  const monthlyTile = realMonthlyPayment > 0
    ? {
        value: `£${realMonthlyPayment.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`,
        caption: "Estimated",
        muted: false,
      }
    : { value: NOT_SET_LABEL, caption: NOT_SET_CAPTION, muted: true };

  const termTile = (() => {
    if (!realTerm) return { value: NOT_SET_LABEL, caption: NOT_SET_CAPTION, muted: true };
    if (yrsRemaining !== null && yrsRemaining > 0) {
      return {
        value: `${Math.max(0, Math.round(yrsRemaining))} yrs`,
        caption: `of ${realTerm} year term`,
        muted: false,
      };
    }
    return { value: `${realTerm} yrs`, caption: "Full term", muted: false };
  })();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/client")}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: GREEN.bg, border: `1px solid ${GREEN.border}` }}
            >
              <Home className="w-5 h-5" style={{ color: GREEN.accent }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Home Dashboard</h1>
              <p className="text-sm text-gray-500">Your mortgage at a glance</p>
            </div>
          </div>
        </div>

        {/* Mortgage Overview — full width */}
        <section className={SECTION_CLASS}>
          <SectionHeading title="Mortgage Overview" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <BentoTile
              label="Mortgage Value"
              value={valueTile.value}
              caption={valueTile.caption}
              muted={valueTile.muted}
              palette="mint"
              Icon={Wallet}
              testId="text-home-mortgage-value"
            />
            <BentoTile
              label="Interest Rate"
              value={rateTile.value}
              caption={rateTile.caption}
              muted={rateTile.muted}
              palette="peach"
              Icon={Percent}
              testId="text-home-interest-rate"
            />
            <BentoTile
              label="Monthly Payment"
              value={monthlyTile.value}
              caption={monthlyTile.caption}
              muted={monthlyTile.muted}
              palette="sky"
              Icon={CalendarDays}
              testId="text-home-monthly-pay"
            />
            <BentoTile
              label="Term Remaining"
              value={termTile.value}
              caption={termTile.caption}
              muted={termTile.muted}
              palette="lavender"
              Icon={Hourglass}
              testId="text-home-term-remaining"
            />
          </div>
        </section>

        {/* Mortgage Progress chart */}
        <MortgageProgressChart
          principal={realPrincipal}
          ratePct={realRate}
          termYears={realTerm}
          monthlyPayment={realMonthlyPayment}
          mortgageStartDate={clientMe?.createdAt}
        />

        {/* Calculators — side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className={SECTION_CLASS}>
            <SectionHeading title="Mortgage Calculator" badge="Tool" />
            <div className="space-y-3 mb-4">
              <div>
                <Label htmlFor="calc-amount" className="text-xs font-medium text-gray-600">
                  Mortgage Amount (£)
                </Label>
                <Input
                  id="calc-amount"
                  type="number"
                  placeholder="250000"
                  value={mortgageAmount}
                  onChange={(e) => { trackInteraction(); setMortgageAmount(e.target.value); }}
                  className={inputClass}
                  data-testid="input-calc-amount"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="calc-rate" className="text-xs font-medium text-gray-600">
                    Interest Rate (%)
                  </Label>
                  <Input
                    id="calc-rate"
                    type="number"
                    step="0.1"
                    placeholder="4.5"
                    value={interestRate}
                    onChange={(e) => { trackInteraction(); setInterestRate(e.target.value); }}
                    className={inputClass}
                    data-testid="input-calc-rate"
                  />
                </div>
                <div>
                  <Label htmlFor="calc-term" className="text-xs font-medium text-gray-600">
                    Term (years)
                  </Label>
                  <Input
                    id="calc-term"
                    type="number"
                    placeholder="25"
                    value={mortgageTerm}
                    onChange={(e) => { trackInteraction(); setMortgageTerm(e.target.value); }}
                    className={inputClass}
                    data-testid="input-calc-term"
                  />
                </div>
              </div>
            </div>
            {monthlyPayment > 0 && (
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: GREEN.bg, border: `1px solid ${GREEN.border}` }}
              >
                <p className="text-xs text-gray-600 mb-0.5">Estimated Monthly Payment</p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: GREEN.text }}
                  data-testid="text-calc-monthly-payment"
                >
                  £{monthlyPayment.toFixed(2)}
                </p>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
