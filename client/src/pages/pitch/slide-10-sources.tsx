import { BookOpen } from "lucide-react";

export default function Slide10Sources() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-700">Appendix</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900" data-testid="text-slide-title">
            Sources
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            References and data sources supporting this presentation
          </p>
        </div>

        <div className="liquid-glass p-8 relative" data-testid="card-sources">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-transparent to-slate-50/20 pointer-events-none rounded-[1.25rem]" />
          <div className="relative space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-sm font-semibold text-gray-900 shrink-0">*</span>
              <div>
                <p className="text-sm text-gray-700">Customer acquisition vs. retention costs</p>
                <a href="https://www.optimove.com/resources/learning-center/customer-acquisition-vs-retention-costs" target="_blank" rel="noopener noreferrer" className="text-xs break-all" style={{ color: '#44ba84' }}>
                  optimove.com/resources/learning-center/customer-acquisition-vs-retention-costs
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm font-semibold text-gray-900 shrink-0">*</span>
              <div>
                <p className="text-sm text-gray-700">Industry retention rate (~30%) — MPA Magazine, 2024</p>
                <a href="https://www.mpamag.com/uk/mortgage-industry/technology/homeowners-mistrust-ai-and-this-brokers-935-retention-rate-proves-why/517335" target="_blank" rel="noopener noreferrer" className="text-xs break-all" style={{ color: '#44ba84' }}>
                  mpamag.com/uk/mortgage-industry/technology/homeowners-mistrust-ai-and-this-brokers-935-retention-rate-proves-why/517335
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm font-semibold text-gray-900 shrink-0">*</span>
              <div>
                <p className="text-sm text-gray-700">Online platform growth (10.2% CAGR) — Mordor Intelligence</p>
                <a href="https://www.mordorintelligence.com/industry-reports/uk-mortgage-loan-broker-market" target="_blank" rel="noopener noreferrer" className="text-xs break-all" style={{ color: '#44ba84' }}>
                  mordorintelligence.com/industry-reports/uk-mortgage-loan-broker-market
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
