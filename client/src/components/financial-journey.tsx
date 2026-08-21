import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight, Lock, TrendingUp, Copy, Check, PiggyBank, Home, ShieldCheck, Sparkles, FileText, Banknote, ChevronRight, ExternalLink, ScrollText, HeartPulse, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { JourneyStep } from "@shared/schema";

function CelebrationOverlay({ stepTitle, onComplete }: { stepTitle: string; onComplete: () => void }) {
  const theme = stepTheme[stepTitle] ?? {
    chipBg: "rgba(68,186,132,0.12)",
    chipText: "#16a34a",
    subtitleBg: "rgba(68,186,132,0.08)",
    subtitle: "A milestone on your homeowner journey.",
    Icon: Sparkles,
  };
  const { Icon } = theme;

  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)" }}
      onClick={onComplete}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="mx-4 max-w-sm w-full rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.90) 100%)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Pastel header */}
        <div className="relative p-6 pb-5 text-center overflow-hidden" style={{ background: theme.chipBg }}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${10 + i * 16}%`, top: `${15 + (i % 3) * 22}%` }}
              animate={{ opacity: [0, 0.45, 0], scale: [0.7, 1.2, 0.7] }}
              transition={{ duration: 2.2 + i * 0.25, repeat: Infinity, delay: i * 0.35 }}
            >
              <Sparkles className="w-3 h-3" style={{ color: theme.chipText, opacity: 0.5 }} />
            </motion.div>
          ))}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.08 }}
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
            style={{
              background: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(255,255,255,0.95)",
              boxShadow: `0 4px 20px ${theme.chipText}22`,
            }}
          >
            <Icon className="w-8 h-8" style={{ color: theme.chipText }} />
          </motion.div>
          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18 }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: theme.chipText }}>
              Step Complete
            </p>
            <h2 className="text-xl font-heading font-bold text-gray-900">{stepTitle}</h2>
          </motion.div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-center">
          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.26 }}
            className="text-gray-500 text-sm leading-relaxed mb-5"
          >
            {theme.subtitle}
          </motion.p>
          <motion.button
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.34 }}
            onClick={onComplete}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: theme.chipText, boxShadow: `0 4px 16px ${theme.chipText}33` }}
            data-testid="button-celebration-continue"
          >
            Continue Journey
          </motion.button>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-xs text-muted-foreground mt-3"
          >
            Tap anywhere to dismiss
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const defaultSteps = [
  { id: 1, title: "Mortgage Secured", status: "pending", date: "Action Needed" },
  { id: 2, title: "Home Insurance", status: "pending", date: "Recommended" },
  { id: 3, title: "Life Insurance", status: "locked", date: "Future Goal" },
  { id: 4, title: "Wealth Review", status: "locked", date: "Future Goal" },
  { id: 5, title: "Will & Succession", status: "locked", date: "Future Goal" },
];

const stepTheme: Record<string, {
  chipBg: string;
  chipText: string;
  subtitleBg: string;
  subtitle: string;
  Icon: LucideIcon;
}> = {
  "Mortgage Secured": {
    chipBg: "rgba(219,234,254,0.95)",
    chipText: "#1d4ed8",
    subtitleBg: "rgba(219,234,254,0.45)",
    subtitle: "Your home loan and the way repayments are structured.",
    Icon: Home,
  },
  "Home Insurance": {
    chipBg: "rgba(204,251,241,0.95)",
    chipText: "#0f766e",
    subtitleBg: "rgba(204,251,241,0.45)",
    subtitle: "Cover for your building and the things inside it.",
    Icon: ShieldCheck,
  },
  "Life Insurance": {
    chipBg: "rgba(237,233,254,0.95)",
    chipText: "#6d28d9",
    subtitleBg: "rgba(237,233,254,0.5)",
    subtitle: "Cover that may pay chosen people, subject to policy terms.",
    Icon: HeartPulse,
  },
  "Wealth Review": {
    chipBg: "rgba(254,243,199,0.95)",
    chipText: "#b45309",
    subtitleBg: "rgba(254,243,199,0.5)",
    subtitle: "A look at your savings, pensions and long-term plans.",
    Icon: TrendingUp,
  },
  "Will & Succession": {
    chipBg: "rgba(255,228,230,0.95)",
    chipText: "#be123c",
    subtitleBg: "rgba(255,228,230,0.5)",
    subtitle: "How your estate is shared with others after you pass.",
    Icon: ScrollText,
  },
};

interface FinancialJourneyProps {
  steps?: JourneyStep[];
  clientId?: number;
  brokerUserId?: string;
}

export function FinancialJourney({ steps: dbSteps, clientId, brokerUserId }: FinancialJourneyProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: brokerInfo } = useQuery({
    queryKey: ['broker-info'],
    queryFn: async () => {
      const res = await fetch('/api/client/broker-info', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
  });
  const [isaDialogOpen, setIsaDialogOpen] = useState(false);
  const [pensionDialogOpen, setPensionDialogOpen] = useState(false);
  const [mortgageDialogOpen, setMortgageDialogOpen] = useState(false);
  const [lifeInsuranceDialogOpen, setLifeInsuranceDialogOpen] = useState(false);
  const [homeInsuranceDialogOpen, setHomeInsuranceDialogOpen] = useState(false);
  const [willDialogOpen, setWillDialogOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [pensionCodeCopied, setPensionCodeCopied] = useState(false);
  const [celebrationStep, setCelebrationStep] = useState<string | null>(null);
  const [animateProgress, setAnimateProgress] = useState(true);
  const prevCompletedIdsRef = useRef<Set<number> | null>(null);
  const prevCompletedCountRef = useRef<number>(0);
  const [newlyCompletedStepId, setNewlyCompletedStepId] = useState<number | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  // Track completions and trigger celebrations for newly completed steps.
  // localStorage is the single source of truth for "already celebrated" so the
  // overlay never replays across sessions or re-mounts.
  useEffect(() => {
    // Wait until we have real data AND a real clientId — the query default
    // can be undefined while loading, and clientId may not be set yet.
    if (!dbSteps || clientId === undefined) return;

    const currentCompletedIds = dbSteps
      .filter(s => s.status === 'completed')
      .map(s => s.stepId);

    const storageKey = `celebrated_steps_${clientId}`;
    const celebratedIds: number[] = JSON.parse(localStorage.getItem(storageKey) ?? '[]');

    if (prevCompletedIdsRef.current === null) {
      // First real data load for this session: mark every already-completed step
      // as celebrated so we never replay old completions.
      prevCompletedIdsRef.current = new Set(currentCompletedIds);
      const celebratedSet = new Set(celebratedIds);
      const merged = [...celebratedIds, ...currentCompletedIds.filter(id => !celebratedSet.has(id))];
      localStorage.setItem(storageKey, JSON.stringify(merged));
      return;
    }

    // Check for steps newly completed since the last effect run that have not
    // been celebrated before (double-guard: prevRef + localStorage).
    const celebratedSet = new Set(celebratedIds);
    for (const stepId of currentCompletedIds) {
      if (!prevCompletedIdsRef.current.has(stepId) && !celebratedSet.has(stepId)) {
        const completedStep = dbSteps.find(s => s.stepId === stepId);
        if (completedStep) {
          // Persist immediately before the async timer fires so a fast re-render
          // or unmount cannot trigger a second celebration for the same step.
          celebratedIds.push(stepId);
          localStorage.setItem(storageKey, JSON.stringify(celebratedIds));

          setAnimateProgress(false);
          setNewlyCompletedStepId(stepId);
          if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
          celebrationTimerRef.current = setTimeout(() => {
            setCelebrationStep(completedStep.stepTitle);
          }, 2000);
          break; // one celebration at a time
        }
      }
    }

    // Always sync the ref to the latest completed set.
    prevCompletedIdsRef.current = new Set(currentCompletedIds);
  }, [dbSteps, clientId]);

  const enquiryMutation = useMutation({
    mutationFn: async (data: { productType: string }) => {
      if (!clientId || !brokerUserId) throw new Error("Missing client info");
      const res = await apiRequest('POST', '/api/enquiries', {
        clientId,
        brokerUserId,
        productType: data.productType,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-enquiries'] });
      toast.success("Your broker has received your enquiry and will be in touch!");
    },
    onError: () => {
      toast.error("Failed to send enquiry. Please try again.");
    },
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText("UPROSPER-ISA-2024");
    setCodeCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyPensionCode = () => {
    navigator.clipboard.writeText("UPROSPER-PENSION-2024");
    setPensionCodeCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setPensionCodeCopied(false), 2000);
  };

  // Always start with default steps, then overlay database status for any that have been toggled
  const baseSteps = defaultSteps.map(defaultStep => {
    const dbStep = dbSteps?.find(s => s.stepId === defaultStep.id);
    if (dbStep) {
      return {
        id: dbStep.stepId,
        title: dbStep.stepTitle,
        status: dbStep.status,
        date: dbStep.status === "completed" && dbStep.completedAt 
          ? new Date(dbStep.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : dbStep.status === "current" ? "Action Needed" : defaultStep.date
      };
    }
    return defaultStep;
  });
  
  // Progressive unlock logic: only the next step after the most recently completed one is unlocked.
  // Initially only step 1 (Mortgage Options) is available; Home Insurance unlocks when the broker
  // marks Mortgage Secured as completed, and so on.
  const completedStepIds = baseSteps.filter(s => s.status === "completed").map(s => s.id);
  const maxCompletedId = completedStepIds.length > 0 ? Math.max(...completedStepIds) : 0;
  const maxUnlockedId = maxCompletedId + 1;
  
  const steps = baseSteps.map(step => {
    if (step.status === "completed") return step;
    if (step.id <= maxUnlockedId) {
      return { ...step, status: "available", date: step.status === "locked" ? "Now Available" : step.date };
    }
    return { ...step, status: "locked", date: "Future Goal" };
  });

  const completedCount = steps.filter(s => s.status === "completed").length;
  const currentStep = steps.find(s => s.status === "current");

  return (
    <>
      <AnimatePresence>
        {celebrationStep && (
          <CelebrationOverlay 
            stepTitle={celebrationStep} 
            onComplete={() => {
              setCelebrationStep(null);
              setTimeout(() => {
                setAnimateProgress(true);
                setTimeout(() => {
                  const currentCount = dbSteps?.filter(s => s.status === 'completed').length || 0;
                  prevCompletedCountRef.current = currentCount;
                  setNewlyCompletedStepId(null);
                }, 1200);
              }, 100);
            }} 
          />
        )}
      </AnimatePresence>
      
      {/* Wealth Review Dialog */}
      <Dialog open={pensionDialogOpen} onOpenChange={setPensionDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
          {steps.find(s => s.id === 4)?.status === "completed" ? (
            <div style={{ background: 'linear-gradient(135deg, rgba(68,186,132,0.12) 0%, rgba(68,186,132,0.2) 50%, rgba(68,186,132,0.08) 100%)' }}>
              <div className="relative overflow-hidden rounded-t-lg p-4 text-center" style={{ background: 'linear-gradient(135deg, #44ba84 0%, #38a373 50%, #2d8b63 100%)' }}>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${20 + i * 20}%`, top: `${20 + (i % 2) * 30}%` }}
                    animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
                  >
                    <Sparkles className="w-3 h-3 text-white/30" />
                  </motion.div>
                ))}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                </motion.div>
                <DialogHeader className="text-center space-y-0.5">
                  <DialogTitle className="text-xl font-heading font-bold text-white">Wealth Review</DialogTitle>
                  <DialogDescription className="text-white/85 text-sm">Your financial future is taking shape — keep going!</DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#44ba84' }}>Explore your options</p>
                <div className="rounded-xl p-2 space-y-2" style={{ background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <button
                    className="flex items-center gap-3 p-2 rounded-lg transition-all group text-left w-full hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                    data-testid="button-enquire-isa"
                    onClick={() => { enquiryMutation.mutate({ productType: "ISA" }); setPensionDialogOpen(false); }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.15)' }}>
                      <PiggyBank className="w-4 h-4" style={{ color: '#44ba84' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">ISA</h4>
                      <p className="text-xs text-gray-500">Tax-free savings for your future</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#44ba84' }} />
                  </button>
                  <button
                    className="flex items-center gap-3 p-2 rounded-lg transition-all group text-left w-full hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                    data-testid="button-enquire-investments"
                    onClick={() => { enquiryMutation.mutate({ productType: "Investments" }); setPensionDialogOpen(false); }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.15)' }}>
                      <TrendingUp className="w-4 h-4" style={{ color: '#44ba84' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">Investments</h4>
                      <p className="text-xs text-gray-500">Grow your wealth over time</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#44ba84' }} />
                  </button>
                  <button
                    className="flex items-center gap-3 p-2 rounded-lg transition-all group text-left w-full hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                    data-testid="button-enquire-pension"
                    onClick={() => { enquiryMutation.mutate({ productType: "Pension" }); setPensionDialogOpen(false); }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.15)' }}>
                      <Banknote className="w-4 h-4" style={{ color: '#44ba84' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">Pension</h4>
                      <p className="text-xs text-gray-500">Plan for a comfortable retirement</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#44ba84' }} />
                  </button>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-3 rounded-xl border-gray-200"
                  onClick={() => setPensionDialogOpen(false)}
                  data-testid="button-cancel-wealth"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(68,186,132,0.04) 50%, rgba(255,255,255,0.92) 100%)' }}>
              <DialogHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(68,186,132,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <TrendingUp className="w-8 h-8" style={{ color: '#44ba84' }} />
                </div>
                <DialogTitle className="text-xl font-heading font-bold text-gray-900">Wealth & Investment Options</DialogTitle>
                {brokerInfo?.brokerName && (
                  <p className="text-sm font-medium mt-0.5" style={{ color: '#44ba84' }}>
                    {brokerInfo.brokerName.split(' ')[0]} is here to help
                  </p>
                )}
                <DialogDescription className="text-muted-foreground text-sm">
                  If you're reviewing your finances, {brokerInfo?.brokerName ? brokerInfo.brokerName.split(' ')[0] : 'your broker'} can help you explore available options based on your circumstances.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(68,186,132,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(68,186,132,0.1)' }}>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <PiggyBank className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">ISA</h4>
                    <p className="text-xs text-gray-500">A tax-efficient way to save or invest, subject to current rules and allowances</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <TrendingUp className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Investments</h4>
                    <p className="text-xs text-gray-500">A range of investment options that vary in risk and potential returns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <Banknote className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Pension</h4>
                    <p className="text-xs text-gray-500">A long-term savings option designed to support you later in life, subject to pension rules</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Your broker will discuss options with you and provide advice where appropriate. Uprosper does not provide financial advice.
              </p>
              <Button
                className="w-full text-white text-base py-5 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                disabled={enquiryMutation.isPending}
                onClick={() => {
                  enquiryMutation.mutate({ productType: "Wealth Review" });
                  setPensionDialogOpen(false);
                }}
                data-testid="button-enquire-wealth"
              >
                {enquiryMutation.isPending ? "Sending..." : "Speak to Your Broker"}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl border-gray-200"
                onClick={() => setPensionDialogOpen(false)}
                data-testid="button-cancel-wealth"
              >
                Maybe Later
              </Button>
              <p className="text-[10px] text-center text-muted-foreground/70">
                No obligation. Your broker will provide advice based on your circumstances.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mortgage Details Dialog */}
      <Dialog open={mortgageDialogOpen} onOpenChange={setMortgageDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
          {steps.find(s => s.id === 1)?.status === "completed" ? (
            <div style={{ background: 'linear-gradient(135deg, rgba(68,186,132,0.12) 0%, rgba(68,186,132,0.2) 50%, rgba(68,186,132,0.08) 100%)' }}>
              <div className="relative overflow-hidden rounded-t-lg p-4 text-center" style={{ background: 'linear-gradient(135deg, #44ba84 0%, #38a373 50%, #2d8b63 100%)' }}>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${20 + i * 20}%`, top: `${20 + (i % 2) * 30}%` }}
                    animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
                  >
                    <Sparkles className="w-3 h-3 text-white/30" />
                  </motion.div>
                ))}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                </motion.div>
                <DialogHeader className="text-center space-y-0.5">
                  <DialogTitle className="text-xl font-heading font-bold text-white">Mortgage Secured</DialogTitle>
                  <DialogDescription className="text-white/85 text-sm">A major life milestone — congratulations!</DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#44ba84' }}>Manage your mortgage</p>
                <div className="rounded-xl p-2 space-y-2" style={{ background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <button
                    className="flex items-center gap-3 p-2 rounded-lg transition-all group text-left w-full hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                    data-testid="button-enquire-documents"
                    onClick={() => { enquiryMutation.mutate({ productType: "Mortgage Documents" }); setMortgageDialogOpen(false); }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.15)' }}>
                      <FileText className="w-4 h-4" style={{ color: '#44ba84' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">Document Request</h4>
                      <p className="text-xs text-gray-500">Request mortgage documents</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#44ba84' }} />
                  </button>
                  <button
                    className="flex items-center gap-3 p-2 rounded-lg transition-all group text-left w-full hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                    data-testid="button-enquire-moving"
                    onClick={() => { enquiryMutation.mutate({ productType: "Moving House" }); setMortgageDialogOpen(false); }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.15)' }}>
                      <Home className="w-4 h-4" style={{ color: '#44ba84' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">Moving House</h4>
                      <p className="text-xs text-gray-500">Get help with your next move</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#44ba84' }} />
                  </button>
                  <button
                    className="flex items-center gap-3 p-2 rounded-lg transition-all group text-left w-full hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                    data-testid="button-enquire-borrow"
                    onClick={() => { enquiryMutation.mutate({ productType: "Borrow More" }); setMortgageDialogOpen(false); }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.15)' }}>
                      <Banknote className="w-4 h-4" style={{ color: '#44ba84' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">Borrow More</h4>
                      <p className="text-xs text-gray-500">Increase your borrowing</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#44ba84' }} />
                  </button>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-3 rounded-xl border-gray-200"
                  onClick={() => setMortgageDialogOpen(false)}
                  data-testid="button-cancel-mortgage"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(68,186,132,0.04) 50%, rgba(255,255,255,0.92) 100%)' }}>
              <DialogHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(68,186,132,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <span className="text-3xl">🏡</span>
                </div>
                <DialogTitle className="text-xl font-heading font-bold text-gray-900">Thinking About Your Next Property Step?</DialogTitle>
                {brokerInfo?.brokerName && (
                  <p className="text-sm font-medium mt-1" style={{ color: '#44ba84' }}>
                    {brokerInfo.brokerName.split(' ')[0]} is here to help
                  </p>
                )}
                <DialogDescription className="text-muted-foreground">
                  If you're considering your next move, {brokerInfo?.brokerName ? brokerInfo.brokerName.split(' ')[0] : 'your broker'} can help you explore suitable options based on your circumstances.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(68,186,132,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(68,186,132,0.1)' }}>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <Home className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">First Time Buyer</h4>
                    <p className="text-xs text-gray-500">Support from your broker as you navigate buying your first home</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <ArrowRight className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Remortgage</h4>
                    <p className="text-xs text-gray-500">Review your current mortgage and explore available options with your broker</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <TrendingUp className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Buy to Let</h4>
                    <p className="text-xs text-gray-500">Discuss buy-to-let options with your broker based on your goals</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Your broker will discuss options with you and provide advice where appropriate. Uprosper does not provide financial advice.
              </p>
              <Button
                className="w-full text-white text-base py-5 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                disabled={enquiryMutation.isPending}
                onClick={() => {
                  enquiryMutation.mutate({ productType: "Mortgage Enquiry" });
                  setMortgageDialogOpen(false);
                }}
                data-testid="button-enquire-mortgage"
              >
                {enquiryMutation.isPending ? "Sending..." : "Speak to Your Broker"}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl border-gray-200"
                onClick={() => setMortgageDialogOpen(false)}
                data-testid="button-cancel-mortgage"
              >
                Maybe Later
              </Button>
              <p className="text-[10px] text-center text-muted-foreground/70">
                No obligation. Your broker will provide advice based on your circumstances.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Life Insurance Dialog */}
      <Dialog open={lifeInsuranceDialogOpen} onOpenChange={setLifeInsuranceDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
          {steps.find(s => s.id === 3)?.status === "completed" ? (
            <div style={{ background: 'linear-gradient(135deg, rgba(68,186,132,0.12) 0%, rgba(68,186,132,0.2) 50%, rgba(68,186,132,0.08) 100%)' }}>
              <div className="relative overflow-hidden rounded-t-lg p-4 text-center" style={{ background: 'linear-gradient(135deg, #44ba84 0%, #38a373 50%, #2d8b63 100%)' }}>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${20 + i * 20}%`, top: `${20 + (i % 2) * 30}%` }}
                    animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
                  >
                    <Sparkles className="w-3 h-3 text-white/30" />
                  </motion.div>
                ))}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                </motion.div>
                <DialogHeader className="text-center space-y-0.5">
                  <DialogTitle className="text-xl font-heading font-bold text-white">Life Insurance</DialogTitle>
                  <DialogDescription className="text-white/85 text-sm">Well done on getting yourself protected!</DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#44ba84' }}>Your cover</p>
                <div className="rounded-xl p-2" style={{ background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <button
                    className="flex items-center gap-3 p-2 rounded-lg transition-all group text-left w-full hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                    data-testid="button-visit-life-insurance-partner"
                    onClick={() => { toast.success("Redirecting to your life insurance partner portal..."); setLifeInsuranceDialogOpen(false); }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.15)' }}>
                      <ExternalLink className="w-4 h-4" style={{ color: '#44ba84' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">Visit Partner</h4>
                      <p className="text-xs text-gray-500">Access your life insurance partner's client portal</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#44ba84' }} />
                  </button>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-3 rounded-xl border-gray-200"
                  onClick={() => setLifeInsuranceDialogOpen(false)}
                  data-testid="button-cancel-life-insurance"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(68,186,132,0.04) 50%, rgba(255,255,255,0.92) 100%)' }}>
              <DialogHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(68,186,132,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <ShieldCheck className="w-8 h-8" style={{ color: '#44ba84' }} />
                </div>
                <DialogTitle className="text-xl font-heading font-bold text-gray-900">Life & Protection Options</DialogTitle>
                {brokerInfo?.brokerName && (
                  <p className="text-sm font-medium mt-0.5" style={{ color: '#44ba84' }}>
                    {brokerInfo.brokerName.split(' ')[0]} is here to help
                  </p>
                )}
                <DialogDescription className="text-muted-foreground text-sm">
                  If you're considering protection, {brokerInfo?.brokerName ? brokerInfo.brokerName.split(' ')[0] : 'your broker'} can help you explore options based on your circumstances.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(68,186,132,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(68,186,132,0.1)' }}>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <ShieldCheck className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Life Cover</h4>
                    <p className="text-xs text-gray-500">A policy that may provide a payment to beneficiaries depending on the terms of the cover</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <Home className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Mortgage Protection</h4>
                    <p className="text-xs text-gray-500">Cover designed to support mortgage payments in certain circumstances, depending on the policy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <Banknote className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Income Protection</h4>
                    <p className="text-xs text-gray-500">Cover that may provide an income if you're unable to work due to illness or injury, depending on the policy terms</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Your broker will discuss options with you and provide advice where appropriate. Uprosper does not provide financial advice.
              </p>
              <Button
                className="w-full text-white text-base py-5 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                disabled={enquiryMutation.isPending}
                onClick={() => {
                  enquiryMutation.mutate({ productType: "Life Insurance" });
                  setLifeInsuranceDialogOpen(false);
                }}
                data-testid="button-enquire-life-insurance"
              >
                {enquiryMutation.isPending ? "Sending..." : "Speak to Your Broker"}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl border-gray-200"
                onClick={() => setLifeInsuranceDialogOpen(false)}
                data-testid="button-cancel-life-insurance"
              >
                Maybe Later
              </Button>
              <p className="text-[10px] text-center text-muted-foreground/70">
                No obligation. Your broker will provide advice based on your circumstances.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Home Insurance Dialog */}
      <Dialog open={homeInsuranceDialogOpen} onOpenChange={setHomeInsuranceDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
          {steps.find(s => s.id === 2)?.status === "completed" ? (
            <div style={{ background: 'linear-gradient(135deg, rgba(68,186,132,0.12) 0%, rgba(68,186,132,0.2) 50%, rgba(68,186,132,0.08) 100%)' }}>
              <div className="relative overflow-hidden rounded-t-lg p-4 text-center" style={{ background: 'linear-gradient(135deg, #44ba84 0%, #38a373 50%, #2d8b63 100%)' }}>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${20 + i * 20}%`, top: `${20 + (i % 2) * 30}%` }}
                    animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
                  >
                    <Sparkles className="w-3 h-3 text-white/30" />
                  </motion.div>
                ))}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <Home className="w-7 h-7 text-white" />
                  </div>
                </motion.div>
                <DialogHeader className="text-center space-y-0.5">
                  <DialogTitle className="text-xl font-heading font-bold text-white">Home Insurance</DialogTitle>
                  <DialogDescription className="text-white/85 text-sm">Your home is covered — great decision!</DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#44ba84' }}>Your cover</p>
                <div className="rounded-xl p-2" style={{ background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <button
                    className="flex items-center gap-3 p-2 rounded-lg transition-all group text-left w-full hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                    data-testid="button-visit-home-insurance-partner"
                    onClick={() => { toast.success("Redirecting to your home insurance partner portal..."); setHomeInsuranceDialogOpen(false); }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.15)' }}>
                      <ExternalLink className="w-4 h-4" style={{ color: '#44ba84' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">Visit Partner</h4>
                      <p className="text-xs text-gray-500">Access your home insurance partner's client portal</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#44ba84' }} />
                  </button>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-3 rounded-xl border-gray-200"
                  onClick={() => setHomeInsuranceDialogOpen(false)}
                  data-testid="button-cancel-home-insurance"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(68,186,132,0.04) 50%, rgba(255,255,255,0.92) 100%)' }}>
              <DialogHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(68,186,132,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <Home className="w-8 h-8" style={{ color: '#44ba84' }} />
                </div>
                <DialogTitle className="text-xl font-heading font-bold text-gray-900">Protecting Your Home</DialogTitle>
                {brokerInfo?.brokerName && (
                  <p className="text-sm font-medium mt-0.5" style={{ color: '#44ba84' }}>
                    {brokerInfo.brokerName.split(' ')[0]} is here to help
                  </p>
                )}
                <DialogDescription className="text-muted-foreground text-sm">
                  If you're reviewing your home insurance, {brokerInfo?.brokerName ? brokerInfo.brokerName.split(' ')[0] : 'your broker'} can help you explore suitable cover options based on your needs.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(68,186,132,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(68,186,132,0.1)' }}>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <Home className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Buildings Insurance</h4>
                    <p className="text-xs text-gray-500">Cover for the structure of your home against insured risks</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <ShieldCheck className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Contents Insurance</h4>
                    <p className="text-xs text-gray-500">Cover for belongings inside your home against insured risks</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <Sparkles className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Combined Cover</h4>
                    <p className="text-xs text-gray-500">Buildings and contents cover arranged together for convenience</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Your broker will discuss options with you and provide advice where appropriate. Uprosper does not provide financial advice.
              </p>
              <Button
                className="w-full text-white text-base py-5 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                disabled={enquiryMutation.isPending}
                onClick={() => {
                  enquiryMutation.mutate({ productType: "Home Insurance" });
                  setHomeInsuranceDialogOpen(false);
                }}
                data-testid="button-enquire-home-insurance"
              >
                {enquiryMutation.isPending ? "Sending..." : "Speak to Your Broker"}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl border-gray-200"
                onClick={() => setHomeInsuranceDialogOpen(false)}
                data-testid="button-cancel-home-insurance"
              >
                Maybe Later
              </Button>
              <p className="text-[10px] text-center text-muted-foreground/70">
                No obligation. Your broker will provide advice based on your circumstances.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Will & Succession Dialog */}
      <Dialog open={willDialogOpen} onOpenChange={setWillDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
          {steps.find(s => s.id === 5)?.status === "completed" ? (
            <div style={{ background: 'linear-gradient(135deg, rgba(68,186,132,0.12) 0%, rgba(68,186,132,0.2) 50%, rgba(68,186,132,0.08) 100%)' }}>
              <div className="relative overflow-hidden rounded-t-lg p-4 text-center" style={{ background: 'linear-gradient(135deg, #44ba84 0%, #38a373 50%, #2d8b63 100%)' }}>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${20 + i * 20}%`, top: `${20 + (i % 2) * 30}%` }}
                    animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
                  >
                    <Sparkles className="w-3 h-3 text-white/30" />
                  </motion.div>
                ))}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <ScrollText className="w-7 h-7 text-white" />
                  </div>
                </motion.div>
                <DialogHeader className="text-center space-y-0.5">
                  <DialogTitle className="text-xl font-heading font-bold text-white">Will & Succession</DialogTitle>
                  <DialogDescription className="text-white/85 text-sm">Your legacy is secure — peace of mind for you and your family.</DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#44ba84' }}>Your estate planning</p>
                <div className="rounded-xl p-2" style={{ background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <button
                    className="flex items-center gap-3 p-2 rounded-lg transition-all group text-left w-full hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                    data-testid="button-visit-will-partner"
                    onClick={() => { toast.success("Redirecting to your estate planning partner portal..."); setWillDialogOpen(false); }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.15)' }}>
                      <ExternalLink className="w-4 h-4" style={{ color: '#44ba84' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">Visit Partner</h4>
                      <p className="text-xs text-gray-500">Access our estate planning partner's client portal</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#44ba84' }} />
                  </button>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-3 rounded-xl border-gray-200"
                  onClick={() => setWillDialogOpen(false)}
                  data-testid="button-cancel-will"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(68,186,132,0.04) 50%, rgba(255,255,255,0.92) 100%)' }}>
              <DialogHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(68,186,132,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <ScrollText className="w-8 h-8" style={{ color: '#44ba84' }} />
                </div>
                <DialogTitle className="text-xl font-heading font-bold text-gray-900">Wills & Estate Planning</DialogTitle>
                {brokerInfo?.brokerName && (
                  <p className="text-sm font-medium mt-0.5" style={{ color: '#44ba84' }}>
                    {brokerInfo.brokerName.split(' ')[0]} is here to help
                  </p>
                )}
                <DialogDescription className="text-muted-foreground text-sm">
                  If you're planning ahead, {brokerInfo?.brokerName ? brokerInfo.brokerName.split(' ')[0] : 'your broker'} can help connect you with appropriate estate planning services.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(68,186,132,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(68,186,132,0.1)' }}>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <ScrollText className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Write a Will</h4>
                    <p className="text-xs text-gray-500">Create or update a will to set out how your estate may be handled</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <FileText className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Estate Planning</h4>
                    <p className="text-xs text-gray-500">Explore options for organising your estate and financial affairs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(68,186,132,0.1)' }}>
                    <ShieldCheck className="w-4 h-4" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Lasting Power of Attorney</h4>
                    <p className="text-xs text-gray-500">Set up arrangements for someone to make decisions on your behalf if needed</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Your broker can connect you with third-party estate planning providers. Uprosper does not provide legal or financial advice.
              </p>
              <Button
                className="w-full text-white text-base py-5 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                disabled={enquiryMutation.isPending}
                onClick={() => {
                  enquiryMutation.mutate({ productType: "Will & Succession" });
                  setWillDialogOpen(false);
                }}
                data-testid="button-enquire-will"
              >
                {enquiryMutation.isPending ? "Sending..." : "Speak to Your Broker"}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl border-gray-200"
                onClick={() => setWillDialogOpen(false)}
                data-testid="button-cancel-will"
              >
                Maybe Later
              </Button>
              <p className="text-[10px] text-center text-muted-foreground/70">
                No obligation. Your broker can help connect you with appropriate services.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Investment ISA Dialog */}
      <Dialog open={isaDialogOpen} onOpenChange={setIsaDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-primary">
              <TrendingUp className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-heading font-bold text-gray-900">Open Your Investment ISA</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Start building your wealth with an Investment ISA. Your exclusive Uprosper code is automatically applied.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className="w-full bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
              <p className="text-xs text-muted-foreground text-center mb-2">Your exclusive code</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-primary">UPROSPER-ISA-2024</span>
                <button 
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-md hover:bg-primary/10 transition-colors"
                  data-testid="button-copy-isa-code"
                >
                  {codeCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-primary" />}
                </button>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground mb-4">
              This code gives you reduced fees and a bonus contribution when you open your ISA.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsaDialogOpen(false)}
              data-testid="button-cancel-isa"
            >
              Maybe Later
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                toast.success("Redirecting to ISA application...");
                setIsaDialogOpen(false);
              }}
              data-testid="button-open-isa"
            >
              Open ISA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-full relative z-10">
      <div className="relative z-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-5 pl-2 md:pl-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">Your Homeowner Journey</h2>
          <p className="text-muted-foreground mt-1">Track your financial milestones.</p>
          <div className="md:hidden mt-4">
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full inline-block"
              style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.2)' }}
              data-testid="text-level-unlocked-mobile"
            >
              Level {completedCount + 1} Unlocked
            </span>
          </div>
        </div>
        <div
          className="hidden md:block text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.2)' }}
          data-testid="text-level-unlocked"
        >
          Level {completedCount + 1} Unlocked
        </div>
      </div>

      <div className="relative rounded-2xl p-2 md:p-2.5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4 relative md:items-stretch">
          {steps.map((step, index) => {
            const isCompleted = step.status === "completed";
            const isCurrent = step.status === "current";
            const isLocked = step.status === "locked";
            const isAvailable = step.status === "available";
            const isLastStep = index === steps.length - 1;
            const nextStepCompleted = index < steps.length - 1 && steps[index + 1]?.status === "completed";
            
            return (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative flex md:flex-col items-start md:items-center gap-4 md:gap-3 p-5 md:p-5 md:h-[320px] rounded-2xl transition-all duration-300 overflow-visible",
                  isCurrent ? "scale-105" : "",
                  isAvailable && !isCompleted && "scale-105 opacity-100",
                  !isCurrent && !isCompleted && !isAvailable && "opacity-50",
                  step.title === "Mortgage Secured" && isCompleted && "cursor-pointer"
                )}
                style={{
                  background: 'rgba(255, 255, 255, 0.55)',
                  border: isCompleted
                    ? '1.5px solid #2E8B63'
                    : (isAvailable || isCurrent)
                      ? '1.5px solid rgba(46, 139, 99, 0.55)'
                      : '1px solid rgba(150,150,150,0.35)',
                  borderRadius: '1rem',
                  boxShadow: isCompleted
                    ? 'inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 8px rgba(46, 139, 99, 0.18)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.6)',
                }}
                data-testid={`journey-step-${step.id}`}
                onClick={() => {
                  if (step.title === "Mortgage Secured" && isCompleted) {
                    setLocation("/mortgage");
                  }
                }}
              >
                <div className="hidden md:flex md:flex-col md:items-center md:text-center md:order-1 md:w-full">
                  {stepTheme[step.title] && (() => {
                    const TopicIcon = stepTheme[step.title].Icon;
                    return (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-2"
                        style={{ background: stepTheme[step.title].chipBg, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}
                        data-testid={`icon-topic-${step.id}`}
                        aria-hidden="true"
                      >
                        <TopicIcon className="w-4 h-4" style={{ color: stepTheme[step.title].chipText }} />
                      </div>
                    );
                  })()}
                  <h3
                    className="font-bold text-sm md:text-base leading-tight text-gray-900 break-words"
                    data-testid={`text-step-title-top-${step.id}`}
                  >
                    {step.title === "Mortgage Secured" && !isCompleted ? "Mortgage Options" : step.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                    {(isCurrent || isAvailable) && !isCompleted ? "Available to explore" : step.date}
                  </p>
                  {stepTheme[step.title]?.subtitle && (
                    <div
                      className="mt-2 px-2.5 py-2 rounded-lg w-full min-h-[64px] flex items-center justify-center"
                      style={{
                        background: stepTheme[step.title].subtitleBg,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                      }}
                    >
                      <p
                        className="text-[11px] text-gray-700 leading-snug text-center"
                        data-testid={`text-step-subtitle-${step.id}`}
                      >
                        {stepTheme[step.title].subtitle}
                      </p>
                    </div>
                  )}
                </div>

                {(() => {
                  const prevStepCompleted = index > 0 && steps[index - 1]?.status === "completed";
                  const hasIncomingConnector = isCompleted && prevStepCompleted;
                  const splashDelay = (index - 1) * 0.1 + 0.2 + 0.5;
                  const splashParticles = [
                    { x: -22, y: -22, size: 8 },
                    { x: 22, y: -16, size: 7 },
                    { x: -26, y: 14, size: 6 },
                    { x: 20, y: 22, size: 8 },
                    { x: -8, y: -28, size: 6 },
                    { x: 28, y: 4, size: 7 },
                    { x: -16, y: 26, size: 5 },
                    { x: 6, y: 28, size: 6 },
                  ];
                  return (
                    <div
                      className="absolute top-3 right-3 shrink-0 z-10 md:static md:order-2 md:flex-1 md:flex md:flex-col md:items-center md:justify-center md:my-2"
                      data-testid={`circle-trigger-${step.id}`}
                    >
                      <div className="relative">
                      <motion.div
                        className={cn(
                          "relative z-[2] flex items-center justify-center rounded-full transition-all duration-200 w-7 h-7 md:w-8 md:h-8",
                          isLocked && "bg-white/60 text-gray-400 border border-gray-300"
                        )}
                        style={
                          isCompleted
                            ? {
                                background: '#2E8B63',
                                color: '#ffffff',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(46,139,99,0.35)',
                              }
                            : isCurrent
                              ? {
                                  background: '#ffffff',
                                  color: '#2E8B63',
                                  boxShadow: 'inset 0 0 0 2px #2E8B63, 0 2px 6px rgba(46,139,99,0.25)',
                                }
                              : isAvailable
                                ? {
                                    background: '#ffffff',
                                    color: '#2E8B63',
                                    boxShadow: 'inset 0 0 0 2px #2E8B63, 0 1px 3px rgba(0,0,0,0.05)',
                                  }
                                : undefined
                        }
                        initial={
                          isCompleted && animateProgress && step.id === newlyCompletedStepId ? { scale: 0 } :
                          hasIncomingConnector ? { scale: 0.85 } :
                          { scale: 1 }
                        }
                        animate={{ scale: 1 }}
                        transition={
                          isCompleted && animateProgress && step.id === newlyCompletedStepId ? { type: "spring", stiffness: 300, damping: 15, delay: 0.5 } :
                          hasIncomingConnector ? { type: "spring", stiffness: 400, damping: 10, delay: splashDelay } :
                          {}
                        }
                      >
                        {isCompleted ? (
                          <motion.div
                            initial={animateProgress && step.id === newlyCompletedStepId ? { opacity: 0, rotate: -90 } : { opacity: 1, rotate: 0 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            transition={animateProgress && step.id === newlyCompletedStepId ? { delay: 0.7, duration: 0.3 } : {}}
                          >
                            <Check className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
                          </motion.div>
                        ) :
                         isCurrent ? <Circle className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" /> :
                         isAvailable ? <Circle className="w-4 h-4 md:w-5 md:h-5" /> :
                         <Lock className="w-4 h-4 md:w-5 md:h-5" />}
                      </motion.div>
                      </div>
                      {hasIncomingConnector && splashParticles.map((particle, i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full bg-green-400 pointer-events-none"
                          style={{
                            width: particle.size,
                            height: particle.size,
                            top: '50%',
                            left: '50%',
                            marginTop: -particle.size / 2,
                            marginLeft: -particle.size / 2,
                          }}
                          initial={{ opacity: 0, x: 0, y: 0, scale: 1 }}
                          animate={{
                            opacity: [0, 0.9, 0],
                            x: [0, particle.x],
                            y: [0, particle.y],
                            scale: [0.5, 1, 0],
                          }}
                          transition={{
                            duration: 0.8,
                            delay: splashDelay + i * 0.03,
                            ease: "easeOut",
                          }}
                        />
                      ))}
                    </div>
                  );
                })()}
                
                <div className="md:text-center md:order-3 md:w-full md:flex md:flex-col md:items-center">
                  {stepTheme[step.title] && (() => {
                    const TopicIcon = stepTheme[step.title].Icon;
                    return (
                      <div
                        className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-2"
                        style={{ background: stepTheme[step.title].chipBg, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}
                        aria-hidden="true"
                      >
                        <TopicIcon className="w-4 h-4" style={{ color: stepTheme[step.title].chipText }} />
                      </div>
                    );
                  })()}
                  <h3 className="md:hidden font-bold text-base leading-tight text-gray-900" data-testid={`text-step-title-${step.id}`}>
                    {step.title === "Mortgage Secured" && !isCompleted ? "Mortgage Options" : step.title}
                  </h3>
                  <p className="md:hidden text-xs text-muted-foreground mt-1">
                    {(isCurrent || isAvailable) && !isCompleted ? "Available to explore" : step.date}
                  </p>
                  {stepTheme[step.title]?.subtitle && (
                    <div
                      className="md:hidden mt-2 px-2.5 py-1.5 rounded-lg max-w-[260px]"
                      style={{
                        background: stepTheme[step.title].subtitleBg,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                      }}
                    >
                      <p className="text-[11px] text-gray-700 leading-snug">
                        {stepTheme[step.title].subtitle}
                      </p>
                    </div>
                  )}
                  
                  {step.title === "Mortgage Secured" && isCompleted && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-mortgage-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMortgageDialogOpen(true);
                      }}
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {step.title === "Mortgage Secured" && !isCompleted && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-mortgage-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMortgageDialogOpen(true);
                      }}
                    >
                      Book a call <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  
                  {step.title === "Life Insurance" && isCompleted && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-life-insurance-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLifeInsuranceDialogOpen(true);
                      }}
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  
                  {step.title === "Home Insurance" && isCompleted && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-home-insurance-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHomeInsuranceDialogOpen(true);
                      }}
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  
                  {isCurrent && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-start-step"
                      onClick={() => step.title === "Wealth Review" ? setPensionDialogOpen(true) : setIsaDialogOpen(true)}
                    >
                      Book a call <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  
                  
                  {step.title === "Home Insurance" && isAvailable && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-start-home-insurance"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHomeInsuranceDialogOpen(true);
                      }}
                    >
                      Book a call <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  
                  {step.title === "Life Insurance" && isAvailable && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-start-life-insurance"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLifeInsuranceDialogOpen(true);
                      }}
                    >
                      Book a call <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  
                  {step.title === "Wealth Review" && step.status === "available" && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-start-wealth-review"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPensionDialogOpen(true);
                      }}
                    >
                      Book a call <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  
                  {step.title === "Wealth Review" && isCompleted && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-wealth-review-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPensionDialogOpen(true);
                      }}
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  
                  {step.title === "Will & Succession" && step.status === "available" && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-start-will-succession"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWillDialogOpen(true);
                      }}
                    >
                      Book a call <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  
                  {step.title === "Will & Succession" && isCompleted && (
                    <button 
                      className="mt-3 text-xs font-bold text-white px-4 py-1.5 rounded-full inline-flex items-center gap-1 transition-all duration-300 min-w-[90px] justify-center hover:scale-[1.05] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 6px rgba(68,186,132,0.25)' }} 
                      data-testid="button-will-succession-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWillDialogOpen(true);
                      }}
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {isLocked && (
                    <button
                      type="button"
                      disabled
                      className="mt-3 text-xs font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-1 min-w-[90px] justify-center cursor-not-allowed"
                      style={{ background: 'rgba(229,231,235,0.7)', color: '#9ca3af', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)' }}
                      data-testid={`button-locked-${step.id}`}
                    >
                      <Lock className="w-3 h-3" /> Locked
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
    </div>
    </>
  );
}
