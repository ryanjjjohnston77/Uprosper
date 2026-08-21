import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, TrendingUp, Users, BarChart3,
  Target, ArrowUpRight, Repeat, CheckCircle2, Rocket, Home
} from "lucide-react";

export default function Slide6Traction() {
  const [, setLocation] = useLocation();
  const keyMetrics = [
    { label: "Client Retention Rate", value: "94%", change: "+32%", icon: Repeat, description: "vs. industry avg 62%" },
    { label: "Broker Onboarded", value: "120+", change: "+40%", icon: Users, description: "MoM growth rate" },
    { label: "Mortgages Tracked", value: "£48M", change: "+25%", icon: BarChart3, description: "Total portfolio value" },
    { label: "Cross-sell Conversion", value: "38%", change: "+18%", icon: Target, description: "Journey step completion" },
  ];

  const milestones = [
    { date: "Q1 2025", title: "Platform Launch", description: "MVP launched with core client-broker features", completed: true },
    { date: "Q2 2025", title: "Company Tier Added", description: "Enterprise dashboard for mortgage companies", completed: true },
    { date: "Q3 2025", title: "100 Brokers Onboarded", description: "Hit first major broker adoption milestone", completed: true },
    { date: "Q4 2025", title: "Insurance Partnerships", description: "FCA-regulated referral partnerships signed", completed: true },
    { date: "Q1 2026", title: "1,000 Brokers Target", description: "Scale broker network across UK regions", completed: false },
    { date: "Q2 2026", title: "Series A Readiness", description: "Hit £500K ARR and prepare for Series A", completed: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex flex-col" data-testid="slide-6-traction">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-teal-100/30 via-cyan-50/15 to-transparent rounded-full blur-3xl" />
      </div>

      <div id="pitch-slide-content">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-logo-home">
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-primary/10 backdrop-blur-sm text-primary text-sm font-semibold" data-testid="slide-number-pill">
              9 / 12
            </div>
            <button onClick={() => setLocation("/")} className="px-3 py-1.5 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-colors" data-testid="button-home">
              <Home className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-5xl space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Growth Metrics</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900" data-testid="text-slide-title">
                Traction & Milestones
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Strong early indicators validating product-market fit and scalable growth
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {keyMetrics.map((metric, index) => (
                <div key={index} className="liquid-glass p-5 relative group hover:scale-[1.02] transition-all" data-testid={`card-metric-${index}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-teal-50/20 pointer-events-none rounded-[1.25rem]" />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
                        <metric.icon className="h-4 w-4 text-primary" />
                      </div>
                      <Badge className="border-0 bg-green-100 text-green-700 hover:bg-green-100 text-xs gap-1">
                        <ArrowUpRight className="h-3 w-3" />{metric.change}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-2xl font-heading font-bold text-gray-900">{metric.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
                      <p className="text-[10px] text-primary/70 mt-1">{metric.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="liquid-glass p-6 relative" data-testid="card-milestones">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 via-transparent to-emerald-50/15 pointer-events-none rounded-[1.25rem]" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-gray-900">Milestone Roadmap</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {milestones.map((milestone, i) => (
                    <div
                      key={i}
                      className={`liquid-glass-sm p-4 hover:scale-[1.01] transition-all ${!milestone.completed ? 'opacity-75' : ''}`}
                      data-testid={`card-milestone-${i}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${milestone.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {milestone.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Target className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{milestone.date}</Badge>
                            {!milestone.completed && (
                              <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5">Upcoming</Badge>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{milestone.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4">
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          onClick={() => setLocation("/pitch/8")}
          data-testid="button-prev-slide"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <div className="flex gap-1.5">
          {Array.from({ length: 12 }, (_, i) => (
            <button
              key={i}
              onClick={() => setLocation(`/pitch/${i + 1}`)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 === 9 ? "w-8" : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              style={i + 1 === 9 ? { background: '#44ba84' } : undefined}
              data-testid={`dot-slide-${i + 1}`}
            />
          ))}
        </div>
        <Button
          className="gap-2 rounded-xl text-white"
          style={{ background: '#44ba84' }}
          onClick={() => setLocation("/pitch/10")}
          data-testid="button-next-slide"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
