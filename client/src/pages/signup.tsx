import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, X, CheckCircle2, User } from "lucide-react";
import LandingPage from "./landing";
import { TermsAcceptanceCheckbox } from "@/components/legal-dialogs";

export default function SignupPage() {
  const { signup } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = new URLSearchParams(window.location.search);
  const rawBrokerParam = searchParams.get("broker") || "";
  const brokerFromUrl = /^\d{6}$/.test(rawBrokerParam) ? rawBrokerParam : "";
  const rawRefParam = (searchParams.get("ref") || searchParams.get("referral") || "").toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    brokerCode: brokerFromUrl,
    referralCode: rawRefParam,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState<string | undefined>();

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
        brokerCode: formData.brokerCode || undefined,
        referralCode: formData.referralCode || undefined,
        termsAccepted: true,
      });
      toast.success("Account created successfully!");
      setLocation(user.role === "broker" ? "/broker" : "/client");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-primary/30 focus:border-primary/40";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
        <div style={{ pointerEvents: 'none' }}>
          <LandingPage />
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
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 16px rgba(0,0,0,0.06)',
          }}
        >
          <Link href="/" className="absolute z-10" style={{ top: '1.25rem', right: '1.25rem' }}>
            <button
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all"
              style={{
                background: 'rgba(0,0,0,0.05)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
              data-testid="button-close-signup"
            >
              <X className="h-4 w-4" />
            </button>
          </Link>
          <div className="text-center mb-6 mt-4">
            <div className="flex items-center justify-center mb-4">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(68,186,132,0.18)', border: '1px solid rgba(68,186,132,0.35)' }}
                data-testid="icon-signup-user"
              >
                <User className="h-7 w-7" style={{ color: '#44ba84' }} />
              </div>
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">Create an Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start your prosperity journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className={inputClass}
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' }}
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={inputClass}
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' }}
                data-testid="input-email"
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
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' }}
                data-testid="input-dob"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brokerCode" className="text-sm font-medium text-gray-700">
                Broker Code {brokerFromUrl ? "" : "(Optional)"}
              </Label>
              {brokerFromUrl ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-mono font-bold text-sm tracking-wider text-emerald-700" data-testid="text-broker-code-prefilled">{brokerFromUrl}</span>
                  <span className="text-xs text-emerald-600 ml-auto">Linked via broker</span>
                </div>
              ) : (
                <Input
                  id="brokerCode"
                  type="text"
                  placeholder="Enter 6-digit code from your broker"
                  value={formData.brokerCode}
                  onChange={(e) => setFormData({ ...formData, brokerCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  maxLength={6}
                  className={inputClass}
                  style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' }}
                  data-testid="input-broker-code"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {brokerFromUrl ? "You'll be automatically connected to your broker" : "If your broker gave you a code, enter it here to connect with them"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">Referral Code (Optional)</Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="Enter referral code from a friend"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) })}
                maxLength={8}
                className={inputClass}
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' }}
                data-testid="input-referral-code"
              />
              <p className="text-xs text-muted-foreground">If a friend referred you, enter their code here</p>
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
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' }}
                data-testid="input-password"
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
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' }}
                data-testid="input-confirm-password"
              />
            </div>

            <TermsAcceptanceCheckbox
              checked={termsAccepted}
              onCheckedChange={(v) => { setTermsAccepted(v); if (v) setTermsError(undefined); }}
              error={termsError}
              testIdPrefix="signup"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 12px rgba(68,186,132,0.25)' }}
              data-testid="button-signup"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: '#44ba84' }} data-testid="link-login">
              Log in
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            <Link href="/broker-signup" className="font-medium hover:underline" style={{ color: '#44ba84' }} data-testid="link-broker-signup">
              Signup as broker
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
