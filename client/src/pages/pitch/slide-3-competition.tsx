import { Target, CircleDot } from "lucide-react";

const competitors = [
  {
    category: "Broker CRMs",
    companies: "Revolution, Mortgage Brain",
    gap: "No post-completion engagement layer",
  },
  {
    category: "Generic CRMs",
    companies: "HubSpot, Salesforce",
    gap: "Not built for mortgage lifecycle or client retention",
  },
  {
    category: "Mortgage Monitoring",
    companies: "Dashly",
    gap: "Broker not central — client reminders only",
  },
  {
    category: "Property Platforms",
    companies: "OneDome, Trussle",
    gap: "Disintermediate the broker relationship",
  },
  {
    category: "Fintechs",
    companies: "Habito, Sprive",
    gap: "High acquisition cost, no broker channel",
  },
];

export default function Slide3Competition() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 liquid-glass-sm px-4 py-2 rounded-full mb-5">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-gray-700">Competitive Landscape</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3" data-testid="text-slide-title">
          A New
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> Category</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Existing tools manage the mortgage transaction. Uprosper manages the lifetime relationship.
        </p>
      </div>

      <div className="w-full max-w-5xl liquid-glass overflow-hidden" data-testid="card-competition-table">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-teal-50/10 pointer-events-none rounded-[1.25rem]" />
        <table className="w-full relative">
          <thead>
            <tr className="border-b border-gray-200/60">
              <th className="text-left py-4 px-5 text-xs font-bold uppercase tracking-wider text-gray-500">Category</th>
              <th className="text-left py-4 px-5 text-xs font-bold uppercase tracking-wider text-gray-500">Companies</th>
              <th className="text-left py-4 px-5 text-xs font-bold uppercase tracking-wider text-gray-500">Market Gap</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={i} className="border-b border-gray-100/60 last:border-b-0" data-testid={`row-competitor-${i}`}>
                <td className="py-3.5 px-5">
                  <span className="text-sm font-semibold text-gray-900">{c.category}</span>
                </td>
                <td className="py-3.5 px-5">
                  <span className="text-sm text-gray-600">{c.companies}</span>
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex items-start gap-2">
                    <CircleDot className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{c.gap}</span>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-primary/5" data-testid="row-uprosper">
              <td className="py-4 px-5">
                <span className="text-sm font-bold text-primary">Loyalty Platform</span>
              </td>
              <td className="py-4 px-5">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Uprosper
                </span>
              </td>
              <td className="py-4 px-5">
                <span className="text-sm font-semibold text-primary">Retention + referrals + rewards</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="liquid-glass-sm mt-5 px-5 py-3 rounded-2xl max-w-5xl w-full flex items-start gap-3" data-testid="pill-category">
        <div className="p-1.5 rounded-lg bg-primary/10 shrink-0 mt-0.5">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="font-semibold text-gray-900">We're not a CRM, a lead generator, or a mortgage broker.</span> Uprosper is the first Mortgage Client Loyalty Platform — purpose-built for retention, engagement, and referrals.
        </p>
      </div>
    </div>
  );
}
