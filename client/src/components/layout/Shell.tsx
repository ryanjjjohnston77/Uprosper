import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { User, Briefcase, Building2, LogOut, LogIn, ChevronDown, Shield, Bell, Gift, UserPlus, Sparkles, HelpCircle, ShoppingBag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const isBroker = location.startsWith("/broker");
  const { user, isLoading, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await logout();
    setLocation("/");
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      client: "bg-green-50 text-green-700 border-green-200",
      broker: "bg-blue-50 text-blue-700 border-blue-200",
      admin: "bg-purple-50 text-purple-700 border-purple-200",
      company: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return styles[role] || styles.client;
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={user ? (user.role === "broker" ? "/broker" : user.role === "company" ? "/company" : user.role === "admin" ? "/admin" : "/client") : "/"}>
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.04] hover:brightness-105"
              style={{
                background: 'rgba(68,186,132,0.12)',
                border: '1px solid rgba(68,186,132,0.22)',
              }}
              data-testid="brand-logo"
              aria-label="Uprosper home"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#44ba84"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M3.5 11.5 12 4l8.5 7.5" />
                <path d="M5.5 10.5V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8.5" />
              </svg>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 transition-all duration-300 focus:outline-none hover:scale-[1.02]" style={{ background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.2)', boxShadow: '0 0 8px rgba(68,186,132,0.08)' }} data-testid="button-user-menu">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs" style={{ background: '#44ba84' }}>
                      {getInitials(user.name)}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-background p-0 shadow-lg border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-muted border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0" style={{ background: '#44ba84' }}>
                        {getInitials(user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate" data-testid="text-user-name">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1.5">
                    <Link href="/client/updates">
                      <DropdownMenuItem className="cursor-pointer px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:bg-gray-50" data-testid="menu-item-notifications">
                        <Bell className="mr-3 h-4 w-4 text-gray-400" />
                        <span className="text-sm">Notifications</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/rewards">
                      <DropdownMenuItem className="cursor-pointer px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:bg-gray-50" data-testid="menu-item-rewards">
                        <Gift className="mr-3 h-4 w-4 text-gray-400" />
                        <span className="text-sm">Rewards</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/marketplace">
                      <DropdownMenuItem className="cursor-pointer px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:bg-gray-50" data-testid="menu-item-marketplace">
                        <ShoppingBag className="mr-3 h-4 w-4 text-gray-400" />
                        <span className="text-sm">Marketplace</span>
                      </DropdownMenuItem>
                    </Link>

                    {user.role === "client" && (
                      <DropdownMenuItem
                        className="cursor-pointer px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:bg-gray-50"
                        data-testid="menu-item-tutorial"
                        onClick={() => {
                          if (location !== "/client") {
                            setLocation("/client");
                            setTimeout(() => {
                              window.dispatchEvent(new CustomEvent("start-tutorial"));
                            }, 500);
                          } else {
                            window.dispatchEvent(new CustomEvent("start-tutorial"));
                          }
                        }}
                      >
                        <HelpCircle className="mr-3 h-4 w-4 text-gray-400" />
                        <span className="text-sm">Tutorial</span>
                      </DropdownMenuItem>
                    )}

                    {(user.role === "broker" || user.role === "admin") && (
                      <Link href="/broker">
                        <DropdownMenuItem className="cursor-pointer px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:bg-gray-50" data-testid="menu-item-broker-portal">
                          <Briefcase className="mr-3 h-4 w-4 text-gray-400" />
                          <span className="text-sm">Broker Portal</span>
                        </DropdownMenuItem>
                      </Link>
                    )}

                    {user.role === "company" && (
                      <Link href="/company">
                        <DropdownMenuItem className="cursor-pointer px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:bg-gray-50" data-testid="menu-item-company-portal">
                          <Building2 className="mr-3 h-4 w-4 text-gray-400" />
                          <span className="text-sm">Company Dashboard</span>
                        </DropdownMenuItem>
                      </Link>
                    )}

                    {user.role === "admin" && (
                      <Link href="/admin">
                        <DropdownMenuItem className="cursor-pointer px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:bg-gray-50" data-testid="menu-item-admin-panel">
                          <Shield className="mr-3 h-4 w-4 text-gray-400" />
                          <span className="text-sm">Admin Panel</span>
                        </DropdownMenuItem>
                      </Link>
                    )}

                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:bg-gray-50" data-testid="menu-item-profile">
                        <User className="mr-3 h-4 w-4 text-gray-400" />
                        <span className="text-sm">My Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      className="cursor-pointer px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:bg-gray-50"
                      data-testid="menu-item-refer-friend"
                      onClick={() => {
                        const el = document.getElementById("refer-a-friend");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                        } else {
                          setLocation("/client");
                          setTimeout(() => {
                            document.getElementById("refer-a-friend")?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 500);
                        }
                      }}
                    >
                      <UserPlus className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="text-sm">Refer a Friend</span>
                    </DropdownMenuItem>
                  </div>

                  <div className="border-t border-gray-100 py-1.5">
                    <DropdownMenuItem className="cursor-pointer px-4 py-2.5 text-red-600 hover:bg-red-50 focus:bg-red-50" onClick={handleSignOut} data-testid="menu-item-sign-out">
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <button className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:brightness-110" style={{ background: '#44ba84', border: '1px solid rgba(255,255,255,0.25)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} data-testid="button-login">
                  <LogIn className="h-4 w-4" />
                  <span>Log In</span>
                </button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
