import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Copy, Check, X } from "lucide-react";
import { TermsAcceptanceCheckbox } from "@/components/legal-dialogs";

export default function CompanySignupPage() {
  const { signup } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState<string | undefined>();

  const copyCode = () => {
    if (companyCode) {
      navigator.clipboard.writeText(companyCode);
      setCopied(true);
      toast.success("Code copied to clipboard!");
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
        role: "company",
        termsAccepted: true,
      });
      toast.success("Company account created successfully!");
      if ((user as any).companyCode) {
        setCompanyCode((user as any).companyCode);
      } else {
        setLocation("/company");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "liquid-glass-sm border-white/40 bg-white/30 backdrop-blur-sm focus:border-primary/40 focus:ring-primary/20";

  if (companyCode) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex items-center justify-center p-4">
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-green-100/30 via-emerald-50/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-r from-teal-50/20 to-cyan-50/15 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md liquid-glass pt-5 px-8 pb-8 rounded-2xl relative">
          <div className="text-center mb-6 mt-4">
            <div className="flex items-center justify-center mb-4">
              <Link href="/">
                <img src="/logo.png" alt="Uprosper" className="h-14 w-14 cursor-pointer hover:opacity-80 transition-opacity rounded-lg" />
              </Link>
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">Welcome, Company!</h1>
            <p className="text-sm text-muted-foreground mt-1">Your company account has been created successfully</p>
          </div>

          <div className="liquid-glass-sm rounded-xl p-6 text-center mb-6">
            <p className="text-sm text-muted-foreground mb-2">Your unique company code</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-mono font-bold tracking-widest" style={{ color: '#1a7a5c' }} data-testid="text-company-code">
                {companyCode}
              </span>
              <button
                onClick={copyCode}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all"
                data-testid="button-copy-company-code"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Share this code with your brokers so they can link to your company during signup
            </p>
          </div>

          <button
            className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:brightness-110 flex items-center justify-center gap-2"
            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
            onClick={() => setLocation("/company")}
            data-testid="button-go-to-company-dashboard"
          >
            Go to Company Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex items-center justify-center p-4">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-green-100/30 via-emerald-50/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-r from-teal-50/20 to-cyan-50/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md liquid-glass pt-5 px-8 pb-8 rounded-2xl relative">
        <Link href="/" className="absolute z-10" style={{ top: '1.25rem', right: '1.25rem' }}>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.5)' }} data-testid="button-close-company-signup">
            <X className="h-4 w-4" />
          </button>
        </Link>

        <div className="text-center mb-6 mt-4">
          <div className="flex items-center justify-center mb-4">
            <Link href="/">
              <img src="/logo.png" alt="Uprosper" className="h-14 w-14 cursor-pointer hover:opacity-80 transition-opacity rounded-lg" />
            </Link>
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Company Registration</h1>
          <p className="text-sm text-muted-foreground mt-1">Register your brokerage company to manage your brokers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Company Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="The Mortgage Shop"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={inputClass}
              data-testid="input-company-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Contact Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className={inputClass}
              data-testid="input-company-email"
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
              data-testid="input-company-dob"
            />
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
              data-testid="input-company-password"
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
              data-testid="input-company-confirm-password"
            />
          </div>

          <TermsAcceptanceCheckbox
            checked={termsAccepted}
            onCheckedChange={(v) => { setTermsAccepted(v); if (v) setTermsError(undefined); }}
            error={termsError}
            testIdPrefix="company-signup"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
            data-testid="button-company-signup"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Company Account...
              </>
            ) : (
              "Register Company"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium hover:underline" style={{ color: '#1a7a5c' }} data-testid="link-company-login">
            Log in
          </Link>
        </div>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          <Link href="/broker-signup" className="font-medium hover:underline" style={{ color: '#1a7a5c' }} data-testid="link-broker-signup">
            Signup as broker
          </Link>
          {" · "}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: '#1a7a5c' }} data-testid="link-client-signup-from-company">
            Signup as client
          </Link>
        </div>
      </div>
    </div>
  );
}
