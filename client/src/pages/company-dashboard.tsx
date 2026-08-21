import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Building2, Users, Briefcase, PoundSterling, TrendingUp, Copy, Check,
  Eye, UserPlus, Activity, ArrowUpRight, Heart, Award,
  MessageSquare, ClipboardList, Wallet, Sparkles, BarChart3, Target,
  Megaphone, Send, AlertTriangle, Share2, Phone, Mail, ArrowRightLeft, History
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface Broker {
  id: string;
  name: string;
  email: string;
  brokerCode: string | null;
  createdAt: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  status: string;
  mortgageValue: string;
  renewalDate: string;
  createdAt: string | null;
}

interface CompanyStats {
  totalBrokers: number;
  totalClients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  companySplit: number;
  activeClients: number;
  newClientsThisMonth: number;
  monthlyBreakdown: { month: string; revenue: number }[];
  avgConversionRate: number;
  retentionRate: number;
}

interface LeaderboardBroker {
  id: string;
  name: string;
  email: string;
  brokerCode: string | null;
  clientCount: number;
  revenue: number;
  conversionRate: number;
  activeClients: number;
  joinedAt: string | null;
}

interface ActivityItem {
  type: string;
  brokerName: string;
  detail: string;
  timestamp: string;
}

interface Commission {
  monthlyEarnings: number;
  totalRevenue: number;
  conversionRate: number;
}

interface CompanyAnnouncement {
  id: number;
  companyId: number;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
}

interface CompanyMsg {
  id: number;
  companyId: number;
  brokerUserId: string;
  senderType: string;
  subject: string | null;
  content: string;
  read: boolean;
  createdAt: string;
}

interface ReassignmentLogEntry {
  id: number;
  companyId: number;
  clientId: number;
  clientName: string;
  fromBrokerUserId: string;
  fromBrokerName: string;
  toBrokerUserId: string;
  toBrokerName: string;
  reassignedAt: string;
}

