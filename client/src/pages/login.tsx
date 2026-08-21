import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, X, User } from "lucide-react";
import LandingPage from "./landing";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(formData.email.trim(), formData.password);
      toast.success("Welcome back!");
      if (user.role === "company") {
        setLocation("/company");
      } else if (user.role === "broker") {
        setLocation("/broker");
      } else if (user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/client");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

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
              data-testid="button-close-login"
            >
              <X className="h-4 w-4" />
            </button>
          </Link>
          <div className="text-center mb-6 mt-4">
            <div className="flex items-center justify-center mb-4">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(68,186,132,0.18)', border: '1px solid rgba(68,186,132,0.35)' }}
                data-testid="icon-login-user"
              >
                <User className="h-7 w-7" style={{ color: '#44ba84' }} />
              </div>
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-1">Log in to continue your prosperity journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-primary/30 focus:border-primary/40"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  backdropFilter: 'blur(8px)',
                }}
                data-testid="input-email"
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
                className="rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-primary/30 focus:border-primary/40"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  backdropFilter: 'blur(8px)',
                }}
                data-testid="input-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              style={{
                background: '#44ba84',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 12px rgba(68,186,132,0.25)',
              }}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium hover:underline" style={{ color: '#44ba84' }} data-testid="link-signup">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
