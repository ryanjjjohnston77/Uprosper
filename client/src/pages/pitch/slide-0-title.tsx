export default function Slide0Title() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-3 liquid-glass-sm px-5 py-2.5 rounded-full mb-2">
          <img src="/logo.png" alt="Uprosper" className="h-6 w-6" />
          <span className="text-sm font-semibold text-gray-700">Investor Pitch Deck</span>
        </div>

        <h1 className="text-6xl md:text-7xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500" data-testid="text-slide-title">
          Uprosper
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
          Turning One-Time Mortgages Into Lifelong Client Relationships
        </p>

        <div className="flex items-center justify-center gap-3 pt-4">
          <div className="liquid-glass-sm px-4 py-2 rounded-full">
            <span className="text-xs text-muted-foreground">Pre-Seed · 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
