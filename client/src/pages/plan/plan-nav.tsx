import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const TOTAL_PAGES = 21;

interface PlanNavProps {
  pageNum: number;
}

export default function PlanNav({ pageNum }: PlanNavProps) {
  const [, setLocation] = useLocation();
  const isFirst = pageNum === 1;
  const isLast = pageNum === TOTAL_PAGES;

  return (
    <div className="sticky bottom-0 left-0 right-0 px-6 z-10 py-[10px]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            className={`liquid-glass-sm gap-2 rounded-xl px-4 py-2 text-sm font-medium flex items-center transition-colors ${isFirst ? "opacity-50 cursor-not-allowed" : "hover:bg-[#44ba84]/10"}`}
            disabled={isFirst}
            onClick={() => !isFirst && setLocation(`/plan/${pageNum - 1}`)}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <div className="liquid-glass-sm flex items-center gap-2 px-4 py-2 rounded-full">
            <span className="text-xs font-semibold" style={{ color: '#44ba84' }}>{pageNum}</span>
            <div className="w-16 h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(pageNum / TOTAL_PAGES) * 100}%`, background: '#44ba84' }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-400">{TOTAL_PAGES}</span>
          </div>
          {isLast ? (
            <button
              className="gap-2 rounded-xl px-4 py-2 text-sm font-medium flex items-center transition-colors text-white"
              style={{ background: '#44ba84' }}
              onClick={() => setLocation("/plan/1")}
              data-testid="button-next-page"
            >
              Restart
            </button>
          ) : (
            <button
              className="gap-2 rounded-xl px-4 py-2 text-sm font-medium flex items-center transition-colors text-white"
              style={{ background: '#44ba84' }}
              onClick={() => setLocation(`/plan/${pageNum + 1}`)}
              data-testid="button-next-page"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-center text-[10px] text-gray-400 pt-2">© Uprosper 2026</p>
      </div>
    </div>
  );
}
