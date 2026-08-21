import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { TrendingDown, PiggyBank, Wallet, Home, Sparkles, Bell, BellRing, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";

type PaymentReminderApi = {
  id: number;
  clientId: number;
  dayOfMonth: number;
  customMessage: string | null;
  enabled: boolean;
} | null;

const MINT = { solid: "#44ba84", soft: "#d6f3e6", deep: "#0f766e" };
const PEACH = { solid: "#f4a261", soft: "#fde6d3", deep: "#a85a1a" };
const SKY = { solid: "#63b3ed", soft: "#d6ebff", deep: "#1e5d9b" };
const LAVENDER = { solid: "#b794f4", soft: "#ede4ff", deep: "#5b3b9e" };
const BUTTER = { solid: "#f6c97a", soft: "#fff2d9", deep: "#8a5a00" };

type View = "balance" | "equity" | "breakdown";

type Row = {
  month: number;
  yearLabel: string;
  balance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  equityPct: number;
};

type Schedule = { rows: Row[]; paidOff: boolean };

function buildSchedule(
  principal: number,
  ratePct: number,
  monthlyPayment: number,
  monthlyOverpayment: number,
  maxMonths: number,
): Schedule {
  if (!(principal > 0 && monthlyPayment > 0)) return { rows: [], paidOff: false };
  const monthlyRate = ratePct / 100 / 12;
  const startYear = new Date().getFullYear();
  const startMonth = new Date().getMonth();
  const totalPay = monthlyPayment + monthlyOverpayment;

  // Non-amortizing: payment doesn't cover first month's interest, so balance never decreases.
  const initialInterest = monthlyRate > 0 ? principal * monthlyRate : 0;
  if (totalPay <= initialInterest) {
    return { rows: [], paidOff: false };
  }

  const rows: Row[] = [
    {
      month: 0,
      yearLabel: `${startYear}`,
      balance: principal,
      cumulativePrincipal: 0,
      cumulativeInterest: 0,
      equityPct: 0,
    },
  ];
  let balance = principal;
  let cumPrincipal = 0;
  let cumInterest = 0;
  let paidOff = false;

  for (let m = 1; m <= maxMonths; m++) {
    const interest = monthlyRate > 0 ? balance * monthlyRate : 0;
    let principalPaid = totalPay - interest;
    if (principalPaid > balance) principalPaid = balance;
    balance = Math.max(0, balance - principalPaid);
    cumPrincipal += principalPaid;
    cumInterest += interest;

    const d = new Date(startYear, startMonth + m, 1);
    rows.push({
      month: m,
      yearLabel: `${d.getFullYear()}`,
      balance,
      cumulativePrincipal: cumPrincipal,
      cumulativeInterest: cumInterest,
      equityPct: principal > 0 ? (cumPrincipal / principal) * 100 : 0,
    });
    if (balance <= 0) {
      paidOff = true;
      break;
    }
  }
  return { rows, paidOff };
}

function formatGBP(n: number) {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const motionValue = useMotionValue(value);
  const display = useTransform(motionValue, (v) => format(v));
  const prevRef = useRef(value);
  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.6,
      ease: "easeOut",
    });
    prevRef.current = value;
    return controls.stop;
  }, [value, motionValue]);
  return <motion.span>{display}</motion.span>;
}

export interface MortgageProgressChartProps {
  principal: number;
  ratePct: number;
  termYears: number;
  monthlyPayment: number;
  mortgageStartDate?: string | Date | null;
}