function RevenueChart({ data }: { data: { label: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `£${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}`}
          width={55}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            padding: "8px 12px",
          }}
          formatter={(value: number) => [`£${value.toLocaleString()}`, "Revenue"]}
          labelStyle={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
          dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "white" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function CompanyDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [codeCopied, setCodeCopied] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<LeaderboardBroker | null>(null);
  const [brokerDetailOpen, setBrokerDetailOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", priority: "normal" });
  const [companyMsgOpen, setCompanyMsgOpen] = useState(false);
  const [companyMsgForm, setCompanyMsgForm] = useState({ brokerUserId: "", subject: "", content: "" });
  const [companyThreadOpen, setCompanyThreadOpen] = useState(false);
  const [threadBrokerId, setThreadBrokerId] = useState("");
  const [threadReply, setThreadReply] = useState("");
  const [revenueFilter, setRevenueFilter] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [addBrokerOpen, setAddBrokerOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignSourceBroker, setReassignSourceBroker] = useState<LeaderboardBroker | null>(null);
  const [reassignSelectedClients, setReassignSelectedClients] = useState<number[]>([]);
  const [reassignTargetBrokerId, setReassignTargetBrokerId] = useState("");

  if (authLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Shell>
    );
  }

  if (!user || user.role !== "company") {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center p-8">
            <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-heading font-bold mb-2">Company Access Required</h2>
            <p className="text-muted-foreground mb-4">You need a company account to access this dashboard.</p>
            <Button onClick={() => setLocation("/company-signup")} data-testid="button-company-signup-cta">
              Register as Company
            </Button>
          </Card>
        </div>
      </Shell>
    );
  }

  const companyCode = user.companyCode || "";

  const { data: stats } = useQuery<CompanyStats>({
    queryKey: ["/api/company/stats"],
    queryFn: async () => {
      const res = await fetch("/api/company/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardBroker[]>({
    queryKey: ["/api/company/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/company/leaderboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: activity = [] } = useQuery<ActivityItem[]>({
    queryKey: ["/api/company/activity"],
    queryFn: async () => {
      const res = await fetch("/api/company/activity", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: announcements = [] } = useQuery<CompanyAnnouncement[]>({
    queryKey: ["/api/company/announcements"],
    queryFn: async () => {
      const res = await fetch("/api/company/announcements", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: reassignmentHistory = [] } = useQuery<ReassignmentLogEntry[]>({
    queryKey: ["/api/company/reassignment-history"],
    queryFn: async () => {
      const res = await fetch("/api/company/reassignment-history", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reassignment history");
      return res.json();
    },
  });

  const { data: companyMessages = [] } = useQuery<CompanyMsg[]>({
    queryKey: ["/api/company/messages"],
    queryFn: async () => {
      const res = await fetch("/api/company/messages", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: brokers = [] } = useQuery<Broker[]>({
    queryKey: ["/api/company/brokers"],
    queryFn: async () => {
      const res = await fetch("/api/company/brokers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch brokers");
      return res.json();
    },
  });

  const { data: companyProfile } = useQuery<any>({
    queryKey: ["/api/company/me"],
    queryFn: async () => {
      const res = await fetch("/api/company/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: revenueTimeline = [] } = useQuery<{ date: string; revenue: number }[]>({
    queryKey: ["/api/company/revenue-timeline"],
    queryFn: async () => {
      const res = await fetch("/api/company/revenue-timeline", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch revenue timeline");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const revenueChartData = useMemo(() => {
    if (revenueTimeline.length === 0) return [];

    if (revenueFilter === "daily") {
      return revenueTimeline.map((d) => ({
        label: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        revenue: d.revenue,
      }));
    }

    if (revenueFilter === "weekly") {
      const weeks: Record<string, number> = {};
      for (const d of revenueTimeline) {
        const date = new Date(d.date);
        const weekStart = new Date(date);
        const day = date.getDay();
        weekStart.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
        const key = weekStart.toISOString().slice(0, 10);
        weeks[key] = (weeks[key] || 0) + d.revenue;
      }
      return Object.entries(weeks)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, revenue]) => ({
          label: `w/c ${new Date(key).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
          revenue: Math.round(revenue * 100) / 100,
        }));
    }

    const months: Record<string, number> = {};
    for (const d of revenueTimeline) {
      const date = new Date(d.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months[key] = (months[key] || 0) + d.revenue;
    }
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, revenue]) => ({
        label: new Date(key + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        revenue: Math.round(revenue * 100) / 100,
      }));
  }, [revenueTimeline, revenueFilter]);

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; priority: string }) => {
      const res = await apiRequest("POST", "/api/company/announcements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/announcements"] });
      setAnnouncementOpen(false);
      setAnnouncementForm({ title: "", content: "", priority: "normal" });
      toast.success("Announcement published!");
    },
  });

  const sendCompanyMsgMutation = useMutation({
    mutationFn: async (data: { brokerUserId: string; subject: string; content: string }) => {
      const res = await apiRequest("POST", "/api/company/messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/messages"] });
      setCompanyMsgOpen(false);
      setCompanyMsgForm({ brokerUserId: "", subject: "", content: "" });
      setThreadReply("");
      toast.success("Message sent!");
    },
  });

  const threadMessages = companyMessages
    .filter(m => m.brokerUserId === threadBrokerId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const messagesByBroker = companyMessages.reduce((acc, msg) => {
    if (!acc[msg.brokerUserId]) acc[msg.brokerUserId] = [];
    acc[msg.brokerUserId].push(msg);
    return acc;
  }, {} as Record<string, CompanyMsg[]>);

  const unreadByBroker = Object.entries(messagesByBroker).reduce((acc, [brokerId, msgs]) => {
    acc[brokerId] = msgs.filter(m => !m.read && m.senderType === "broker").length;
    return acc;
  }, {} as Record<string, number>);

  const getBrokerName = (brokerId: string) => {
    const broker = brokers.find(b => b.id === brokerId);
    return broker?.name || "Unknown Broker";
  };

  const { data: brokerClients = [] } = useQuery<Client[]>({
    queryKey: ["/api/company/brokers", selectedBroker?.id, "clients"],
    queryFn: async () => {
      if (!selectedBroker) return [];
      const res = await fetch(`/api/company/brokers/${selectedBroker.id}/clients`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch broker clients");
      return res.json();
    },
    enabled: !!selectedBroker,
  });

  const { data: brokerCommission } = useQuery<Commission>({
    queryKey: ["/api/company/brokers", selectedBroker?.id, "commission"],
    queryFn: async () => {
      if (!selectedBroker) return { monthlyEarnings: 0, totalRevenue: 0, conversionRate: 0 };
      const res = await fetch(`/api/company/brokers/${selectedBroker.id}/commission`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch broker commission");
      return res.json();
    },
    enabled: !!selectedBroker,
  });

  const { data: reassignSourceClients = [] } = useQuery<Client[]>({
    queryKey: ["/api/company/brokers", reassignSourceBroker?.id, "clients"],
    queryFn: async () => {
      if (!reassignSourceBroker) return [];
      const res = await fetch(`/api/company/brokers/${reassignSourceBroker.id}/clients`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    enabled: !!reassignSourceBroker && reassignOpen,
  });

  const bulkReassignMutation = useMutation({
    mutationFn: async (data: { clientIds: number[]; toBrokerUserId: string }) => {
      const res = await apiRequest("PATCH", "/api/company/clients/bulk-reassign", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/reassignment-history"] });
      if (reassignSourceBroker) {
        queryClient.invalidateQueries({ queryKey: ["/api/company/brokers", reassignSourceBroker.id, "clients"] });
      }
      if (reassignTargetBrokerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/company/brokers", reassignTargetBrokerId, "clients"] });
      }
      setReassignOpen(false);
      setReassignSourceBroker(null);
      setReassignSelectedClients([]);
      setReassignTargetBrokerId("");
      toast.success(`${data.reassigned} client${data.reassigned !== 1 ? "s" : ""} reassigned successfully`);
    },
    onError: (err: unknown) => {
      const detail = err instanceof Error ? err.message : "Failed to reassign clients";
      toast.error(detail);
    },
  });

  const handleOpenReassign = (broker: LeaderboardBroker, e: React.MouseEvent) => {
    e.stopPropagation();
    setReassignSourceBroker(broker);
    setReassignSelectedClients([]);
    setReassignTargetBrokerId("");
    setReassignOpen(true);
  };

  const toggleReassignClient = (clientId: number) => {
    setReassignSelectedClients(prev =>
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  };

  const toggleAllReassignClients = () => {
    if (reassignSelectedClients.length === reassignSourceClients.length) {
      setReassignSelectedClients([]);
    } else {
      setReassignSelectedClients(reassignSourceClients.map(c => c.id));
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(companyCode);
    setCodeCopied(true);
    toast.success("Company code copied!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleViewBroker = (broker: LeaderboardBroker) => {
    setSelectedBroker(broker);
    setBrokerDetailOpen(true);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "new_client": return <UserPlus className="h-3.5 w-3.5" />;
      case "enquiry": return <ClipboardList className="h-3.5 w-3.5" />;
      case "message": return <MessageSquare className="h-3.5 w-3.5" />;
      default: return <Activity className="h-3.5 w-3.5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "new_client": return "bg-green-100 text-green-600";
      case "enquiry": return "bg-blue-100 text-blue-600";
      case "message": return "bg-purple-100 text-purple-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getBrokerBadge = (broker: LeaderboardBroker, index: number) => {
    if (index === 0 && broker.clientCount > 0) {
      return <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">Top Performer</Badge>;
    }
    if (broker.activeClients > 0) {
      return <Badge className="border-0 bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
    }
    return <Badge className="border-0 bg-gray-100 text-gray-600 hover:bg-gray-100">New</Badge>;
  };

  const retentionRate = stats?.retentionRate ?? 0;
  const totalClients = stats?.totalClients ?? 0;
  const activeClients = stats?.activeClients ?? 0;

  return (
    <Shell>
      <div className="relative space-y-6">
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-green-100/40 via-emerald-50/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/30 via-indigo-50/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-purple-50/20 to-rose-50/15 rounded-full blur-3xl" />
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900" data-testid="text-company-title">
              Welcome back, {(user.companyName || user.name)?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-muted-foreground mt-1">Here's your company overview</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAddBrokerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
              style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
              data-testid="button-add-broker"
            >
              <UserPlus className="h-4 w-4" /> Add Broker
            </button>
            <button
              onClick={handleCopyCode}
              className="liquid-glass-sm flex items-center gap-2 px-3 py-2 hover:scale-[1.02] transition-all"
              data-testid="button-copy-company-code"
            >
              <span className="text-xs text-muted-foreground">Code:</span>
              <span className="font-mono font-bold text-sm text-primary tracking-wider" data-testid="text-company-code-display">
                {companyCode}
              </span>
              {codeCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* Row 1 — Company Performance + Company Health */}
          <div className="md:col-span-7 liquid-glass p-6" data-testid="bento-performance">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 via-transparent to-emerald-50/30 pointer-events-none rounded-[1.25rem]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">Company Performance</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="liquid-glass-sm p-4 hover:scale-[1.02] transition-all" data-testid="card-stat-brokers">
                  <div className="flex items-center justify-between mb-2">
                    <Briefcase className="h-4 w-4 text-blue-500/60" />
                  </div>
                  <p className="text-3xl font-heading font-bold text-gray-900" data-testid="text-total-brokers">{stats?.totalBrokers ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Brokers</p>
                </div>
                <div className="liquid-glass-sm p-4 hover:scale-[1.02] transition-all" data-testid="card-stat-clients">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-4 w-4 text-primary/60" />
                    <span className="flex items-center text-xs text-green-600 font-medium">
                      <ArrowUpRight className="h-3 w-3" /> +{stats?.newClientsThisMonth ?? 0}
                    </span>
                  </div>
                  <p className="text-3xl font-heading font-bold text-gray-900" data-testid="text-total-clients">{totalClients}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Clients</p>
                </div>
                <div className="liquid-glass-sm p-4 hover:scale-[1.02] transition-all" data-testid="card-stat-monthly-breakdown">
                  <div className="flex items-center justify-between mb-2">
                    <BarChart3 className="h-4 w-4 text-emerald-500/60" />
                  </div>
                  {(stats?.monthlyBreakdown ?? []).length > 0 ? (
                    <div className="space-y-1">
                      {(stats?.monthlyBreakdown ?? []).slice(-3).map((m) => (
                        <div key={m.month} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{m.month}</span>
                          <span className="text-xs font-bold text-gray-900">£{m.revenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Revenue by Month</p>
                </div>
                <div className="liquid-glass-sm p-4 hover:scale-[1.02] transition-all" data-testid="card-stat-new-month">
                  <div className="flex items-center justify-between mb-2">
                    <UserPlus className="h-4 w-4 text-purple-500/60" />
                    {(stats?.newClientsThisMonth ?? 0) > 0 && (
                      <span className="flex items-center text-xs text-green-600 font-medium">
                        <ArrowUpRight className="h-3 w-3" /> New
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-heading font-bold text-gray-900" data-testid="text-new-clients-month">{stats?.newClientsThisMonth ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">New This Month</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 liquid-glass p-6" data-testid="bento-health">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/30 via-transparent to-orange-50/20 pointer-events-none rounded-[1.25rem]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-rose-500/10 backdrop-blur-sm">
                  <Heart className="h-5 w-5 text-rose-500" />
                </div>
                <h2 className="text-lg font-heading font-bold text-gray-900">Company Health</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-700" data-testid="text-retention-rate">{retentionRate}%</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Retention Rate</p>
                      <p className="text-xs text-muted-foreground">{activeClients} active of {totalClients} clients</p>
                    </div>
                  </div>
                  <Badge className={`border-0 ${
                    retentionRate >= 80 ? "bg-green-100 text-green-700 hover:bg-green-100" :
                    retentionRate >= 50 ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                    "bg-red-100 text-red-700 hover:bg-red-100"
                  }`}>{retentionRate >= 80 ? "Excellent" : retentionRate >= 50 ? "Fair" : "Needs Attention"}</Badge>
                </div>
                <div className="h-px bg-gray-100/80" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Active Clients</p>
                      <p className="text-xs text-muted-foreground">Currently engaged</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-purple-600" data-testid="text-active-clients">{activeClients}</span>
                </div>
                <div className="h-px bg-gray-100/80" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Avg. Conversion</p>
                      <p className="text-xs text-muted-foreground">Across all brokers</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{stats?.avgConversionRate ?? 0}%</span>
                </div>
                <div className="h-px bg-gray-100/80" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Total Brokers</p>
                      <p className="text-xs text-muted-foreground">Registered under company</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{stats?.totalBrokers ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 — Activity Feed + Broker Messages */}
          <div className="md:col-span-6 liquid-glass p-6" data-testid="bento-activity">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-teal-50/15 pointer-events-none rounded-[1.25rem]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 backdrop-blur-sm">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">Activity Feed</h2>
                </div>
              </div>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {activity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  activity.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/40 transition-colors" data-testid={`row-activity-${idx}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(item.type)}`}>
                        {getActivityIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.brokerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistance(new Date(item.timestamp), new Date(), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-6 liquid-glass p-6" data-testid="bento-broker-messages">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-sky-50/20 pointer-events-none rounded-[1.25rem]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 backdrop-blur-sm">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">Broker Messages</h2>
                  {Object.values(unreadByBroker).reduce((a, b) => a + b, 0) > 0 && (
                    <Badge variant="destructive" className="rounded-full px-2 text-xs">
                      {Object.values(unreadByBroker).reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setCompanyMsgOpen(true)}
                  data-testid="button-new-broker-message"
                >
                  <Send className="h-3.5 w-3.5" /> New
                </Button>
              </div>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {Object.keys(messagesByBroker).length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  Object.entries(messagesByBroker).map(([brokerId, msgs]) => {
                    const latest = msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                    const unread = unreadByBroker[brokerId] || 0;
                    return (
                      <div
                        key={brokerId}
                        className={`liquid-glass-sm p-3 cursor-pointer hover:scale-[1.01] transition-all ${unread > 0 ? 'ring-1 ring-blue-200' : ''}`}
                        onClick={() => {
                          setThreadBrokerId(brokerId);
                          setCompanyThreadOpen(true);
                          msgs.filter(m => !m.read && m.senderType === "broker").forEach(m => {
                            fetch(`/api/company/messages/${m.id}/read`, { method: "POST", credentials: "include" });
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/company/messages"] });
                        }}
                        data-testid={`card-broker-thread-${brokerId}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold shrink-0">
                            {getBrokerName(brokerId).split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">{getBrokerName(brokerId)}</p>
                              {unread > 0 && (
                                <Badge variant="destructive" className="rounded-full px-1.5 text-[10px]">{unread}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {latest.senderType === "company" ? "You: " : ""}{latest.content}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistance(new Date(latest.createdAt), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Row 3 — Your Brokers (full width) */}
          <div className="md:col-span-12 liquid-glass p-6" data-testid="bento-leaderboard">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/20 via-transparent to-yellow-50/15 pointer-events-none rounded-[1.25rem]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 backdrop-blur-sm">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">Your Brokers</h2>
                </div>
                <Badge variant="secondary" className="text-xs rounded-full">
                  {leaderboard.length} broker{leaderboard.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              {leaderboard.length === 0 ? (
                <div className="text-center py-10">
                  <UserPlus className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">No brokers yet</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Share your company code <span className="font-mono font-bold text-primary">{companyCode}</span> with brokers so they can join during signup.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100">
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Broker</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">Clients</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">Revenue</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">Conv.</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((broker, index) => (
                        <TableRow
                          key={broker.id}
                          className="border-gray-100/60 hover:bg-white/40 transition-colors cursor-pointer"
                          onClick={() => handleViewBroker(broker)}
                          data-testid={`row-broker-${broker.id}`}
                        >
                          <TableCell className="font-mono text-sm text-muted-foreground w-8">
                            {index === 0 && broker.clientCount > 0 ? (
                              <span className="text-amber-500">★</span>
                            ) : (
                              index + 1
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                                {broker.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{broker.name}</p>
                                <p className="text-xs text-muted-foreground">{broker.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-bold text-gray-900">{broker.clientCount}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-bold text-gray-900">£{broker.revenue.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-medium text-gray-700">{broker.conversionRate}%</span>
                          </TableCell>
                          <TableCell>{getBrokerBadge(broker, index)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-blue-50"
                                onClick={(e) => handleOpenReassign(broker, e)}
                                title="Reassign clients"
                                data-testid={`button-reassign-broker-${broker.id}`}
                              >
                                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
                                onClick={(e) => { e.stopPropagation(); handleViewBroker(broker); }}
                                data-testid={`button-view-broker-${broker.id}`}
                              >
                                <Eye className="h-4 w-4 text-primary" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Row 4 — Reassignment History (full width) */}
          <div className="md:col-span-12 liquid-glass p-6" data-testid="bento-reassignment-history">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-violet-50/20 pointer-events-none rounded-[1.25rem]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 backdrop-blur-sm">
                    <History className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">Reassignment History</h2>
                  <Badge className="border-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">{reassignmentHistory.length}</Badge>
                </div>
              </div>
              {reassignmentHistory.length === 0 ? (
                <div className="text-center py-10">
                  <ArrowRightLeft className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">No reassignments yet</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Client reassignments between brokers will appear here as an audit log.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100">
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From Broker</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To Broker</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reassignmentHistory.slice(0, 50).map((entry) => (
                        <TableRow key={entry.id} className="border-gray-100/60" data-testid={`row-reassignment-${entry.id}`}>
                          <TableCell className="font-medium text-sm">{entry.clientName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-[10px] font-semibold shrink-0">
                                {entry.fromBrokerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                              <span className="text-sm text-gray-700">{entry.fromBrokerName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px] font-semibold shrink-0">
                                {entry.toBrokerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                              <span className="text-sm text-gray-700">{entry.toBrokerName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistance(new Date(entry.reassignedAt), new Date(), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Row 5 — Announcements (full width) */}
          <div className="md:col-span-12 liquid-glass p-6" data-testid="bento-announcements">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/30 via-transparent to-red-50/20 pointer-events-none rounded-[1.25rem]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/10 backdrop-blur-sm">
                    <Megaphone className="h-5 w-5 text-rose-600" />
                  </div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">Announcements</h2>
                  <Badge className="border-0 bg-rose-100 text-rose-700 hover:bg-rose-100">{announcements.length}</Badge>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => setAnnouncementOpen(true)}
                  data-testid="button-new-announcement"
                >
                  <Megaphone className="h-3.5 w-3.5" /> New
                </Button>
              </div>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {announcements.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No announcements yet</p>
                  </div>
                ) : (
                  announcements.slice(0, 5).map((ann) => (
                    <div key={ann.id} className="liquid-glass-sm p-3 hover:scale-[1.01] transition-all" data-testid={`card-announcement-${ann.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{ann.title}</p>
                            {ann.priority === "urgent" && (
                              <Badge className="border-0 bg-red-100 text-red-700 hover:bg-red-100 text-[10px] px-1.5">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                          {formatDistance(new Date(ann.createdAt), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-heading font-bold flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-600" />
                New Announcement
              </DialogTitle>
              <DialogDescription>Broadcast a message to all your brokers</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label htmlFor="ann-title" className="text-sm font-medium">Title</Label>
                <Input
                  id="ann-title"
                  placeholder="Announcement title"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(f => ({ ...f, title: e.target.value }))}
                  className="mt-1"
                  data-testid="input-announcement-title"
                />
              </div>
              <div>
                <Label htmlFor="ann-content" className="text-sm font-medium">Content</Label>
                <Textarea
                  id="ann-content"
                  placeholder="Write your announcement..."
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm(f => ({ ...f, content: e.target.value }))}
                  rows={4}
                  className="mt-1"
                  data-testid="input-announcement-content"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <Select value={announcementForm.priority} onValueChange={(v) => setAnnouncementForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-announcement-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => createAnnouncementMutation.mutate(announcementForm)}
                disabled={!announcementForm.title || !announcementForm.content || createAnnouncementMutation.isPending}
                data-testid="button-publish-announcement"
              >
                {createAnnouncementMutation.isPending ? "Publishing..." : "Publish Announcement"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={companyMsgOpen} onOpenChange={setCompanyMsgOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-heading font-bold flex items-center gap-2">
                <Send className="h-5 w-5 text-violet-600" />
                Message Broker
              </DialogTitle>
              <DialogDescription>Send a direct message to a broker</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-sm font-medium">Select Broker</Label>
                <Select value={companyMsgForm.brokerUserId} onValueChange={(v) => setCompanyMsgForm(f => ({ ...f, brokerUserId: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-message-broker">
                    <SelectValue placeholder="Choose a broker..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brokers.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="msg-subject" className="text-sm font-medium">Subject</Label>
                <Input
                  id="msg-subject"
                  placeholder="Message subject"
                  value={companyMsgForm.subject}
                  onChange={(e) => setCompanyMsgForm(f => ({ ...f, subject: e.target.value }))}
                  className="mt-1"
                  data-testid="input-message-subject"
                />
              </div>
              <div>
                <Label htmlFor="msg-content" className="text-sm font-medium">Message</Label>
                <Textarea
                  id="msg-content"
                  placeholder="Type your message..."
                  value={companyMsgForm.content}
                  onChange={(e) => setCompanyMsgForm(f => ({ ...f, content: e.target.value }))}
                  rows={4}
                  className="mt-1"
                  data-testid="input-message-content"
                />
              </div>
              <Button
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => sendCompanyMsgMutation.mutate(companyMsgForm)}
                disabled={!companyMsgForm.brokerUserId || !companyMsgForm.content || sendCompanyMsgMutation.isPending}
                data-testid="button-send-broker-message"
              >
                {sendCompanyMsgMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={companyThreadOpen} onOpenChange={setCompanyThreadOpen}>
          <DialogContent className="max-w-lg bg-white max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-lg font-heading font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-600" />
                {getBrokerName(threadBrokerId)}
              </DialogTitle>
              <DialogDescription>Conversation thread</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-[200px] max-h-[400px]">
              {threadMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === "company" ? "justify-end" : "justify-start"}`}
                  data-testid={`thread-msg-${msg.id}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.senderType === "company"
                      ? "bg-violet-600 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  }`}>
                    {msg.subject && (
                      <p className={`text-xs font-semibold mb-1 ${msg.senderType === "company" ? "text-violet-200" : "text-gray-500"}`}>
                        {msg.subject}
                      </p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.senderType === "company" ? "text-violet-200" : "text-gray-400"}`}>
                      {formatDistance(new Date(msg.createdAt), new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Input
                placeholder="Type a reply..."
                value={threadReply}
                onChange={(e) => setThreadReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && threadReply.trim()) {
                    sendCompanyMsgMutation.mutate({ brokerUserId: threadBrokerId, subject: "", content: threadReply.trim() });
                    setThreadReply("");
                  }
                }}
                data-testid="input-thread-reply"
              />
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white px-4"
                onClick={() => {
                  if (threadReply.trim()) {
                    sendCompanyMsgMutation.mutate({ brokerUserId: threadBrokerId, subject: "", content: threadReply.trim() });
                    setThreadReply("");
                  }
                }}
                disabled={!threadReply.trim() || sendCompanyMsgMutation.isPending}
                data-testid="button-thread-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Broker Dialog — QR Code Invite */}
        <Dialog open={addBrokerOpen} onOpenChange={setAddBrokerOpen}>
          <DialogContent className="sm:max-w-sm bg-white" overlayClassName="bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-gray-900">Invite Broker</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Ask your broker to scan this code to sign up — they'll be linked to your company automatically.
              </DialogDescription>
            </DialogHeader>
            {(() => {
              const signupUrl = `${window.location.origin}/broker-signup?company=${companyCode}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(signupUrl)}&color=166534&bgcolor=f8faf9`;
              const shareTitle = "Join our company on Uprosper";
              const shareText = `Sign up with our company code ${companyCode} on Uprosper:`;
              const shareBody = `${shareText} ${signupUrl}`;
              const canNativeShare = typeof navigator !== "undefined" && typeof (navigator as any).share === "function";

              const handleNativeShare = async () => {
                try {
                  await (navigator as any).share({ title: shareTitle, text: shareText, url: signupUrl });
                } catch (err: any) {
                  if (err?.name !== "AbortError") toast.error("Couldn't open share menu");
                }
              };

              return (
                <div className="flex flex-col items-center gap-5 pt-2 pb-1">
                  <div
                    className="p-4 rounded-2xl"
                    style={{ background: 'rgba(68,186,132,0.06)', border: '1px solid rgba(68,186,132,0.15)' }}
                  >
                    <img
                      src={qrUrl}
                      alt="Broker signup QR code"
                      className="w-[200px] h-[200px] rounded-lg"
                      data-testid="img-add-broker-qr"
                    />
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Your company code</p>
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                      style={{ background: 'rgba(68,186,132,0.06)', border: '1px dashed rgba(68,186,132,0.35)' }}
                    >
                      <span className="font-mono font-bold text-lg tracking-[0.25em]" style={{ color: '#2d8a5e' }} data-testid="text-add-broker-code">
                        {companyCode}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => { navigator.clipboard.writeText(signupUrl); toast.success("Signup link copied!"); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                    style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                    data-testid="button-copy-broker-invite-link"
                  >
                    <Copy className="w-4 h-4" /> Copy Signup Link
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02]"
                        style={{ background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.35)', color: '#2d8a5e' }}
                        data-testid="button-share-broker-invite"
                      >
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-56">
                      {canNativeShare && (
                        <DropdownMenuItem onClick={handleNativeShare} data-testid="menu-share-broker-native">
                          <Share2 className="w-4 h-4 mr-2" /> Share via…
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild data-testid="menu-share-broker-sms">
                        <a href={`sms:?&body=${encodeURIComponent(shareBody)}`}>
                          <MessageSquare className="w-4 h-4 mr-2" /> Messages
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild data-testid="menu-share-broker-whatsapp">
                        <a href={`https://wa.me/?text=${encodeURIComponent(shareBody)}`} target="_blank" rel="noopener noreferrer">
                          <Phone className="w-4 h-4 mr-2" /> WhatsApp
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild data-testid="menu-share-broker-email">
                        <a href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareBody)}`}>
                          <Mail className="w-4 h-4 mr-2" /> Email
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        <Dialog open={reassignOpen} onOpenChange={(open) => {
          setReassignOpen(open);
          if (!open) { setReassignSelectedClients([]); setReassignTargetBrokerId(""); }
        }}>
          <DialogContent className="max-w-lg bg-white max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-lg font-heading font-bold flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                Reassign Clients
              </DialogTitle>
              <DialogDescription>
                {reassignSourceBroker
                  ? `Move clients from ${reassignSourceBroker.name} to another broker`
                  : "Select clients to reassign"}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              {reassignSourceClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">This broker has no clients to reassign</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700">Select clients</p>
                      <button
                        type="button"
                        className="text-xs text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
                        onClick={toggleAllReassignClients}
                        data-testid="button-reassign-select-all"
                      >
                        {reassignSelectedClients.length === reassignSourceClients.length ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    <div className="space-y-1 max-h-[240px] overflow-y-auto rounded-xl border border-gray-100 p-2">
                      {reassignSourceClients.map((client) => {
                        const checked = reassignSelectedClients.includes(client.id);
                        return (
                          <label
                            key={client.id}
                            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            data-testid={`reassign-client-${client.id}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleReassignClient(client.id)}
                              className="h-4 w-4 accent-primary rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              client.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>{client.status}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-1 block">Assign to broker</Label>
                    <Select
                      value={reassignTargetBrokerId}
                      onValueChange={setReassignTargetBrokerId}
                    >
                      <SelectTrigger data-testid="select-reassign-target-broker">
                        <SelectValue placeholder="Choose target broker..." />
                      </SelectTrigger>
                      <SelectContent>
                        {leaderboard
                          .filter(b => b.id !== reassignSourceBroker?.id)
                          .map(b => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name} ({b.clientCount} client{b.clientCount !== 1 ? "s" : ""})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {reassignSourceClients.length > 0 && (
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {reassignSelectedClients.length} of {reassignSourceClients.length} selected
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  disabled={reassignSelectedClients.length === 0 || !reassignTargetBrokerId || bulkReassignMutation.isPending}
                  onClick={() => bulkReassignMutation.mutate({ clientIds: reassignSelectedClients, toBrokerUserId: reassignTargetBrokerId })}
                  data-testid="button-confirm-reassign"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  {bulkReassignMutation.isPending ? "Reassigning..." : "Reassign Selected"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={brokerDetailOpen} onOpenChange={setBrokerDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-gray-900 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {selectedBroker?.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                {selectedBroker?.name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">{selectedBroker?.email}</DialogDescription>
            </DialogHeader>

            {selectedBroker && (
              <div className="space-y-6 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Clients</p>
                    <p className="text-2xl font-bold text-blue-700" data-testid="text-broker-detail-clients">
                      {brokerClients.length}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-green-700" data-testid="text-broker-detail-revenue">
                      £{brokerCommission?.totalRevenue ?? 0}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Conversion</p>
                    <p className="text-2xl font-bold text-amber-700" data-testid="text-broker-detail-conversion">
                      {brokerCommission?.conversionRate ?? 0}%
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                    <p className="text-2xl font-bold text-purple-700" data-testid="text-broker-detail-monthly">
                      £{brokerCommission?.monthlyEarnings ?? 0}
                    </p>
                  </div>
                </div>

                {selectedBroker.brokerCode && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 text-sm">
                    <span className="text-muted-foreground">Broker Code:</span>
                    <span className="font-mono font-bold text-primary">{selectedBroker.brokerCode}</span>
                    {selectedBroker.joinedAt && (
                      <>
                        <span className="text-gray-300 mx-2">|</span>
                        <span className="text-muted-foreground">
                          Joined {formatDistance(new Date(selectedBroker.joinedAt), new Date(), { addSuffix: true })}
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Client Portfolio</h4>
                    <Badge variant="secondary" className="text-xs ml-auto">{brokerClients.length} clients</Badge>
                  </div>
                  {brokerClients.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6 bg-gray-50 rounded-lg">No clients assigned yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-100">
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Mortgage Value</TableHead>
                            <TableHead className="text-xs">Renewal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {brokerClients.map((client) => (
                            <TableRow key={client.id} className="border-gray-100/60" data-testid={`row-broker-client-${client.id}`}>
                              <TableCell className="font-medium text-sm">{client.name}</TableCell>
                              <TableCell>
                                <Badge className={`text-xs border-0 ${
                                  client.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                                }`}>
                                  {client.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                £{parseFloat(client.mortgageValue || "0").toLocaleString()}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {client.renewalDate}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
