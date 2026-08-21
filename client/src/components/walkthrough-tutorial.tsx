import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react";

const TUTORIAL_KEY_PREFIX = "uprosper_tutorial_completed_";

function getTutorialKey(userId?: string) {
  return `${TUTORIAL_KEY_PREFIX}${userId || "anonymous"}`;
}

interface TutorialStep {
  target: string;
  title: string;
  description: string;
  noSpotlight?: boolean;
}

const steps: TutorialStep[] = [
  {
    target: "#welcome-header-section",
    title: "Welcome to Uprosper! 👋",
    description: "This is your dashboard home. You can see your financial health at a glance and who your mortgage broker is.",
    noSpotlight: true,
  },
  {
    target: '[data-testid="button-contact-broker"]',
    title: "Contact Your Broker",
    description: "Need help or have a question? Tap here to message your mortgage broker directly.",
  },
  {
    target: "#notification-panel-section",
    title: "Notification Panel",
    description: "All your updates, messages, meeting invitations, and reward notifications appear here. Stay on top of everything!",
  },
  {
    target: "#financial-journey-section",
    title: "Your Homeowner Journey",
    description: "Track your mortgage milestones step by step. As you progress, you'll unlock new financial products and earn rewards.",
  },
  {
    target: "#mortgage-calculator-section",
    title: "Mortgage Calculator",
    description: "Use this handy tool to estimate your monthly mortgage payments. Adjust the amount, rate, and term to see what works for you.",
  },
  {
    target: "#rewards-offers-section",
    title: "Rewards & Deals",
    description: "Earn rewards from your broker and access exclusive homeowner deals from top UK brands like IKEA, B&Q, and more!",
  },
  {
    target: "#refer-a-friend",
    title: "Refer a Friend",
    description: "Share your unique referral code with friends looking for mortgage advice. You'll both receive exclusive rewards when they join!",
  },
];

interface WalkthroughTutorialProps {
  forceStart?: boolean;
  onComplete?: () => void;
  userId?: string;
  delayMs?: number;
  disabled?: boolean;
}

export function WalkthroughTutorial({ forceStart, onComplete, userId, delayMs = 5000, disabled = false }: WalkthroughTutorialProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (forceStart && !disabled) {
      setCurrentStep(0);
      setIsActive(true);
    }
  }, [forceStart, disabled]);

  useEffect(() => {
    if (disabled) return;
    const key = getTutorialKey(userId);
    const completed = localStorage.getItem(key);
    if (!completed && !forceStart) {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsActive(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }
  }, [forceStart, userId, delayMs, disabled]);

  const updatePositions = useCallback(() => {
    if (!isActive) return;
    const step = steps[currentStep];
    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setSpotlightRect(rect);

    const tooltipWidth = Math.min(340, window.innerWidth - 32);
    const gap = 16;
    const estimatedTooltipHeight = 220;

    const currentStepData = steps[currentStep];

    if (currentStepData.noSpotlight) {
      const top = Math.max(80, (window.innerHeight - estimatedTooltipHeight) / 3);
      const left = (window.innerWidth - tooltipWidth) / 2;
      setTooltipStyle({ top, left, width: tooltipWidth });
      return;
    }

    let top: number;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow > estimatedTooltipHeight + gap) {
      top = rect.bottom + gap;
    } else if (spaceAbove > estimatedTooltipHeight + gap) {
      top = rect.top - estimatedTooltipHeight - gap;
    } else {
      top = Math.max(16, (window.innerHeight - estimatedTooltipHeight) / 2);
    }

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    setTooltipStyle({ top, left, width: tooltipWidth });
  }, [isActive, currentStep]);

  useEffect(() => {
    if (!isActive) return;
    const step = steps[currentStep];
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(updatePositions, 500);
    }

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePositions);
    };
    const handleResize = () => updatePositions();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, currentStep, updatePositions]);

  const completeTutorial = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(getTutorialKey(userId), "true");
    onComplete?.();
  }, [onComplete, userId]);

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isActive) return null;

  const step = steps[currentStep];
  const padding = 8;
  const showSpotlight = !step.noSpotlight && spotlightRect;

  return (
    <>
      <svg
        className="fixed inset-0 z-[9998] w-full h-full"
        style={{ pointerEvents: "auto" }}
        onClick={completeTutorial}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {showSpotlight && (
              <rect
                x={spotlightRect.left - padding}
                y={spotlightRect.top - padding}
                width={spotlightRect.width + padding * 2}
                height={spotlightRect.height + padding * 2}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.5)"
          mask="url(#tutorial-spotlight-mask)"
        />
        {showSpotlight && (
          <rect
            x={spotlightRect.left - padding}
            y={spotlightRect.top - padding}
            width={spotlightRect.width + padding * 2}
            height={spotlightRect.height + padding * 2}
            rx="16"
            ry="16"
            fill="none"
            stroke="rgba(68,186,132,0.5)"
            strokeWidth="2"
          />
        )}
      </svg>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[9999]"
          style={tooltipStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-2xl p-5 shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.97)",
              border: "1px solid rgba(68,186,132,0.2)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "#44ba84" }}
                >
                  {currentStep + 1}
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {currentStep + 1} of {steps.length}
                </span>
              </div>
              <button
                onClick={completeTutorial}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 -mt-1"
                data-testid="button-tutorial-skip"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-heading font-bold text-gray-900 text-base mb-1.5">
              {step.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {step.description}
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={completeTutorial}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium"
                data-testid="button-tutorial-skip-text"
              >
                Skip Tutorial
              </button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={goPrev}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.03]"
                    style={{
                      color: "#44ba84",
                      background: "rgba(68,186,132,0.08)",
                      border: "1px solid rgba(68,186,132,0.2)",
                    }}
                    data-testid="button-tutorial-prev"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:brightness-110"
                  style={{
                    background: "#44ba84",
                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)",
                  }}
                  data-testid="button-tutorial-next"
                >
                  {currentStep === steps.length - 1 ? "Got it!" : "Next"}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-1.5 mt-3">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === currentStep ? 20 : 6,
                    background: i === currentStep ? "#44ba84" : "rgba(68,186,132,0.2)",
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export function TutorialHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110 hover:brightness-110"
      style={{
        background: "#44ba84",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), 0 4px 16px rgba(68,186,132,0.35)",
      }}
      data-testid="button-tutorial-help"
    >
      <HelpCircle className="w-6 h-6" />
    </button>
  );
}
