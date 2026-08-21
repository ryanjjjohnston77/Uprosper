import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Home, Rocket, BookOpen } from "lucide-react";
import { MAIN_SLIDE_COUNT, ALL_SLIDES } from "./pitch-config";

interface PitchSlideWrapperProps {
  slideIndex: number;
  children: React.ReactNode;
}

export default function PitchSlideWrapper({ slideIndex, children }: PitchSlideWrapperProps) {
  const [, setLocation] = useLocation();
  const isAppendix = slideIndex >= MAIN_SLIDE_COUNT;
  const slideNum = slideIndex + 1;
  const isFirst = slideIndex === 0;
  const isLastMain = slideIndex === MAIN_SLIDE_COUNT - 1;
  const isLastAll = slideIndex === ALL_SLIDES.length - 1;

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid={`pitch-slide-${slideNum}`}>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-green-100/30 via-emerald-50/15 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col min-h-screen">
        <div id="pitch-slide-content">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              {!isFirst && (
                <button onClick={() => setLocation(`/pitch/${slideNum - 1}`)} className="liquid-glass-sm px-3 py-1.5 rounded-full hover:bg-[#44ba84]/10 transition-colors" data-testid="button-top-prev">
                  <ChevronLeft className="h-4 w-4" style={{ color: '#44ba84' }} />
                </button>
              )}
              {!isLastAll && (
                <button onClick={() => setLocation(`/pitch/${slideNum + 1}`)} className="liquid-glass-sm px-3 py-1.5 rounded-full hover:bg-[#44ba84]/10 transition-colors" data-testid="button-top-next">
                  <ChevronRight className="h-4 w-4" style={{ color: '#44ba84' }} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="liquid-glass-sm px-4 py-1.5 rounded-full">
                {isAppendix ? (
                  <span className="text-xs font-semibold" style={{ color: '#44ba84' }}>Appendix</span>
                ) : (
                  <span className="text-xs font-semibold" style={{ color: '#44ba84' }}>{slideNum} / {MAIN_SLIDE_COUNT}</span>
                )}
              </div>
              <button onClick={() => setLocation("/")} className="liquid-glass-sm px-3 py-1.5 rounded-full hover:bg-[#44ba84]/10 transition-colors" data-testid="button-home">
                <Home className="h-4 w-4" style={{ color: '#44ba84' }} />
              </button>
            </div>
          </div>

          {children}
        </div>

        <div className="flex items-center justify-between pt-6 pb-4">
          <button
            className={`liquid-glass-sm gap-2 rounded-xl px-4 py-2 text-sm font-medium flex items-center transition-colors ${isFirst ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/10"}`}
            disabled={isFirst}
            onClick={() => !isFirst && setLocation(`/pitch/${slideNum - 1}`)}
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <div className="liquid-glass-sm flex gap-1.5 px-3 py-2 rounded-full">
            {Array.from({ length: MAIN_SLIDE_COUNT }, (_, i) => (
              <button
                key={i}
                onClick={() => setLocation(`/pitch/${i + 1}`)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === slideIndex ? "w-8 backdrop-blur-sm shadow-sm" : "w-2 bg-gray-300/60 hover:bg-gray-400/60"
                }`}
                style={i === slideIndex ? { background: '#44ba84' } : undefined}
                data-testid={`dot-slide-${i + 1}`}
              />
            ))}
          </div>
          {isAppendix ? (
            <button
              className="gap-2 rounded-xl px-4 py-2 text-sm font-medium flex items-center transition-colors text-white"
              style={{ background: '#44ba84' }}
              onClick={() => setLocation("/pitch/1")}
              data-testid="button-next-slide"
            >
              <Rocket className="h-4 w-4" /> Restart Deck
            </button>
          ) : isLastMain ? (
            <button
              className="gap-2 rounded-xl px-4 py-2 text-sm font-medium flex items-center transition-colors text-white"
              style={{ background: '#44ba84' }}
              onClick={() => setLocation(`/pitch/${MAIN_SLIDE_COUNT + 1}`)}
              data-testid="button-next-slide"
            >
              <BookOpen className="h-4 w-4" /> Appendix
            </button>
          ) : (
            <button
              className="gap-2 rounded-xl px-4 py-2 text-sm font-medium flex items-center transition-colors text-white"
              style={{ background: '#44ba84' }}
              onClick={() => setLocation(`/pitch/${slideNum + 1}`)}
              data-testid="button-next-slide"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-center text-[10px] text-gray-400 pb-2">© Uprosper 2026</p>
      </div>
    </div>
  );
}