export default function MortgageProgressChart({
  principal,
  ratePct,
  termYears,
  monthlyPayment,
  mortgageStartDate,
}: MortgageProgressChartProps) {
  const [view, setView] = useState<View>("breakdown");
  const [overpayment, setOverpayment] = useState(0);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDay, setReminderDay] = useState<number>(1);
  const [reminderMessage, setReminderMessage] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: reminder } = useQuery<PaymentReminderApi>({
    queryKey: ["payment-reminder-me"],
    queryFn: async () => {
      const res = await fetch("/api/payment-reminders/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (reminderOpen) {
      if (reminder) {
        setReminderEnabled(reminder.enabled);
        setReminderDay(reminder.dayOfMonth);
        setReminderMessage(reminder.customMessage || "");
      } else {
        setReminderEnabled(true);
        setReminderDay(1);
        setReminderMessage("");
      }
    }
  }, [reminderOpen, reminder]);

  const saveReminder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/payment-reminders/me", {
        enabled: reminderEnabled,
        dayOfMonth: reminderDay,
        customMessage: reminderMessage.trim() || null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast.success(reminderEnabled ? "Reminder saved — we'll ping you 24h before payday" : "Reminder paused");
      queryClient.invalidateQueries({ queryKey: ["payment-reminder-me"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setReminderOpen(false);
    },
    onError: () => toast.error("Couldn't save reminder. Please try again."),
  });

  const deleteReminder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/payment-reminders/me", {});
      return res.json();
    },
    onSuccess: () => {
      toast.success("Reminder removed");
      queryClient.invalidateQueries({ queryKey: ["payment-reminder-me"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setReminderOpen(false);
    },
    onError: () => toast.error("Couldn't remove reminder."),
  });

  const maxMonths = useMemo(() => {
    const t = termYears > 0 ? termYears : 25;
    return Math.max(60, Math.ceil(t * 12) + 24);
  }, [termYears]);

  const baseline = useMemo(
    () => buildSchedule(principal, ratePct, monthlyPayment, 0, maxMonths),
    [principal, ratePct, monthlyPayment, maxMonths],
  );
  const withOverpay = useMemo(
    () => buildSchedule(principal, ratePct, monthlyPayment, overpayment, maxMonths),
    [principal, ratePct, monthlyPayment, overpayment, maxMonths],
  );

  const active = overpayment > 0 ? withOverpay : baseline;
  const scheduleRows = active.rows;
  const baselineMonths = baseline.paidOff ? baseline.rows.length - 1 : 0;
  const overpayMonths = withOverpay.paidOff ? withOverpay.rows.length - 1 : 0;
  const monthsSaved =
    baseline.paidOff && withOverpay.paidOff ? Math.max(0, baselineMonths - overpayMonths) : 0;
  const interestSaved =
    baseline.paidOff && withOverpay.paidOff
      ? Math.max(
          0,
          (baseline.rows[baseline.rows.length - 1]?.cumulativeInterest ?? 0) -
            (withOverpay.rows[withOverpay.rows.length - 1]?.cumulativeInterest ?? 0),
        )
      : 0;

  const freeByDate = useMemo(() => {
    if (!baseline.paidOff || !withOverpay.paidOff) return "—";
    const d = new Date();
    d.setMonth(d.getMonth() + overpayMonths);
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }, [overpayMonths, baseline.paidOff, withOverpay.paidOff]);

  const ready = principal > 0 && monthlyPayment > 0;
  const nonAmortizing = ready && scheduleRows.length === 0;

  // Completion donut: assume monthly payment has been made every month
  // since the mortgage started. Snap to the matching schedule row to
  // get cumulative principal paid and remaining balance.
  const elapsedMonths = useMemo(() => {
    if (!mortgageStartDate) return 0;
    const start = new Date(mortgageStartDate);
    if (isNaN(start.getTime())) return 0;
    const now = new Date();
    const months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    return Math.max(0, months);
  }, [mortgageStartDate]);
  const breakdownIdx = scheduleRows.length > 0
    ? Math.min(elapsedMonths, scheduleRows.length - 1)
    : 0;
  const paidSoFar = scheduleRows[breakdownIdx]?.cumulativePrincipal ?? 0;
  const remainingPrincipal = Math.max(0, principal - paidSoFar);
  const paidPct = principal > 0 ? Math.min(100, (paidSoFar / principal) * 100) : 0;

  // Side-panel derived values for the Breakdown view
  const elapsedYears = Math.floor(elapsedMonths / 12);
  const yearsLeft = Math.max(0, termYears - elapsedYears);
  const termPct = termYears > 0 ? Math.min(100, (elapsedYears / termYears) * 100) : 0;
  const nextMilestonePct = paidPct < 25 ? 25 : paidPct < 50 ? 50 : paidPct < 75 ? 75 : paidPct < 100 ? 100 : null;
  const milestoneDateLabel = useMemo(() => {
    if (nextMilestonePct === null) return freeByDate;
    if (!(principal > 0) || scheduleRows.length === 0) return "—";
    const target = (nextMilestonePct / 100) * principal;
    const hit = scheduleRows.find((r) => r.cumulativePrincipal >= target);
    if (!hit) return "Beyond current term";
    // Schedule rows are anchored at "now" (balance = principal at row 0).
    // The client's current position sits at row[elapsedMonths], so the
    // remaining months to the milestone is `hit.month - elapsedMonths`.
    const monthsFromNow = Math.max(0, hit.month - elapsedMonths);
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + monthsFromNow, 1);
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }, [nextMilestonePct, principal, scheduleRows, freeByDate, elapsedMonths]);

  // Snapshot tiles: today's balance and projected equity built at a future milestone.
  // Equity built = cumulative principal paid. We pick the 5-year mark when available,
  // otherwise fall back to the end of the schedule. Use `active` so the tile tracks
  // the overpayment slider in lockstep with the chart.
  const horizonMonths = Math.min(60, Math.max(0, active.rows.length - 1));
  const horizonRow = active.rows[horizonMonths];
  const equityAtHorizon = horizonRow?.cumulativePrincipal ?? 0;
  const horizonLabel = (() => {
    if (horizonMonths <= 0) return "today";
    const y = Math.floor(horizonMonths / 12);
    const m = horizonMonths % 12;
    if (y === 0) return `in ${m} month${m === 1 ? "" : "s"}`;
    if (m === 0) return `in ${y} year${y === 1 ? "" : "s"}`;
    return `in ${y}y ${m}m`;
  })();

  const PILLS: { id: View; label: string }[] = [
    { id: "breakdown", label: "Breakdown" },
    { id: "equity", label: "Equity" },
    { id: "balance", label: "Balance" },
  ];

  if (!ready) {
    return (
      <section
        className="rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, #f4fbf7 0%, #fdf3eb 100%)",
          border: "1px solid rgba(68,186,132,0.18)",
        }}
        data-testid="mortgage-progress-chart"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: MINT.solid }} />
          <h2 className="text-base font-bold text-gray-900">Mortgage Progress</h2>
        </div>
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "#ffffff", border: "1px dashed rgba(0,0,0,0.12)" }}
        >
          <p className="text-sm text-gray-500" data-testid="text-progress-empty">
            Once your broker fills in your mortgage details, you'll see your full progress chart here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-3xl p-5 sm:p-6"
      style={{
        background: "linear-gradient(135deg, #f4fbf7 0%, #fdf3eb 100%)",
        border: "1px solid rgba(68,186,132,0.18)",
      }}
      data-testid="mortgage-progress-chart"
    >
      {/* Header + pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: MINT.solid }} />
          <h2 className="text-base font-bold text-gray-900">Mortgage Progress</h2>
          <span
            className="ml-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: MINT.soft, color: MINT.deep, border: `1px solid ${MINT.solid}33` }}
          >
            Projection
          </span>
        </div>
        <div
          className="inline-flex items-center gap-1 p-1 rounded-full"
          style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}
          role="tablist"
        >
          {PILLS.map((p) => {
            const active = view === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setView(p.id)}
                className="relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors"
                style={{
                  color: active ? "#ffffff" : "#475569",
                }}
                data-testid={`pill-view-${p.id}`}
                role="tab"
                aria-selected={active}
              >
                {active && (
                  <motion.span
                    layoutId="pill-active-bg"
                    className="absolute inset-0 rounded-full"
                    style={{ background: MINT.solid }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
        <div
          className="rounded-2xl p-3 sm:p-4"
          style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          {nonAmortizing ? (
            <div
              className="h-[260px] w-full flex items-center justify-center text-center px-4"
              data-testid="text-non-amortizing"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Payment too low to reduce balance
                </p>
                <p className="text-xs text-gray-500 max-w-sm">
                  Your monthly payment doesn't cover the interest on this balance, so the loan
                  won't pay down. Worth chatting to your broker.
                </p>
              </div>
            </div>
          ) : view === "breakdown" ? (
            <div
              className="min-h-[260px] w-full grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-4 items-center"
              data-testid="chart-breakdown"
            >
              {/* Donut + legend (left column) */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative aspect-square w-full max-w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Paid", value: paidSoFar },
                          { name: "Remaining", value: remainingPrincipal },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius="68%"
                        outerRadius="98%"
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={paidSoFar > 0 && remainingPrincipal > 0 ? 1.5 : 0}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive
                        animationDuration={700}
                      >
                        <Cell fill={MINT.solid} />
                        <Cell fill={MINT.soft} />
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const entry = payload[0];
                          const swatch = entry.name === "Paid" ? MINT.solid : MINT.soft;
                          return (
                            <div
                              className="rounded-xl px-3 py-2 text-xs shadow-md"
                              style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}
                            >
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="w-2 h-2 rounded-full" style={{ background: swatch }} />
                                <span>{entry.name}</span>
                                <span className="ml-auto font-semibold text-gray-900">
                                  {formatGBP(entry.value as number)}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: MINT.deep }}
                      data-testid="text-breakdown-percent"
                    >
                      {Math.round(paidPct)}%
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-0.5">
                      repaid
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1 tabular-nums">
                      {formatGBP(paidSoFar)} of {formatGBP(principal)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 mt-3 text-[11px]">
                  <div className="flex items-center gap-1.5" data-testid="legend-breakdown-paid">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: MINT.solid }} />
                    <span className="text-gray-600">
                      Paid <span className="font-semibold text-gray-900 tabular-nums">{formatGBP(paidSoFar)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5" data-testid="legend-breakdown-remaining">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: MINT.soft, border: `1px solid ${MINT.solid}55` }}
                    />
                    <span className="text-gray-600">
                      Remaining <span className="font-semibold text-gray-900 tabular-nums">{formatGBP(remainingPrincipal)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Side panel (right column) */}
              <div className="flex flex-col gap-3">
                {/* Term progress */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="rounded-xl p-3"
                  style={{ background: MINT.soft, border: `1px solid ${MINT.solid}33` }}
                  data-testid="tile-term-progress"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Home className="w-3 h-3" style={{ color: MINT.deep }} />
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MINT.deep }}>
                      Term progress
                    </p>
                  </div>
                  <p
                    className="text-base font-bold tabular-nums"
                    style={{ color: MINT.deep }}
                    data-testid="text-term-progress-years"
                  >
                    {termYears > 0 ? `Year ${elapsedYears} of ${termYears}` : "—"}
                  </p>
                  <div
                    className="mt-2 h-1.5 w-full rounded-full overflow-hidden"
                    style={{ background: "#ffffff", border: `1px solid ${MINT.solid}22` }}
                    role="progressbar"
                    aria-valuenow={Math.round(termPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Term progress"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${termPct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: MINT.solid }}
                      data-testid="bar-term-progress-fill"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    {termYears > 0 ? `${yearsLeft} year${yearsLeft === 1 ? "" : "s"} to go` : "Term not set"}
                  </p>
                </motion.div>

                {/* Next milestone */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                  className="rounded-xl p-3"
                  style={{ background: SKY.soft, border: `1px solid ${SKY.solid}33` }}
                  data-testid="tile-next-milestone"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3" style={{ color: SKY.deep }} />
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: SKY.deep }}>
                      Next milestone
                    </p>
                  </div>
                  <p
                    className="text-base font-bold tabular-nums"
                    style={{ color: SKY.deep }}
                    data-testid="text-next-milestone-pct"
                  >
                    {nextMilestonePct === null ? "Mortgage-free" : `${nextMilestonePct}% repaid`}
                  </p>
                  <p
                    className="text-[10px] text-gray-600 mt-1"
                    data-testid="text-next-milestone-date"
                  >
                    {nextMilestonePct === null ? `by ${milestoneDateLabel}` : `est. ${milestoneDateLabel}`}
                  </p>
                </motion.div>

                {/* Encouragement */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 }}
                  className="rounded-xl p-3 flex items-start gap-2"
                  style={{ background: BUTTER.soft, border: `1px solid ${BUTTER.solid}33` }}
                  data-testid="tile-encouragement"
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "#ffffff" }}
                  >
                    <Sparkles className="w-3 h-3" style={{ color: BUTTER.deep }} />
                  </div>
                  <div className="text-[11px] leading-snug" style={{ color: BUTTER.deep }}>
                    <p className="font-semibold">We know the number looks big right now.</p>
                    <p className="text-gray-600 mt-0.5">
                      Stay consistent — and try the overpayment slider below to see how fast you can get ahead.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
          <div className="h-[260px] w-full" data-testid={`chart-${view}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scheduleRows} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mp-balance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={MINT.solid} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={MINT.solid} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="mp-equity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SKY.solid} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={SKY.solid} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="mp-principal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={MINT.solid} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={MINT.solid} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="mp-interest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PEACH.solid} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={PEACH.solid} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f7" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="yearLabel"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={36}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => `£${Math.round((v as number) / 1000)}k`}
                />
                <Tooltip
                  cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div
                        className="rounded-xl px-3 py-2 text-xs shadow-md"
                        style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}
                      >
                        <p className="font-semibold text-gray-900 mb-1">{label}</p>
                        {payload.map((entry) => (
                          <div
                            key={String(entry.dataKey)}
                            className="flex items-center gap-2 text-gray-600"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: entry.color as string }}
                            />
                            <span className="capitalize">{entry.name}</span>
                            <span className="ml-auto font-semibold text-gray-900">
                              {formatGBP(entry.value as number)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                {view === "balance" && (
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke={MINT.solid}
                    strokeWidth={2.5}
                    fill="url(#mp-balance)"
                    isAnimationActive
                    animationDuration={500}
                  />
                )}
                {view === "equity" && (
                  <Area
                    type="monotone"
                    dataKey="cumulativePrincipal"
                    name="Equity"
                    stroke={SKY.solid}
                    strokeWidth={2.5}
                    fill="url(#mp-equity)"
                    isAnimationActive
                    animationDuration={500}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        </div>

        {/* Snapshot: monthly payment pill + balance & equity in £ */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}
          data-testid="card-snapshot"
        >
          <div className="flex items-center justify-between gap-2">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: LAVENDER.soft,
                border: `1px solid ${LAVENDER.solid}40`,
              }}
              data-testid="pill-monthly-payment"
            >
              <Wallet className="w-3 h-3" style={{ color: LAVENDER.deep }} />
              <span className="text-[11px] font-semibold" style={{ color: LAVENDER.deep }}>
                {formatGBP(monthlyPayment)}/mo
              </span>
            </div>
            <button
              type="button"
              onClick={() => { if (monthlyPayment > 0) setReminderOpen(true); }}
              disabled={!(monthlyPayment > 0)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full transition-colors hover-elevate disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: monthlyPayment > 0
                  ? (reminder?.enabled ? MINT.soft : "#f5f5f5")
                  : "#f5f5f5",
                border: `1px solid ${monthlyPayment > 0 && reminder?.enabled ? MINT.solid + "55" : "rgba(0,0,0,0.08)"}`,
                color: monthlyPayment > 0
                  ? (reminder?.enabled ? MINT.deep : "#525252")
                  : "#9ca3af",
              }}
              data-testid="button-payment-reminder"
              title={
                monthlyPayment > 0
                  ? (reminder?.enabled ? "Edit your payment reminder" : "Add a payment reminder")
                  : "Ask your broker to set your monthly payment first"
              }
              aria-label={
                monthlyPayment > 0
                  ? (reminder?.enabled ? `Edit reminder (day ${reminder.dayOfMonth})` : "Add reminder")
                  : "Reminder unavailable"
              }
            >
              {reminder?.enabled && monthlyPayment > 0 ? (
                <BellRing className="w-3 h-3" />
              ) : (
                <Bell className="w-3 h-3" />
              )}
              <span className="text-[11px] font-semibold whitespace-nowrap">
                {monthlyPayment > 0
                  ? (reminder?.enabled ? `Edit reminder · day ${reminder.dayOfMonth}` : "Add reminder")
                  : "Reminder unavailable"}
              </span>
            </button>
          </div>

          <div
            className="rounded-xl p-3"
            style={{ background: MINT.soft, border: `1px solid ${MINT.solid}33` }}
            data-testid="tile-balance"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Home className="w-3 h-3" style={{ color: MINT.deep }} />
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MINT.deep }}>
                Balance today
              </p>
            </div>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: MINT.deep }}
              data-testid="text-balance-today"
            >
              {formatGBP(principal)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">what you owe</p>
          </div>

          <div
            className="rounded-xl p-3"
            style={{ background: SKY.soft, border: `1px solid ${SKY.solid}33` }}
            data-testid="tile-equity"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <PiggyBank className="w-3 h-3" style={{ color: SKY.deep }} />
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: SKY.deep }}>
                Equity built
              </p>
            </div>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: SKY.deep }}
              data-testid="text-equity-horizon"
            >
              {formatGBP(equityAtHorizon)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">{horizonLabel}</p>
          </div>
        </div>
      </div>

      {/* Overpayment slider */}
      <div
        className="mt-4 rounded-2xl p-4"
        style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: BUTTER.soft }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: BUTTER.deep }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 leading-tight">
                What if I overpaid each month?
              </p>
              <p className="text-[11px] text-gray-500">
                Drag to see how much time and interest you'd save
              </p>
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-sm font-bold tabular-nums"
            style={{ background: BUTTER.soft, color: BUTTER.deep }}
            data-testid="text-overpay-amount"
          >
            +£{overpayment.toLocaleString("en-GB")}/mo
          </div>
        </div>
        <Slider
          value={[overpayment]}
          onValueChange={(v) => setOverpayment(v[0])}
          min={0}
          max={1000}
          step={25}
          className="my-2"
          data-testid="slider-overpayment"
          aria-label="Monthly overpayment"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>£0</span>
          <span>£500</span>
          <span>£1,000</span>
        </div>

        {/* Live tiles */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div
            className="rounded-xl p-3"
            style={{ background: LAVENDER.soft, border: `1px solid ${LAVENDER.solid}33` }}
            data-testid="tile-time-saved"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: LAVENDER.deep }} />
              <p className="text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: LAVENDER.deep }}>
                Time saved
              </p>
            </div>
            <p className="text-lg font-bold text-gray-900 tabular-nums whitespace-nowrap">
              {Math.floor(monthsSaved / 12)}y {monthsSaved % 12}m
            </p>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ background: PEACH.soft, border: `1px solid ${PEACH.solid}33` }}
            data-testid="tile-interest-saved"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <PiggyBank className="w-4 h-4 shrink-0" style={{ color: PEACH.deep }} />
              <p className="text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: PEACH.deep }}>
                Interest saved
              </p>
            </div>
            <p className="text-lg font-bold text-gray-900 tabular-nums whitespace-nowrap">
              <CountUp value={interestSaved} format={formatGBP} />
            </p>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ background: MINT.soft, border: `1px solid ${MINT.solid}33` }}
            data-testid="tile-free-by"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingDown className="w-4 h-4 shrink-0" style={{ color: MINT.deep }} />
              <p className="text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: MINT.deep }}>
                Free by
              </p>
            </div>
            <p className="text-lg font-bold text-gray-900 tabular-nums whitespace-nowrap">{freeByDate}</p>
          </div>
        </div>
      </div>

      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-payment-reminder">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5" style={{ color: MINT.solid }} />
              Payment reminder
            </DialogTitle>
            <DialogDescription>
              We'll send you a notification 24 hours before your monthly mortgage payment leaves your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between rounded-xl border p-3" style={{ background: reminderEnabled ? MINT.soft : "#fafafa" }}>
              <div>
                <Label htmlFor="payment-reminder-enabled" className="text-sm font-semibold cursor-pointer">Reminder enabled</Label>
                <p id="payment-reminder-enabled-help" className="text-xs text-gray-600 mt-0.5">Turn off to pause notifications</p>
              </div>
              <Switch
                id="payment-reminder-enabled"
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
                aria-describedby="payment-reminder-enabled-help"
                data-testid="switch-reminder-enabled"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-reminder-day" className="text-sm font-semibold">Day of the month payment is taken</Label>
              <Select
                value={String(reminderDay)}
                onValueChange={(v) => setReminderDay(parseInt(v, 10))}
              >
                <SelectTrigger
                  id="payment-reminder-day"
                  aria-describedby="payment-reminder-day-help"
                  data-testid="select-reminder-day"
                  className="w-full"
                >
                  <SelectValue placeholder="Pick a day" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)} data-testid={`option-reminder-day-${d}`}>
                      {d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : d === 21 ? "st" : d === 22 ? "nd" : d === 23 ? "rd" : "th"} of the month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p id="payment-reminder-day-help" className="text-[11px] text-gray-500">Days 29–31 aren't shown so reminders work for every month, including February.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-reminder-message" className="text-sm font-semibold">Custom message (optional)</Label>
              <Textarea
                id="payment-reminder-message"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder={monthlyPayment > 0
                  ? `Your mortgage payment of ${formatGBP(monthlyPayment)} comes out tomorrow. Make sure your account is topped up.`
                  : "Your mortgage payment comes out tomorrow. Make sure your account is topped up."}
                maxLength={280}
                rows={3}
                aria-describedby="payment-reminder-message-count"
                data-testid="textarea-reminder-message"
              />
              <p id="payment-reminder-message-count" className="text-[11px] text-gray-500 text-right" aria-live="polite">{reminderMessage.length}/280 characters</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {reminder && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => deleteReminder.mutate()}
                disabled={deleteReminder.isPending}
                className="text-red-600 hover:text-red-700"
                data-testid="button-delete-reminder"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setReminderOpen(false)}
              data-testid="button-cancel-reminder"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => saveReminder.mutate()}
              disabled={saveReminder.isPending}
              style={{ background: MINT.solid }}
              data-testid="button-save-reminder"
            >
              {saveReminder.isPending ? "Saving…" : "Save reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
