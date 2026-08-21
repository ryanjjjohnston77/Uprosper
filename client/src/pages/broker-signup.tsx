import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Copy, Check, X, Briefcase, CheckCircle2 } from "lucide-react";
import BrokersPage from "./brokers";
import { TermsAcceptanceCheckbox } from "@/components/legal-dialogs";

const PLAN_LABELS: Record<string, { name: string; price: string; band?: string }> = {
  starter: { name: "Starter", price: "£20/mo" },
  "growth-1": { name: "Growth", price: "£50/mo", band: "1–5 brokers" },
  "growth-2": { name: "Growth", price: "£75/mo", band: "5–10 brokers" },
  "growth-3": { name: "Growth", price: "£100/mo", band: "10+ brokers" },
};

export default function BrokerSignupPage() {
  const { signup } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [isLoading, setIsLoading] = useState(false);
  const [brokerCode, setBrokerCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { planInfo, companyCodeFromUrl } = useMemo(() => {
    const params = new URLSearchParams(search);
    const plan = (params.get("plan") || "").toLowerCase();
    const band = params.get("band");
    const company = (params.get("company") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    let pi = null;
    if (plan === "growth" && band) {
      pi = { plan, band: Number(band), key: `growth-${band}` };
    } else if (plan === "starter") {
      pi = { plan, band: null as number | null, key: "starter" };
    }
    return { planInfo: pi, companyCodeFromUrl: company };
  }, [search]);
  const planLabel = planInfo ? PLAN_LABELS[planInfo.key] : null;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    companyCode: companyCodeFromUrl,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState<string | undefined>();

  const copyCode = () => {
    if (brokerCode) {
      navigator.clipboard.writeText(brokerCode);
      setCopied(true);
      toast.success("Broker code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!termsAccepted) {
      setTermsError("You must accept the Privacy Policy and Terms to sign up");
      return;
    }
    setTermsError(undefined);

    setIsLoading(true);
    try {
      const user = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        role: "broker",
        companyCode: formData.companyCode || undefined,
        termsAccepted: true,
      });
      if (planInfo) {
        try {
          const resp = await fetch("/api/billing/checkout", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: planInfo.plan, band: planInfo.band }),
          });
          const data = await resp.json();
          if (resp.ok && data.url) {
            window.location.href = data.url;
            return;
          }
          toast.error(data.error || "Could not start checkout — you can subscribe from your dashboard.");
        } catch (e: any) {
          toast.error("Could not reach checkout — you can subscribe from your dashboard.");
        }
      }
      if (user.brokerCode) {
        setBrokerCode(user.brokerCode);
      } else {
        setLocation("/broker");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create broker account");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-primary/30 focus:border-primary/40";
  const inputStyle = { background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' } as const;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
        <div style={{ pointerEvents: 'none' }}>
          <BrokersPage />
        </div>
      </div>

      <div
        className="relative min-h-screen flex items-center justify-center p-4"
        style={{
          zIndex: 10,
          background: 'rgba(15,23,42,0.25)',
          backdropFilter: 'blur(8px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(8px) saturate(1.2)',
        }}
      >
        <div
          className="w-full max-w-md pt-5 px-8 pb-8 rounded-3xl relative"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.88) 40%, rgba(255,255,255,0.90) 100%)',
            backdropFilter: 'blur(40px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {!brokerCode && (
            <Link href="/brokers" className="absolute z-10" style={{ top: '1.25rem', right: '1.25rem' }}>
              <button
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all"
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
                data-testid="button-close-broker-signup"
              >
                <X className="h-4 w-4" />
              </button>
            </Link>
          )}

          <div className="text-center mb-6 mt-4">
            <div className="flex items-center justify-center mb-4">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(68,186,132,0.18)', border: '1px solid rgba(68,186,132,0.35)' }}
                data-testid="icon-broker-signup"
              >
                <Briefcase className="h-7 w-7" style={{ color: '#44ba84' }} />
              </div>
            </div>
            {brokerCode ? (
              <>
                <h1 className="text-2xl font-heading font-bold text-gray-900">Welcome, Broker!</h1>
                <p className="text-sm text-muted-foreground mt-1">Your account has been created successfully</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-heading font-bold text-gray-900">Broker Registration</h1>
                <p className="text-sm text-muted-foreground mt-1">Join as a mortgage broker partner</p>
              </>
            )}
          </div>

          {!brokerCode && planLabel && (
            <div
              className="mb-4 rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(68,186,132,0.10)', border: '1px solid rgba(68,186,132,0.28)' }}
              data-testid="plan-summary"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Selected plan</p>
                <p className="text-sm font-semibold text-gray-900" data-testid="plan-summary-name">
                  {planLabel.name}{planLabel.band ? ` · ${planLabel.band}` : ''} · {planLabel.price}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">14-day free trial · card needed at next step</p>
              </div>
              <Link
                href="/brokers"
                className="text-xs font-semibold underline"
                style={{ color: '#1a7a5c' }}
                data-testid="link-change-plan"
              >
                Change
              </Link>
            </div>
          )}

          {brokerCode ? (
            <>
              <div
                className="rounded-xl p-6 text-center mb-6"
                style={{
                  background: 'rgba(68,186,132,0.08)',
                  border: '1px solid rgba(68,186,132,0.25)',
                }}
              >
                <p className="text-sm text-muted-foreground mb-2">Your unique broker code</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-mono font-bold tracking-widest" style={{ color: '#1a7a5c' }} data-testid="text-broker-code">
                    {brokerCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all"
                    data-testid="button-copy-code"
                  >
                    {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Share this code with your clients so they can connect to you during signup
                </p>
              </div>

              <button
                className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:brightness-110 flex items-center justify-center gap-2"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 12px rgba(68,186,132,0.25)' }}
                onClick={() => setLocation("/broker")}
                data-testid="button-go-to-dashboard"
              >
                Go to Dashboard
              </button>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={inputClass}
                    style={inputStyle}
                    data-testid="input-broker-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="broker@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className={inputClass}
                    style={inputStyle}
                    data-testid="input-broker-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                    className={inputClass}
                    style={inputStyle}
                    data-testid="input-broker-dob"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyCode" className="text-sm font-medium text-gray-700">
                    Company Code {companyCodeFromUrl ? "" : <span className="text-muted-foreground text-xs">(optional)</span>}
                  </Label>
                  {companyCodeFromUrl ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-mono font-bold text-sm tracking-wider text-emerald-700" data-testid="text-company-code-prefilled">{companyCodeFromUrl}</span>
                      <span className="text-xs text-emerald-600 ml-auto">Linked via company</span>
                    </div>
                  ) : (
                    <Input
                      id="companyCode"
                      type="text"
                      placeholder="Enter your company code"
                      value={formData.companyCode}
                      onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
                      maxLength={8}
                      className={inputClass}
                      style={inputStyle}
                      data-testid="input-broker-company-code"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {companyCodeFromUrl ? "You'll be automatically linked to your company" : "If your company gave you a code, enter it here to link your account"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className={inputClass}
                    style={inputStyle}
                    data-testid="input-broker-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className={inputClass}
                    style={inputStyle}
                    data-testid="input-broker-confirm-password"
                  />
                </div>

                <TermsAcceptanceCheckbox
                  checked={termsAccepted}
                  onCheckedChange={(v) => { setTermsAccepted(v); if (v) setTermsError(undefined); }}
                  error={termsError}
                  testIdPrefix="broker-signup"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 12px rgba(68,186,132,0.25)' }}
                  data-testid="button-broker-signup"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Broker Account...
                    </>
                  ) : (
                    "Register as Broker"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium hover:underline" style={{ color: '#44ba84' }} data-testid="link-broker-login">
                  Log in
                </Link>
              </div>
              <div className="mt-2 text-center text-sm text-muted-foreground">
                <Link href="/signup" className="font-medium hover:underline" style={{ color: '#44ba84' }} data-testid="link-client-signup">
                  Signup as client
                </Link>
                {" · "}
                <Link href="/company-signup" className="font-medium hover:underline" style={{ color: '#44ba84' }} data-testid="link-company-signup">
                  Register a company
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
