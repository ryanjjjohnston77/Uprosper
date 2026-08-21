import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users, UserCheck, LogOut, Loader2, Briefcase, Building2,
  Coffee, Upload, Send, Gift, Image, ShoppingBag, CreditCard, TrendingUp, Activity,
  Search, ChevronLeft, ChevronRight, Settings, Plus, Trash2, X as XIcon, ArrowUp, ArrowDown, ExternalLink, Power, Copy,
  Trophy, Ticket, Heart,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { DEAL_ICON_KEYS, type AffiliateDeal as PublicAffiliateDeal } from "@/lib/affiliate-deals";
import { format, formatDistanceToNow } from "date-fns";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";

interface AdminOverview {
  totalUsers: number;
  totalClients: number;
  totalBrokers: number;
  totalAdmins: number;
  totalCompanies: number;
  liveNow: number;
  liveNowPrev5m: number;
  activeThisWeek: number;
  activeLastWeek: number;
  newSignups7d: number;
  newSignups30d: number;
  signupsToday: number;
  signupsYesterday: number;
  clientSignupsToday: number;
  clientSignupsYesterday: number;
  brokerSignupsToday: number;
  brokerSignupsYesterday: number;
  companySignupsToday: number;
  companySignupsYesterday: number;
  signupsByDay: { date: string; clients: number; brokers: number }[];
  marketplace: {
    clicks24h: number;
    clicksPrev24h: number;
    clicks7d: number;
    clicks30d: number;
    topDeals: { dealId: string; clicks: number }[];
    byTab: { home: number; finance: number; leisure: number };
  };
  subscriptions: {
    byPlan: { plan: string; band: number | null; count: number }[];
    byStatus: { status: string; count: number }[];
    activeStarter: number;
    activeGrowthBand1: number;
    activeGrowthBand2: number;
    activeGrowthBand3: number;
    trialing: number;
    cancelled: number;
    mrrEstimate: number;
  };
}

interface AdminClient {
  userId: string;
  clientId: number | null;
  name: string;
  email: string;
  status: string | null;
  brokerUserId: string | null;
  brokerName: string | null;
  createdAt: string | null;
  lastActiveAt: string | null;
  completedSteps: number;
  totalSteps: number;
}

interface AdminBroker {
  id: string;
  name: string;
  email: string;
  brokerCode: string | null;
  plan: string | null;
  growthBand: number | null;
  subscriptionStatus: string | null;
  companyId: number | null;
  companyName: string | null;
  clientCount: number;
  createdAt: string | null;
  lastActiveAt: string | null;
}

interface AdminCompany {
  id: number;
  name: string;
  companyCode: string;
  contactEmail: string;
  brokerCount: number;
  clientCount: number;
  createdAt: string | null;
}

interface RewardQueueItem {
  id: number;
  clientId: number;
  stepId: number;
  stepTitle: string;
  status: string;
  qrCodeData: string | null;
  sentAt: string | null;
  createdAt: string;
  clientName: string;
  clientEmail: string;
}

type AdminAffiliateDeal = PublicAffiliateDeal & {
  trackingUrl: string;
  status: string;
  sortOrder: number;
  clicks7d?: number;
  clicks30d?: number;
};

const STATIC_DEAL_LABELS: Record<string, string> = {
  monzo: "Monzo", starling: "Starling", revolut: "Revolut", wise: "Wise",
  hargreaveslansdown: "Hargreaves L.", freetrade: "Freetrade",
};

function BentoCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 relative overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.4)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
    >
      {children}
    </div>
  );
}

function Delta({ value, testId }: { value: number; testId: string }) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "·";
  const color = value > 0 ? "text-emerald-600" : value < 0 ? "text-rose-500" : "text-muted-foreground";
  const display = value === 0 ? "no change" : `${sign}${Math.abs(value)} vs yest`;
  return <span className={`text-[11px] font-medium ${color}`} data-testid={testId}>{display}</span>;
}

function KpiTile({
  icon: Icon, label, value, accent, testId, delta, deltaTestId, sublabel,
}: {
  icon: LucideIcon; label: string; value: string | number; accent: string; testId: string;
  delta?: number; deltaTestId?: string; sublabel?: string;
}) {
  return (
    <BentoCard>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-heading font-bold text-gray-900 mt-1" data-testid={testId}>{value}</p>
          {delta !== undefined && deltaTestId ? <Delta value={delta} testId={deltaTestId} /> : null}
          {sublabel && <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: accent + "1f" }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
    </BentoCard>
  );
}

function MultiSparkline({ data }: { data: { date: string; clients: number; brokers: number }[] }) {
  if (data.length === 0) return <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">No data</div>;
  const max = Math.max(1, ...data.map(d => Math.max(d.clients, d.brokers)));
  const w = 600, h = 96, pad = 4;
  const stepX = (w - pad * 2) / (data.length - 1 || 1);
  const lineFor = (key: "clients" | "brokers") =>
    data.map((d, i) => `${pad + i * stepX},${h - pad - (d[key] / max) * (h - pad * 2)}`).join(" ");
  const clientsLine = lineFor("clients");
  const brokersLine = lineFor("brokers");
  const clientsArea = `${pad},${h - pad} ${clientsLine} ${pad + (data.length - 1) * stepX},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkClients" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#44ba84" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#44ba84" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={clientsArea} fill="url(#sparkClients)" />
      <polyline points={clientsLine} fill="none" stroke="#44ba84" strokeWidth="2" strokeLinejoin="round" />
      <polyline points={brokersLine} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeDasharray="3 3" />
    </svg>
  );
}

function planLabel(plan: string | null, band: number | null): string {
  if (!plan) return "—";
  if (plan === "growth" && band) return `Growth B${band}`;
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function statusBadgeClass(status: string | null): string {
  switch (status) {
    case "active": return "bg-emerald-100 text-emerald-700";
    case "trialing": return "bg-blue-100 text-blue-700";
    case "past_due":
    case "unpaid": return "bg-amber-100 text-amber-700";
    case "canceled":
    case "cancelled": return "bg-gray-100 text-gray-600";
    default: return "bg-gray-100 text-gray-600";
  }
}

const PAGE_SIZE = 20;

export default function AdminPanel() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const enabled = user?.role === "admin";

  const { data: overview } = useQuery<AdminOverview>({
    queryKey: ["/api/admin/overview"],
    enabled, refetchInterval: 30_000,
  });
  const { data: allClients = [] } = useQuery<AdminClient[]>({ queryKey: ["/api/admin/all-clients"], enabled });
  const { data: allBrokers = [] } = useQuery<AdminBroker[]>({ queryKey: ["/api/admin/all-brokers"], enabled });
  const { data: allCompanies = [] } = useQuery<AdminCompany[]>({ queryKey: ["/api/admin/all-companies"], enabled });
  const { data: adminDeals = [] } = useQuery<AdminAffiliateDeal[]>({ queryKey: ["/api/admin/affiliate-deals"], enabled });
  const dealLabels = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = { ...STATIC_DEAL_LABELS };
    for (const d of adminDeals) m[d.id] = d.storeName;
    return m;
  }, [adminDeals]);
  const [dealsExpanded, setDealsExpanded] = useState(false);
  const { data: rewardQueue = [], isLoading: rewardsLoading } = useQuery<RewardQueueItem[]>({
    queryKey: ["/api/admin/reward-queue"], enabled, refetchInterval: 5000,
  });
  const { data: giftCardStock = [], refetch: refetchStock } = useQuery<Array<{ brandKey: string; brandLabel: string; faceValue: string; pointsCost: number; available: number; redeemed: number; enabled: boolean }>>({
    queryKey: ["/api/admin/gift-cards/stock"], enabled,
  });
  const [gcEditMode, setGcEditMode] = useState<string | null>(null); // null = upload mode, else brandKey being edited
  const [gcForm, setGcForm] = useState({ brandKey: "", brandLabel: "", faceValue: "5.00", pointsCost: "500", codesText: "" });

  const uploadGiftCardsMutation = useMutation({
    mutationFn: async () => {
      const codes = gcForm.codesText.split("\n").map(l => l.trim()).filter(Boolean);
      const res = await fetch("/api/admin/gift-cards/upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandKey: gcForm.brandKey.trim(), brandLabel: gcForm.brandLabel.trim(), faceValue: Number(gcForm.faceValue), pointsCost: Number(gcForm.pointsCost), codes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      return data as { inserted: number };
    },
    onSuccess: (data) => {
      toast.success(`Uploaded ${data.inserted} gift card codes`);
      setGcForm(f => ({ ...f, codesText: "" }));
      refetchStock();
    },
    onError: (err: any) => toast.error(err.message || "Upload failed"),
  });

  const updateGiftCardBrandMutation = useMutation({
    mutationFn: async () => {
      const newCodes = gcForm.codesText.split("\n").map(l => l.trim()).filter(Boolean);
      const res = await fetch(`/api/admin/gift-cards/brand/${gcEditMode}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandLabel: gcForm.brandLabel.trim(), faceValue: Number(gcForm.faceValue), pointsCost: Number(gcForm.pointsCost), newCodes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      return data as { updatedCards: number; addedCodes: number };
    },
    onSuccess: (data) => {
      const parts: string[] = [];
      if (data.updatedCards > 0) parts.push(`${data.updatedCards} cards updated`);
      if (data.addedCodes > 0) parts.push(`${data.addedCodes} new codes added`);
      toast.success(parts.length ? parts.join(", ") : "Brand saved");
      setGcEditMode(null);
      setGcForm({ brandKey: "", brandLabel: "", faceValue: "5.00", pointsCost: "500", codesText: "" });
      refetchStock();
    },
    onError: (err: any) => toast.error(err.message || "Update failed"),
  });

  const toggleGiftCardBrandMutation = useMutation({
    mutationFn: async ({ brandKey, enabled }: { brandKey: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/gift-cards/brand/${brandKey}/toggle`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Toggle failed");
    },
    onSuccess: () => refetchStock(),
    onError: () => toast.error("Failed to toggle reward"),
  });

  const handleGcEdit = async (row: { brandKey: string; brandLabel: string; faceValue: string; pointsCost: number }) => {
    setGcEditMode(row.brandKey);
    setGcForm({ brandKey: row.brandKey, brandLabel: row.brandLabel, faceValue: Number(row.faceValue).toFixed(2), pointsCost: String(row.pointsCost), codesText: "" });
  };

  // Rewards sub-section nav
  const [rewardsSection, setRewardsSection] = useState<'queue' | 'gift-cards' | 'prize-draws' | 'charity' | 'broker-rewards'>('queue');

  // Prize draws
  const { data: prizeDrawsList = [], refetch: refetchDraws } = useQuery<any[]>({
    queryKey: ['/api/admin/prize-draws'], enabled,
  });
  const [pdCreateMode, setPdCreateMode] = useState(false);
  const [pdSelectedId, setPdSelectedId] = useState<number | null>(null);
  const [pdForm, setPdForm] = useState({ title: '', description: '', prize: '', pointsPerEntry: '300', maxEntriesPerClient: '', drawDate: '' });
  const { data: drawEntries = [], refetch: refetchEntries } = useQuery<any[]>({
    queryKey: ['/api/admin/prize-draws', pdSelectedId, 'entries'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/prize-draws/${pdSelectedId}/entries`, { credentials: 'include' });
      return res.json();
    },
    enabled: enabled && !!pdSelectedId,
  });
  const createDrawMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/prize-draws', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: pdForm.title, description: pdForm.description || null, prize: pdForm.prize, pointsPerEntry: Number(pdForm.pointsPerEntry), maxEntriesPerClient: pdForm.maxEntriesPerClient ? Number(pdForm.maxEntriesPerClient) : null, drawDate: pdForm.drawDate || null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: () => { toast.success('Prize draw created!'); setPdCreateMode(false); setPdForm({ title: '', description: '', prize: '', pointsPerEntry: '300', maxEntriesPerClient: '', drawDate: '' }); refetchDraws(); },
    onError: (err: any) => toast.error(err.message || 'Failed to create draw'),
  });
  const closeDrawMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/prize-draws/${id}/close`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: () => { toast.success('Draw closed'); refetchDraws(); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });
  const pickWinnerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/prize-draws/${id}/pick-winner`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: (data: any) => { toast.success(`Winner: ${data.clientName}! 🏆`); refetchDraws(); refetchEntries(); },
    onError: (err: any) => toast.error(err.message || 'Failed to pick winner'),
  });
  const notifyWinnerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/prize-draws/${id}/notify-winner`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: () => { toast.success('Winner notified! 🎉 A notification has been sent to their account.'); refetchDraws(); },
    onError: (err: any) => toast.error(err.message || 'Failed to notify winner'),
  });

  // Charities
  const { data: adminCharities = [], refetch: refetchCharities } = useQuery<any[]>({
    queryKey: ['/api/admin/charities'], enabled,
  });
  const { data: charityDonationsData, refetch: refetchDonations } = useQuery<{ donations: any[]; totals: any[] } | undefined>({
    queryKey: ['/api/admin/charity-donations'], enabled,
  });
  const [charityEditId, setCharityEditId] = useState<number | null>(null);
  const [charityForm, setCharityForm] = useState({ name: '', description: '', logoUrl: '', pointsPerPound: '100' });
  const createCharityMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/charities', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: charityForm.name, description: charityForm.description || null, logoUrl: charityForm.logoUrl || null, pointsPerPound: Number(charityForm.pointsPerPound) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: () => { toast.success('Charity added!'); setCharityForm({ name: '', description: '', logoUrl: '', pointsPerPound: '100' }); setCharityEditId(null); refetchCharities(); refetchDonations(); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });
  const updateCharityMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: any }) => {
      const res = await fetch(`/api/admin/charities/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: () => { toast.success('Charity updated'); setCharityEditId(null); refetchCharities(); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });
  const markFulfilledMutation = useMutation({
    mutationFn: async (charityId: number) => {
      const res = await fetch(`/api/admin/charities/${charityId}/mark-fulfilled`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: (data: any) => { toast.success(`${data.count} donation${data.count !== 1 ? 's' : ''} marked fulfilled`); refetchDonations(); },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const { data: allBrokerSentRewards = [], refetch: refetchBrokerRewards } = useQuery<any[]>({
    queryKey: ['/api/admin/broker-sent-rewards'], enabled, refetchInterval: 10000,
  });

  const updateBrokerRewardStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/broker-sent-rewards/${id}`, { status });
      return res.json();
    },
    onSuccess: () => { toast.success('Status updated'); refetchBrokerRewards(); },
    onError: () => toast.error('Failed to update status'),
  });

  const pendingRewards = rewardQueue.filter(r => r.status === "pending");
  const sentRewards = rewardQueue.filter(r => r.status === "sent");

  const [selectedReward, setSelectedReward] = useState<RewardQueueItem | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client list search + pagination
  const [clientSearch, setClientSearch] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return allClients;
    return allClients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.brokerName || "").toLowerCase().includes(q)
    );
  }, [allClients, clientSearch]);
  const clientPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const safeClientPage = Math.min(clientPage, clientPages);
  const pagedClients = filteredClients.slice((safeClientPage - 1) * PAGE_SIZE, safeClientPage * PAGE_SIZE);
  useEffect(() => { setClientPage(1); }, [clientSearch]);

  const handleQrUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setQrPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const uploadQrMutation = useMutation({
    mutationFn: async ({ rewardId, qrCodeData }: { rewardId: number; qrCodeData: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/reward-queue/${rewardId}`, { qrCodeData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reward-queue"] });
      toast.success("QR code uploaded!");
    },
    onError: () => toast.error("Failed to upload QR code"),
  });

  const sendRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest("POST", `/api/admin/reward-queue/${rewardId}/send`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reward-queue"] });
      setSelectedReward(null); setQrPreview(null);
      toast.success("Reward sent to client!");
    },
    onError: () => toast.error("Failed to send reward"),
  });

  const queueCostaRewardMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const res = await apiRequest("POST", "/api/admin/queue-costa-reward", { clientId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reward-queue"] });
      toast.success("Costa reward queued!");
    },
    onError: () => toast.error("Failed to queue reward"),
  });

  const assignBrokerMutation = useMutation({
    mutationFn: async ({ clientId, brokerUserId }: { clientId: number; brokerUserId: string | null }) => {
      const res = await apiRequest("PATCH", `/api/admin/clients/${clientId}/assign-broker`, { brokerUserId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-clients"] });
      toast.success("Broker assigned!");
    },
    onError: () => toast.error("Failed to assign broker"),
  });

  const handleAssignBroker = (clientId: number, brokerUserId: string) => {
    assignBrokerMutation.mutate({ clientId, brokerUserId: brokerUserId === "unassigned" ? null : brokerUserId });
  };

  const assignCompanyMutation = useMutation({
    mutationFn: async ({ brokerUserId, companyId }: { brokerUserId: string; companyId: number | null }) => {
      const res = await apiRequest("PATCH", `/api/admin/brokers/${brokerUserId}/assign-company`, { companyId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-brokers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-companies"] });
      toast.success("Company assigned!");
    },
    onError: () => toast.error("Failed to assign company"),
  });

  const handleAssignCompany = (brokerUserId: string, value: string) => {
    assignCompanyMutation.mutate({ brokerUserId, companyId: value === "unassigned" ? null : Number(value) });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || user.role !== "admin") return null;

  const top = overview?.marketplace.topDeals || [];
  const topMax = Math.max(1, ...top.map(d => d.clicks));
  const tab = overview?.marketplace.byTab || { home: 0, finance: 0, leisure: 0 };
  const tabTotal = tab.home + tab.finance + tab.leisure;
  const pct = (n: number) => (tabTotal ? Math.round((n / tabTotal) * 100) : 0);

  // Tile deltas
  const dToday = (overview?.signupsToday ?? 0) - (overview?.signupsYesterday ?? 0);
  const dClients = (overview?.clientSignupsToday ?? 0) - (overview?.clientSignupsYesterday ?? 0);
  const dBrokers = (overview?.brokerSignupsToday ?? 0) - (overview?.brokerSignupsYesterday ?? 0);
  const dCompanies = (overview?.companySignupsToday ?? 0) - (overview?.companySignupsYesterday ?? 0);
  const dActive = (overview?.activeThisWeek ?? 0) - (overview?.activeLastWeek ?? 0);
  const dLiveNow = (overview?.liveNow ?? 0) - (overview?.liveNowPrev5m ?? 0);
  const dClicks = (overview?.marketplace.clicks24h ?? 0) - (overview?.marketplace.clicksPrev24h ?? 0);

  return (
    <div className="min-h-screen relative" style={{ background: "linear-gradient(180deg, #f7fbf9 0%, #f9faf6 100%)" }}>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-green-100/40 via-emerald-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/30 via-indigo-50/15 to-transparent rounded-full blur-3xl" />
      </div>

      <header className="bg-white/70 backdrop-blur-md border-b border-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin">
              <img src="/logo.png" alt="Uprosper" className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
              <Button variant="outline" size="sm" onClick={() => logout()} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900" data-testid="text-admin-title">Admin overview</h1>
          <p className="text-muted-foreground mt-1">Live ops snapshot · KPIs, growth, marketplace, subscriptions</p>
        </div>

        {/* KPI Strip - 6 tiles per spec */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiTile icon={Users} label="Total users" value={overview?.totalUsers ?? "—"} accent="#44ba84"
            testId="kpi-total-users" delta={dToday} deltaTestId="kpi-total-users-delta" />
          <KpiTile icon={Activity} label="Live now" value={overview?.liveNow ?? "—"} accent="#f43f5e"
            testId="kpi-live-now" delta={dLiveNow} deltaTestId="kpi-live-now-delta"
            sublabel="active < 5 min ago" />
          <KpiTile icon={TrendingUp} label="Active this week" value={overview?.activeThisWeek ?? "—"} accent="#f59e0b"
            testId="kpi-active-7d" delta={dActive} deltaTestId="kpi-active-7d-delta" />
          <KpiTile icon={Users} label="Clients" value={overview?.totalClients ?? "—"} accent="#3b82f6"
            testId="kpi-total-clients" delta={dClients} deltaTestId="kpi-total-clients-delta" />
          <KpiTile icon={UserCheck} label="Brokers" value={overview?.totalBrokers ?? "—"} accent="#10b981"
            testId="kpi-total-brokers" delta={dBrokers} deltaTestId="kpi-total-brokers-delta" />
          <KpiTile icon={Building2} label="Companies" value={overview?.totalCompanies ?? "—"} accent="#8b5cf6"
            testId="kpi-total-companies" delta={dCompanies} deltaTestId="kpi-total-companies-delta" />
        </div>

        {/* Affiliate marketplace + Subscription health */}
        <LayoutGroup>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div layout transition={{ type: "spring", stiffness: 260, damping: 30 }} className={dealsExpanded ? "lg:col-span-2" : ""}>
          <BentoCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(68,186,132,0.12)" }}>
                <ShoppingBag className="w-5 h-5" style={{ color: "#44ba84" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-gray-900">Affiliate marketplace</h3>
                <p className="text-xs text-muted-foreground">Click tracking across CJ partners</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDealsExpanded(v => !v); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-[1.03]"
                style={{ color: '#44ba84', background: 'rgba(68,186,132,0.10)', border: '1px solid rgba(68,186,132,0.25)' }}
                data-testid="button-manage-affiliate-deals"
                aria-expanded={dealsExpanded}
                aria-controls="affiliate-deals-manager-region"
              >
                {dealsExpanded ? <><XIcon className="w-3.5 h-3.5" /> Close</> : <><Settings className="w-3.5 h-3.5" /> Manage</>}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.025)" }}>
                <p className="text-[11px] text-muted-foreground">24 hours</p>
                <p className="text-lg font-bold text-gray-900" data-testid="text-clicks-24h">{overview?.marketplace.clicks24h ?? 0}</p>
                <Delta value={dClicks} testId="text-clicks-24h-delta" />
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.025)" }}>
                <p className="text-[11px] text-muted-foreground">7 days</p>
                <p className="text-lg font-bold text-gray-900" data-testid="text-clicks-7d">{overview?.marketplace.clicks7d ?? 0}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.025)" }}>
                <p className="text-[11px] text-muted-foreground">30 days</p>
                <p className="text-lg font-bold text-gray-900" data-testid="text-clicks-30d">{overview?.marketplace.clicks30d ?? 0}</p>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Home / Finance / Leisure (30d)</span>
                <span className="font-medium text-gray-700">{pct(tab.home)}% / {pct(tab.finance)}% / {pct(tab.leisure)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div className="h-full" style={{ width: `${pct(tab.home)}%`, background: "#44ba84" }} data-testid="bar-tab-home" />
                <div className="h-full" style={{ width: `${pct(tab.finance)}%`, background: "#f59e0b" }} data-testid="bar-tab-finance" />
                <div className="h-full" style={{ width: `${pct(tab.leisure)}%`, background: "#a78bfa" }} data-testid="bar-tab-leisure" />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#44ba84" }} /> Home {tab.home}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} /> Finance {tab.finance}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#a78bfa" }} /> Leisure {tab.leisure}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Top 5 deals (30d)</p>
              {top.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No clicks yet</p>
              ) : (
                <div className="space-y-1.5">
                  {top.map(d => (
                    <div key={d.dealId} className="flex items-center gap-3" data-testid={`bar-deal-${d.dealId}`}>
                      <span className="text-xs text-gray-700 w-24 shrink-0 truncate">{dealLabels[d.dealId] || d.dealId}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
                        <div className="h-full rounded-full" style={{ width: `${(d.clicks / topMax) * 100}%`, background: "#44ba84" }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-8 text-right">{d.clicks}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence initial={false}>
              {dealsExpanded && (
                <motion.div
                  key="deals-manager-inline"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                  id="affiliate-deals-manager-region"
                  role="region"
                  aria-labelledby="affiliate-deals-manager-heading"
                  data-testid="dialog-affiliate-deals-manager"
                >
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <AffiliateDealsManager
                      expanded={dealsExpanded}
                      deals={adminDeals}
                      dealLabels={dealLabels}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </BentoCard>
          </motion.div>

          <motion.div layout transition={{ type: "spring", stiffness: 260, damping: 30 }}>
          <BentoCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
                <CreditCard className="w-5 h-5" style={{ color: "#8b5cf6" }} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-gray-900">Subscription health</h3>
                <p className="text-xs text-muted-foreground">Stripe-synced broker plans</p>
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4" style={{ background: "linear-gradient(135deg, rgba(68,186,132,0.10), rgba(68,186,132,0.04))", border: "1px solid rgba(68,186,132,0.2)" }}>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Estimated MRR</p>
                  <p className="text-2xl font-heading font-bold text-gray-900" data-testid="text-mrr-estimate">
                    £{(overview?.subscriptions.mrrEstimate ?? 0).toLocaleString()}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground">active subs only</span>
              </div>
            </div>

            <p className="text-xs font-medium text-gray-700 mb-2">Active by plan</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.025)" }} data-testid="active-starter">
                <span className="text-xs text-gray-700">Starter</span>
                <span className="text-sm font-bold text-gray-900">{overview?.subscriptions.activeStarter ?? 0}</span>
              </div>
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.025)" }} data-testid="active-growth-1">
                <span className="text-xs text-gray-700">Growth B1</span>
                <span className="text-sm font-bold text-gray-900">{overview?.subscriptions.activeGrowthBand1 ?? 0}</span>
              </div>
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.025)" }} data-testid="active-growth-2">
                <span className="text-xs text-gray-700">Growth B2</span>
                <span className="text-sm font-bold text-gray-900">{overview?.subscriptions.activeGrowthBand2 ?? 0}</span>
              </div>
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.025)" }} data-testid="active-growth-3">
                <span className="text-xs text-gray-700">Growth B3</span>
                <span className="text-sm font-bold text-gray-900">{overview?.subscriptions.activeGrowthBand3 ?? 0}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700" data-testid="status-trialing">
                trialing · {overview?.subscriptions.trialing ?? 0}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600" data-testid="status-cancelled">
                cancelled · {overview?.subscriptions.cancelled ?? 0}
              </span>
              {(overview?.subscriptions.byStatus ?? [])
                .filter(s => !["active", "trialing", "canceled", "cancelled"].includes(s.status))
                .map(s => (
                  <span key={s.status} className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(s.status)}`} data-testid={`status-${s.status}`}>
                    {s.status} · {s.count}
                  </span>
                ))}
            </div>
          </BentoCard>
          </motion.div>
        </div>
        </LayoutGroup>

        {/* Growth: signups by day, clients vs brokers */}
        <BentoCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(68,186,132,0.12)" }}>
                <TrendingUp className="w-5 h-5" style={{ color: "#44ba84" }} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-gray-900">Signup growth (30d)</h3>
                <p className="text-xs text-muted-foreground">Clients vs brokers, daily</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ background: "#44ba84" }} /> Clients</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: "#3b82f6" }} /> Brokers</span>
              <span className="text-2xl font-heading font-bold text-gray-900 ml-3" data-testid="text-signups-30d">{overview?.newSignups30d ?? 0}</span>
            </div>
          </div>
          <MultiSparkline data={overview?.signupsByDay ?? []} />
        </BentoCard>

        {/* Tabs */}
        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients" data-testid="tab-all-clients"><Users className="w-4 h-4 mr-1" />Clients ({allClients.length})</TabsTrigger>
            <TabsTrigger value="brokers" data-testid="tab-all-brokers"><UserCheck className="w-4 h-4 mr-1" />Brokers ({allBrokers.length})</TabsTrigger>
            <TabsTrigger value="companies" data-testid="tab-all-companies"><Building2 className="w-4 h-4 mr-1" />Companies ({allCompanies.length})</TabsTrigger>
            <TabsTrigger value="assignments" data-testid="tab-assignments"><Briefcase className="w-4 h-4 mr-1" />Assignments</TabsTrigger>
            <TabsTrigger value="rewards" data-testid="tab-rewards">
              <Coffee className="w-4 h-4 mr-1" />Rewards
              {pendingRewards.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">{pendingRewards.length}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <BentoCard>
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h3 className="font-heading font-bold text-gray-900">All clients</h3>
                <div className="relative w-64 max-w-full">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Search name, email or broker"
                    className="pl-8 h-9 text-sm"
                    data-testid="input-client-search"
                  />
                </div>
              </div>
              {filteredClients.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">{clientSearch ? "No matches" : "No client users yet"}</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last active</TableHead>
                          <TableHead>Journey</TableHead>
                          <TableHead>Broker</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedClients.map(c => (
                          <TableRow key={c.userId} data-testid={`row-client-${c.userId}`}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                            <TableCell className="text-sm">{c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy") : "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {c.lastActiveAt ? formatDistanceToNow(new Date(c.lastActiveAt), { addSuffix: true }) : "Never"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2" data-testid={`journey-${c.userId}`}>
                                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                                  <div className="h-full rounded-full" style={{ width: `${(c.completedSteps / c.totalSteps) * 100}%`, background: "#44ba84" }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{c.completedSteps}/{c.totalSteps}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{c.brokerName || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span data-testid="text-client-page-info">
                      Showing {(safeClientPage - 1) * PAGE_SIZE + 1}–{Math.min(safeClientPage * PAGE_SIZE, filteredClients.length)} of {filteredClients.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" disabled={safeClientPage === 1}
                        onClick={() => setClientPage(p => Math.max(1, p - 1))}
                        data-testid="button-clients-prev"
                      ><ChevronLeft className="w-4 h-4" /></Button>
                      <span className="text-xs">Page {safeClientPage} / {clientPages}</span>
                      <Button size="sm" variant="outline" disabled={safeClientPage === clientPages}
                        onClick={() => setClientPage(p => Math.min(clientPages, p + 1))}
                        data-testid="button-clients-next"
                      ><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </>
              )}
            </BentoCard>
          </TabsContent>

          <TabsContent value="brokers">
            <BentoCard>
              <h3 className="font-heading font-bold text-gray-900 mb-3">All brokers</h3>
              {allBrokers.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No brokers yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Clients</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Last active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBrokers.map(b => (
                        <TableRow key={b.id} data-testid={`row-broker-${b.id}`}>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{b.email}</TableCell>
                          <TableCell className="font-mono text-xs">{b.brokerCode || "—"}</TableCell>
                          <TableCell className="text-sm">
                            <Select
                              value={b.companyId ? String(b.companyId) : "unassigned"}
                              onValueChange={(v) => handleAssignCompany(b.id, v)}
                            >
                              <SelectTrigger className="w-44" data-testid={`select-broker-company-${b.id}`}>
                                <SelectValue placeholder="Unassigned" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {allCompanies.map(co => (
                                  <SelectItem key={co.id} value={String(co.id)}>{co.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm">{planLabel(b.plan, b.growthBand)}</TableCell>
                          <TableCell>
                            {b.subscriptionStatus ? (
                              <Badge className={`border-0 ${statusBadgeClass(b.subscriptionStatus)}`} data-testid={`badge-broker-status-${b.id}`}>{b.subscriptionStatus}</Badge>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{b.clientCount}</TableCell>
                          <TableCell className="text-sm">{b.createdAt ? format(new Date(b.createdAt), "MMM d, yyyy") : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {b.lastActiveAt ? formatDistanceToNow(new Date(b.lastActiveAt), { addSuffix: true }) : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </BentoCard>
          </TabsContent>

          <TabsContent value="companies">
            <BentoCard>
              <h3 className="font-heading font-bold text-gray-900 mb-3">All companies</h3>
              {allCompanies.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No companies yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Brokers</TableHead>
                        <TableHead>Clients</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCompanies.map(co => (
                        <TableRow key={co.id} data-testid={`row-company-${co.id}`}>
                          <TableCell className="font-medium">{co.name}</TableCell>
                          <TableCell className="font-mono text-xs">{co.companyCode}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{co.contactEmail}</TableCell>
                          <TableCell className="text-sm font-medium">{co.brokerCount}</TableCell>
                          <TableCell className="text-sm font-medium">{co.clientCount}</TableCell>
                          <TableCell className="text-sm">{co.createdAt ? format(new Date(co.createdAt), "MMM d, yyyy") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </BentoCard>
          </TabsContent>

          <TabsContent value="assignments">
            <BentoCard>
              <h3 className="font-heading font-bold text-gray-900 mb-1">Client → Broker assignments</h3>
              <p className="text-xs text-muted-foreground mb-4">Assign clients to brokers. Only assigned clients appear in a broker's dashboard.</p>
              {allClients.filter(c => c.clientId !== null).length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No clients to assign</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned broker</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allClients.filter(c => c.clientId !== null).map(c => (
                        <TableRow key={c.userId} data-testid={`row-assignment-${c.clientId}`}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                          <TableCell>
                            {c.status ? (
                              <Badge className={`border-0 ${c.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{c.status}</Badge>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Select value={c.brokerUserId || "unassigned"} onValueChange={(v) => handleAssignBroker(c.clientId!, v)}>
                              <SelectTrigger className="w-48" data-testid={`select-broker-${c.clientId}`}>
                                <SelectValue placeholder="Select broker" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {allBrokers.map(b => (
                                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </BentoCard>
          </TabsContent>

          <TabsContent value="rewards">
            {/* Sub-nav */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {([
                { key: 'queue', label: 'Costa Queue' },
                { key: 'gift-cards', label: 'Gift Cards' },
                { key: 'prize-draws', label: 'Prize Draws' },
                { key: 'charity', label: 'Charity' },
                { key: 'broker-rewards', label: 'Broker Rewards' },
              ] as { key: 'queue' | 'gift-cards' | 'prize-draws' | 'charity' | 'broker-rewards'; label: string }[]).map(({ key, label }) => {
                const active = rewardsSection === key;
                return (
                  <button
                    key={key}
                    onClick={() => setRewardsSection(key)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
                    style={{ background: active ? '#44ba84' : 'rgba(0,0,0,0.05)', color: active ? '#fff' : '#6b7280', border: `1px solid ${active ? 'rgba(68,186,132,0.3)' : 'transparent'}` }}
                    data-testid={`button-rewards-nav-${key}`}
                  >
                    {label}
                    {key === 'queue' && pendingRewards.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">{pendingRewards.length}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Costa Queue ── */}
            {rewardsSection === 'queue' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BentoCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(251,191,36,0.15)" }}>
                    <Gift className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-gray-900" data-testid="text-due-rewards-title">Due rewards</h3>
                    <p className="text-xs text-muted-foreground">{pendingRewards.length} client{pendingRewards.length !== 1 ? "s" : ""} awaiting Costa reward</p>
                  </div>
                </div>
                {rewardsLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : pendingRewards.length === 0 ? (
                  <div className="text-center py-8">
                    <Coffee className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No pending rewards</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {pendingRewards.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        className={`w-full text-left rounded-xl p-3 transition-all hover:scale-[1.005] ${selectedReward?.id === r.id ? "ring-2 ring-amber-400" : ""}`}
                        style={{
                          background: selectedReward?.id === r.id ? "rgba(251,191,36,0.08)" : "rgba(0,0,0,0.025)",
                          border: `1px solid ${selectedReward?.id === r.id ? "rgba(251,191,36,0.3)" : "rgba(0,0,0,0.05)"}`,
                        }}
                        onClick={() => { setSelectedReward(r); setQrPreview(r.qrCodeData); }}
                        data-testid={`reward-item-${r.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(68,186,132,0.12)" }}>
                              <Coffee className="w-4 h-4" style={{ color: "#44ba84" }} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{r.clientName}</p>
                              <p className="text-xs text-muted-foreground truncate">{r.clientEmail}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs">{r.stepTitle}</Badge>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(r.createdAt), "MMM d")}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </BentoCard>

              <BentoCard>
                {selectedReward ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(68,186,132,0.12)" }}>
                        <Send className="w-5 h-5" style={{ color: "#44ba84" }} />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-gray-900">Send reward</h3>
                        <p className="text-xs text-muted-foreground">Upload QR & send to {selectedReward.clientName}</p>
                      </div>
                    </div>
                    <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Coffee className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-sm">Costa Coffee Gift Card</span>
                      </div>
                      <p className="text-xs text-muted-foreground">For: <span className="font-medium text-gray-700">{selectedReward.stepTitle}</span></p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQrUpload} className="hidden" data-testid="input-qr-upload" />
                    {qrPreview ? (
                      <div className="relative mb-3">
                        <div className="rounded-xl p-3 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.08)" }}>
                          <img src={qrPreview} alt="QR Preview" className="max-w-[180px] max-h-[180px] object-contain rounded-lg" data-testid="img-qr-preview" />
                        </div>
                        <button
                          onClick={() => { setQrPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)" }}
                        >✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-6 rounded-xl flex flex-col items-center gap-2 mb-3"
                        style={{ background: "rgba(0,0,0,0.025)", border: "2px dashed rgba(0,0,0,0.1)" }}
                        data-testid="button-upload-qr"
                      >
                        <Upload className="w-5 h-5 text-muted-foreground/50" />
                        <span className="text-sm text-muted-foreground">Click to upload QR code</span>
                      </button>
                    )}
                    <div className="flex gap-2">
                      {qrPreview && !selectedReward.qrCodeData && (
                        <Button
                          onClick={() => uploadQrMutation.mutate({ rewardId: selectedReward.id, qrCodeData: qrPreview })}
                          disabled={uploadQrMutation.isPending}
                          variant="outline"
                          className="flex-1 rounded-xl"
                          style={{ background: "rgba(68,186,132,0.15)", color: "#44ba84", border: "1px solid rgba(68,186,132,0.3)" }}
                          data-testid="button-save-qr"
                        >
                          {uploadQrMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Image className="w-4 h-4 mr-2" />}
                          Save QR
                        </Button>
                      )}
                      <Button
                        onClick={async () => {
                          if (qrPreview && !selectedReward.qrCodeData) {
                            await uploadQrMutation.mutateAsync({ rewardId: selectedReward.id, qrCodeData: qrPreview });
                          }
                          sendRewardMutation.mutate(selectedReward.id);
                        }}
                        disabled={!qrPreview || sendRewardMutation.isPending || uploadQrMutation.isPending}
                        className="flex-1 rounded-xl text-white font-semibold"
                        style={{ background: "#44ba84" }}
                        data-testid="button-send-reward"
                      >
                        {sendRewardMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Send
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(0,0,0,0.03)" }}>
                      <Coffee className="w-7 h-7 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Select a pending reward</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Click an item from the list to upload & send</p>
                  </div>
                )}
              </BentoCard>

              <div className="lg:col-span-2">
                <BentoCard>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)" }}>
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-gray-900">Queue Costa rewards</h3>
                      <p className="text-xs text-muted-foreground">Trigger a reward for any client</p>
                    </div>
                  </div>
                  {allClients.filter(c => c.clientId !== null).length === 0 ? (
                    <p className="text-center py-8 text-sm text-muted-foreground">No clients yet</p>
                  ) : (
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Rewards</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allClients.filter(c => c.clientId !== null).map(c => {
                            const cr = rewardQueue.filter(r => r.clientId === c.clientId);
                            const p = cr.filter(r => r.status === "pending").length;
                            const s = cr.filter(r => r.status === "sent").length;
                            return (
                              <TableRow key={c.userId} data-testid={`row-journey-${c.userId}`}>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                                      <div className="h-full rounded-full" style={{ width: `${(c.completedSteps / c.totalSteps) * 100}%`, background: "#44ba84" }} />
                                    </div>
                                    <span className="text-xs text-muted-foreground">{c.completedSteps}/{c.totalSteps}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    {p > 0 && <Badge className="bg-amber-50 text-amber-700 border-0 text-xs">{p} pending</Badge>}
                                    {s > 0 && <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs">{s} sent</Badge>}
                                    {cr.length === 0 && <span className="text-xs text-muted-foreground/50">—</span>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg text-xs border-0"
                                    style={{ background: "rgba(109,8,57,0.08)", color: "#6d0839" }}
                                    disabled={queueCostaRewardMutation.isPending || !c.clientId}
                                    onClick={(e) => { e.stopPropagation(); if (c.clientId) queueCostaRewardMutation.mutate(c.clientId); }}
                                    data-testid={`button-send-costa-${c.userId}`}
                                  >
                                    <Coffee className="w-3.5 h-3.5 mr-1" />Send Costa
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </BentoCard>
              </div>

              {sentRewards.length > 0 && (
                <div className="lg:col-span-2">
                  <BentoCard>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
                        <Send className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-gray-900">Sent rewards</h3>
                        <p className="text-xs text-muted-foreground">{sentRewards.length} delivered</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Step</TableHead>
                            <TableHead>Sent</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sentRewards.map(r => (
                            <TableRow key={r.id} data-testid={`row-sent-${r.id}`}>
                              <TableCell className="font-medium">{r.clientName}</TableCell>
                              <TableCell className="text-sm">{r.stepTitle}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {r.sentAt ? format(new Date(r.sentAt), "MMM d, yyyy HH:mm") : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </BentoCard>
                </div>
              )}
            </div>
            )}

            {/* ── Gift Cards ── */}
            {rewardsSection === 'gift-cards' && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(190,49,68,0.1)" }}>
                  <CreditCard className="w-4 h-4" style={{ color: "#be3144" }} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-gray-900">Gift Card Stock</h3>
                  <p className="text-xs text-muted-foreground">Upload codes for clients to redeem with points</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Upload / Edit form */}
                <BentoCard>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-gray-900">
                      {gcEditMode ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: "rgba(190,49,68,0.1)", color: "#be3144" }}>Editing</span>
                          {gcForm.brandLabel || gcEditMode}
                        </span>
                      ) : "Upload Codes"}
                    </h4>
                    {gcEditMode && (
                      <button
                        className="text-xs text-muted-foreground hover:text-gray-700 underline"
                        onClick={() => { setGcEditMode(null); setGcForm({ brandKey: "", brandLabel: "", faceValue: "5.00", pointsCost: "500", codesText: "" }); }}
                        data-testid="button-gc-cancel-edit"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Brand Key <span className="text-red-400">*</span></label>
                        <Input
                          placeholder="e.g. starbucks"
                          value={gcForm.brandKey}
                          onChange={e => !gcEditMode && setGcForm(f => ({ ...f, brandKey: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                          readOnly={!!gcEditMode}
                          className={`h-8 text-sm ${gcEditMode ? "opacity-50 cursor-not-allowed" : ""}`}
                          data-testid="input-gc-brand-key"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Brand Label <span className="text-red-400">*</span></label>
                        <Input
                          placeholder="e.g. Starbucks"
                          value={gcForm.brandLabel}
                          onChange={e => setGcForm(f => ({ ...f, brandLabel: e.target.value }))}
                          className="h-8 text-sm"
                          data-testid="input-gc-brand-label"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Face Value (£)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={gcForm.faceValue}
                          onChange={e => setGcForm(f => ({ ...f, faceValue: e.target.value }))}
                          className="h-8 text-sm"
                          data-testid="input-gc-face-value"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Points Cost</label>
                        <Input
                          type="number"
                          min="1"
                          value={gcForm.pointsCost}
                          onChange={e => setGcForm(f => ({ ...f, pointsCost: e.target.value }))}
                          className="h-8 text-sm"
                          data-testid="input-gc-points-cost"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        {gcEditMode ? "Add New Codes (optional, one per line)" : "Codes (one per line, optional PIN after tab or comma)"}
                      </label>
                      <textarea
                        placeholder={"STBX-1234-ABCD\nSTBX-5678-EFGH\t1234\nSTBX-9012-IJKL,5678"}
                        value={gcForm.codesText}
                        onChange={e => setGcForm(f => ({ ...f, codesText: e.target.value }))}
                        rows={5}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        data-testid="textarea-gc-codes"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {gcForm.codesText.split("\n").filter(l => l.trim()).length} {gcEditMode ? "new codes to add" : "codes entered"}
                      </p>
                    </div>
                    {gcEditMode ? (
                      <Button
                        onClick={() => updateGiftCardBrandMutation.mutate()}
                        disabled={updateGiftCardBrandMutation.isPending || !gcForm.brandLabel}
                        className="w-full rounded-xl text-white font-semibold"
                        style={{ background: "#be3144" }}
                        data-testid="button-save-gc-brand"
                      >
                        {updateGiftCardBrandMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>
                    ) : (
                      <Button
                        onClick={() => uploadGiftCardsMutation.mutate()}
                        disabled={uploadGiftCardsMutation.isPending || !gcForm.brandKey || !gcForm.brandLabel || !gcForm.codesText.trim()}
                        className="w-full rounded-xl text-white font-semibold"
                        style={{ background: "#be3144" }}
                        data-testid="button-upload-gift-cards"
                      >
                        {uploadGiftCardsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload Gift Cards
                      </Button>
                    )}
                  </div>
                </BentoCard>

                {/* Stock overview */}
                <BentoCard>
                  <h4 className="font-semibold text-sm text-gray-900 mb-3">Stock Overview</h4>
                  {giftCardStock.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <CreditCard className="w-8 h-8 text-muted-foreground/20 mb-2" />
                      <p className="text-sm text-muted-foreground">No gift cards uploaded yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Upload codes using the form to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {giftCardStock.map(row => (
                        <div
                          key={row.brandKey}
                          className={`rounded-xl p-3 transition-all duration-200 ${gcEditMode === row.brandKey ? "ring-2" : ""}`}
                          style={{
                            background: gcEditMode === row.brandKey ? "rgba(190,49,68,0.04)" : "rgba(0,0,0,0.025)",
                            border: `1px solid ${gcEditMode === row.brandKey ? "rgba(190,49,68,0.3)" : "rgba(0,0,0,0.06)"}`,
                            ...(gcEditMode === row.brandKey ? { "--tw-ring-color": "rgba(190,49,68,0.3)" } as any : {}),
                          }}
                          data-testid={`row-gc-stock-${row.brandKey}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-sm text-gray-900 truncate">{row.brandLabel}</p>
                                {!row.enabled && (
                                  <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-1 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.06)", color: "#9ca3af" }}>Off</span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">{row.brandKey} · £{Number(row.faceValue).toFixed(2)} · {row.pointsCost.toLocaleString()} pts</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Toggle */}
                              <button
                                onClick={() => toggleGiftCardBrandMutation.mutate({ brandKey: row.brandKey, enabled: !row.enabled })}
                                disabled={toggleGiftCardBrandMutation.isPending}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${row.enabled ? "bg-emerald-500" : "bg-gray-300"}`}
                                data-testid={`toggle-gc-${row.brandKey}`}
                                title={row.enabled ? "Disable (hide from clients)" : "Enable (show to clients)"}
                              >
                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${row.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                              </button>
                              {/* Edit */}
                              <button
                                onClick={() => handleGcEdit(row)}
                                className="px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors duration-150"
                                style={{ background: "rgba(190,49,68,0.08)", color: "#be3144" }}
                                data-testid={`button-gc-edit-${row.brandKey}`}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 rounded-lg px-2 py-1 text-center text-[11px]" style={{ background: "rgba(16,185,129,0.08)" }}>
                              <span className="font-semibold text-emerald-700">{row.available}</span>
                              <span className="text-muted-foreground ml-1">available</span>
                            </div>
                            <div className="flex-1 rounded-lg px-2 py-1 text-center text-[11px]" style={{ background: "rgba(0,0,0,0.04)" }}>
                              <span className="font-semibold text-gray-700">{row.redeemed}</span>
                              <span className="text-muted-foreground ml-1">redeemed</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </BentoCard>
              </div>
            </div>
            )}

            {/* ── Prize Draws ── */}
            {rewardsSection === 'prize-draws' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BentoCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
                      <Ticket className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-gray-900">Prize Draws</h3>
                      <p className="text-xs text-muted-foreground">{prizeDrawsList.length} total</p>
                    </div>
                  </div>
                  {pdCreateMode ? (
                    <button onClick={() => setPdCreateMode(false)} className="text-xs text-muted-foreground underline" data-testid="button-draw-cancel">Cancel</button>
                  ) : (
                    <button
                      onClick={() => { setPdCreateMode(true); setPdSelectedId(null); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
                      style={{ background: "#7c3aed" }}
                      data-testid="button-create-draw"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Draw
                    </button>
                  )}
                </div>
                {pdCreateMode ? (
                  <div className="space-y-3">
                    <Field label="Title *">
                      <Input value={pdForm.title} onChange={e => setPdForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Prize Draw" className="h-9 text-sm" data-testid="input-draw-title" />
                    </Field>
                    <Field label="Prize Description *">
                      <Input value={pdForm.prize} onChange={e => setPdForm(f => ({ ...f, prize: e.target.value }))} placeholder="e.g. £500 Amazon voucher" className="h-9 text-sm" data-testid="input-draw-prize" />
                    </Field>
                    <Field label="Description (optional)">
                      <Input value={pdForm.description} onChange={e => setPdForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details" className="h-9 text-sm" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Points per entry">
                        <Input type="number" value={pdForm.pointsPerEntry} onChange={e => setPdForm(f => ({ ...f, pointsPerEntry: e.target.value }))} className="h-9 text-sm" data-testid="input-draw-points" />
                      </Field>
                      <Field label="Max entries/client">
                        <Input type="number" value={pdForm.maxEntriesPerClient} onChange={e => setPdForm(f => ({ ...f, maxEntriesPerClient: e.target.value }))} placeholder="Unlimited" className="h-9 text-sm" />
                      </Field>
                    </div>
                    <Field label="Draw date (optional)">
                      <Input type="date" value={pdForm.drawDate} onChange={e => setPdForm(f => ({ ...f, drawDate: e.target.value }))} className="h-9 text-sm" />
                    </Field>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1" onClick={() => createDrawMutation.mutate()} disabled={!pdForm.title.trim() || !pdForm.prize.trim() || createDrawMutation.isPending} data-testid="button-draw-submit" style={{ background: "#7c3aed", color: "#fff" }}>
                        {createDrawMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Creating…</> : 'Create Draw'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPdCreateMode(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : prizeDrawsList.length === 0 ? (
                  <div className="py-10 text-center">
                    <Ticket className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No draws yet — click New Draw to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {prizeDrawsList.map((draw: any) => (
                      <button
                        key={draw.id}
                        onClick={() => { setPdSelectedId(draw.id); setPdCreateMode(false); }}
                        className={`w-full text-left rounded-xl p-3 transition-all hover:scale-[1.005] ${pdSelectedId === draw.id ? 'ring-2 ring-violet-400' : ''}`}
                        style={{ background: pdSelectedId === draw.id ? 'rgba(139,92,246,0.06)' : 'rgba(0,0,0,0.025)', border: `1px solid ${pdSelectedId === draw.id ? 'rgba(139,92,246,0.25)' : 'rgba(0,0,0,0.05)'}` }}
                        data-testid={`button-draw-${draw.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{draw.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{draw.prize}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${draw.status === 'active' ? 'bg-emerald-100 text-emerald-700' : draw.status === 'drawn' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>{draw.status}</span>
                            <span className="text-[11px] text-muted-foreground">{draw.totalEntries} entr{draw.totalEntries !== 1 ? 'ies' : 'y'}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </BentoCard>

              <BentoCard>
                {pdSelectedId ? (() => {
                  const draw = prizeDrawsList.find((d: any) => d.id === pdSelectedId);
                  if (!draw) return null;
                  const winnerEntry = draw.winnerEntryId ? drawEntries.find((e: any) => e.id === draw.winnerEntryId) : null;
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
                          <Trophy className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-bold text-gray-900 truncate">{draw.title}</h3>
                          <p className="text-xs text-muted-foreground">{draw.uniqueParticipants} participant{draw.uniqueParticipants !== 1 ? 's' : ''} · {draw.totalEntries} entr{draw.totalEntries !== 1 ? 'ies' : 'y'}</p>
                        </div>
                      </div>
                      {winnerEntry && (
                        <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                          <p className="text-xs font-bold uppercase tracking-wide text-violet-600 mb-1">🏆 Winner</p>
                          <p className="font-semibold text-sm text-gray-900">{winnerEntry.clientName}</p>
                          <p className="text-xs text-muted-foreground">{winnerEntry.clientEmail}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{winnerEntry.numEntries} entries submitted</p>
                        </div>
                      )}
                      {(draw.status === 'active' || draw.status === 'closed') && (
                        <div className="flex gap-2 mb-4">
                          {draw.status === 'active' && (
                            <Button size="sm" variant="outline" onClick={() => closeDrawMutation.mutate(draw.id)} disabled={closeDrawMutation.isPending} className="flex-1" data-testid="button-close-draw">
                              {closeDrawMutation.isPending ? 'Closing…' : 'Close Draw'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => pickWinnerMutation.mutate(draw.id)}
                            disabled={pickWinnerMutation.isPending || draw.totalEntries === 0}
                            className="flex-1"
                            data-testid="button-pick-winner"
                            style={{ background: '#7c3aed', color: '#fff' }}
                          >
                            {pickWinnerMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Picking…</> : '🎯 Pick Winner'}
                          </Button>
                        </div>
                      )}
                      {draw.status === 'drawn' && !draw.winnerNotified && (
                        <div className="mb-4">
                          <Button
                            size="sm"
                            onClick={() => notifyWinnerMutation.mutate(draw.id)}
                            disabled={notifyWinnerMutation.isPending}
                            className="w-full"
                            data-testid="button-notify-winner"
                            style={{ background: '#44ba84', color: '#fff' }}
                          >
                            {notifyWinnerMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Notifying…</> : '📣 Notify Winner'}
                          </Button>
                        </div>
                      )}
                      {draw.status === 'drawn' && draw.winnerNotified && (
                        <div className="mb-4 rounded-xl p-2.5 text-center text-xs font-semibold text-emerald-700" style={{ background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.2)' }}>
                          ✓ Winner notified
                        </div>
                      )}
                      <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Draw Details</p>
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                          <div><span className="text-muted-foreground">Prize: </span><span className="font-medium">{draw.prize}</span></div>
                          <div><span className="text-muted-foreground">Cost/entry: </span><span className="font-medium">{Number(draw.pointsPerEntry).toLocaleString('en-GB')} pts</span></div>
                          {draw.maxEntriesPerClient && <div><span className="text-muted-foreground">Max/client: </span><span className="font-medium">{draw.maxEntriesPerClient}</span></div>}
                          {draw.drawDate && <div><span className="text-muted-foreground">Draw: </span><span className="font-medium">{format(new Date(draw.drawDate), 'dd MMM yyyy')}</span></div>}
                        </div>
                      </div>
                      {drawEntries.length > 0 ? (
                        <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Client</TableHead>
                                <TableHead className="text-xs text-right">Entries</TableHead>
                                <TableHead className="text-xs text-right">Pts spent</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {drawEntries.map((e: any) => (
                                <TableRow key={e.id} data-testid={`row-draw-entry-${e.id}`} className={draw.winnerEntryId === e.id ? 'bg-violet-50' : ''}>
                                  <TableCell className="text-xs py-2">
                                    <div className="font-medium">{e.clientName}</div>
                                    <div className="text-muted-foreground">{e.clientEmail}</div>
                                  </TableCell>
                                  <TableCell className="text-xs text-right font-semibold py-2">{e.numEntries}</TableCell>
                                  <TableCell className="text-xs text-right text-muted-foreground py-2">{Number(e.pointsSpent).toLocaleString('en-GB')}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-sm text-muted-foreground">No entries yet</p>
                        </div>
                      )}
                    </>
                  );
                })() : (
                  <div className="py-16 text-center">
                    <Ticket className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Select a draw to view details and participants</p>
                  </div>
                )}
              </BentoCard>
            </div>
            )}

            {/* ── Charity ── */}
            {rewardsSection === 'broker-rewards' && (
            <div className="grid grid-cols-1 gap-4">
              <BentoCard className="p-5" data-testid="card-broker-rewards">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl" style={{ background: 'rgba(68,186,132,0.12)' }}>
                    <Gift className="h-5 w-5" style={{ color: '#44ba84' }} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-gray-900">Broker-Sent Gift Cards</h3>
                    <p className="text-xs text-muted-foreground">All £5 gift cards sent by brokers to their clients</p>
                  </div>
                  {allBrokerSentRewards.filter((r: any) => r.status === 'pending').length > 0 && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                      {allBrokerSentRewards.filter((r: any) => r.status === 'pending').length} pending
                    </span>
                  )}
                </div>
                {allBrokerSentRewards.length === 0 ? (
                  <div className="py-10 text-center">
                    <Gift className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No broker rewards sent yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Broker</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allBrokerSentRewards.map((r: any) => (
                          <TableRow key={r.id} data-testid={`row-broker-reward-${r.id}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{r.clientName}</p>
                                <p className="text-xs text-muted-foreground">{r.clientEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{r.brokerName}</p>
                                {typeof r.brokerCredits === 'number' && (
                                  <p className="text-[11px] text-muted-foreground">{r.brokerCredits} credit{r.brokerCredits !== 1 ? 's' : ''} left</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {typeof r.brokerCredits === 'number' ? (
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.brokerCredits === 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`} data-testid={`text-broker-credits-${r.id}`}>{r.brokerCredits}</span>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span>{r.brand === 'amazon' ? '📦' : r.brand === 'starbucks' ? '☕' : '🛍️'}</span>
                                <span className="text-sm capitalize">{r.brand === 'marks-and-spencer' ? 'M&S' : r.brand.charAt(0).toUpperCase() + r.brand.slice(1)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">£{Number(r.valueGbp).toFixed(2)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${r.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' : r.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`} data-testid={`status-broker-reward-${r.id}`}>
                                {r.status === 'fulfilled' ? '✓ Fulfilled' : r.status === 'sent' ? 'Sent' : 'Pending'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {r.status !== 'fulfilled' && (
                                <button
                                  className="text-xs px-2 py-1 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                                  style={{ background: '#44ba84' }}
                                  disabled={updateBrokerRewardStatusMutation.isPending}
                                  onClick={() => updateBrokerRewardStatusMutation.mutate({ id: r.id, status: r.status === 'pending' ? 'sent' : 'fulfilled' })}
                                  data-testid={`button-advance-broker-reward-${r.id}`}
                                >
                                  {r.status === 'pending' ? 'Mark Sent' : 'Mark Fulfilled'}
                                </button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </BentoCard>
            </div>
            )}

            {rewardsSection === 'charity' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BentoCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                      <Heart className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-gray-900">Partner Charities</h3>
                      <p className="text-xs text-muted-foreground">{adminCharities.length} partner{adminCharities.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {charityEditId !== null ? (
                    <button onClick={() => setCharityEditId(null)} className="text-xs text-muted-foreground underline">Cancel</button>
                  ) : (
                    <button
                      onClick={() => { setCharityEditId(-1); setCharityForm({ name: '', description: '', logoUrl: '', pointsPerPound: '100' }); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
                      style={{ background: "#ef4444" }}
                      data-testid="button-add-charity"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Charity
                    </button>
                  )}
                </div>
                {charityEditId !== null && (
                  <div className="rounded-xl p-3 mb-3 space-y-2.5" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#ef4444' }}>{charityEditId === -1 ? 'Add Charity' : 'Edit Charity'}</p>
                    <Field label="Name *">
                      <Input value={charityForm.name} onChange={e => setCharityForm(f => ({ ...f, name: e.target.value }))} placeholder="Charity name" className="h-9 text-sm" data-testid="input-charity-name" />
                    </Field>
                    <Field label="Description (optional)">
                      <Input value={charityForm.description} onChange={e => setCharityForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" className="h-9 text-sm" />
                    </Field>
                    <Field label="Logo URL (optional)">
                      <Input value={charityForm.logoUrl} onChange={e => setCharityForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." className="h-9 text-sm" />
                    </Field>
                    <Field label="Points per £1 donated">
                      <Input type="number" value={charityForm.pointsPerPound} onChange={e => setCharityForm(f => ({ ...f, pointsPerPound: e.target.value }))} min="1" className="h-9 text-sm" />
                    </Field>
                    <div className="flex gap-2 pt-1">
                      {charityEditId === -1 ? (
                        <Button size="sm" className="flex-1" onClick={() => createCharityMutation.mutate()} disabled={!charityForm.name.trim() || createCharityMutation.isPending} data-testid="button-charity-submit" style={{ background: '#ef4444', color: '#fff' }}>
                          {createCharityMutation.isPending ? 'Adding…' : 'Add Charity'}
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1" onClick={() => updateCharityMutation.mutate({ id: charityEditId, patch: { name: charityForm.name, description: charityForm.description || null, logoUrl: charityForm.logoUrl || null, pointsPerPound: Number(charityForm.pointsPerPound) } })} disabled={!charityForm.name.trim() || updateCharityMutation.isPending} style={{ background: '#ef4444', color: '#fff' }}>
                          {updateCharityMutation.isPending ? 'Saving…' : 'Save Changes'}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setCharityEditId(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
                {adminCharities.length === 0 && charityEditId === null ? (
                  <div className="py-10 text-center">
                    <Heart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No charity partners yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {adminCharities.map((charity: any) => (
                      <div key={charity.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.05)' }} data-testid={`card-charity-${charity.id}`}>
                        {charity.logoUrl ? (
                          <img src={charity.logoUrl} alt={charity.name} className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
                            <Heart className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{charity.name}</p>
                          <p className="text-[11px] text-muted-foreground">{charity.pointsPerPound} pts = £1</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${charity.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{charity.status}</span>
                          <button onClick={() => { setCharityEditId(charity.id); setCharityForm({ name: charity.name, description: charity.description || '', logoUrl: charity.logoUrl || '', pointsPerPound: String(charity.pointsPerPound) }); }} className="px-2 py-0.5 rounded-lg text-[11px] font-medium" style={{ background: 'rgba(68,186,132,0.08)', color: '#44ba84' }} data-testid={`button-edit-charity-${charity.id}`}>Edit</button>
                          <button onClick={() => updateCharityMutation.mutate({ id: charity.id, patch: { status: charity.status === 'active' ? 'inactive' : 'active' } })} className="px-2 py-0.5 rounded-lg text-[11px] font-medium" style={{ background: 'rgba(0,0,0,0.05)', color: '#6b7280' }} data-testid={`button-toggle-charity-${charity.id}`}>{charity.status === 'active' ? 'Disable' : 'Enable'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BentoCard>

              <BentoCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-gray-900">Donation Log</h3>
                    <p className="text-xs text-muted-foreground">All client charity donations</p>
                  </div>
                </div>
                {(charityDonationsData?.totals || []).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {(charityDonationsData?.totals || []).map((t: any) => (
                      <div key={t.charityId} className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{t.charityName}</p>
                            <p className="text-xs text-muted-foreground">{Number(t.totalPoints).toLocaleString('en-GB')} pts · £{t.totalPounds}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {t.pendingCount > 0 && (
                              <>
                                <span className="text-[11px] text-amber-600 font-medium">{t.pendingCount} pending</span>
                                <button onClick={() => markFulfilledMutation.mutate(t.charityId)} disabled={markFulfilledMutation.isPending} className="px-2 py-0.5 rounded-lg text-[11px] font-semibold text-white transition-all" style={{ background: '#44ba84' }} data-testid={`button-fulfill-${t.charityId}`}>Mark Fulfilled</button>
                              </>
                            )}
                            {t.pendingCount === 0 && t.fulfilledCount > 0 && (
                              <span className="text-[11px] text-emerald-600 font-medium">✓ All fulfilled</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(charityDonationsData?.donations || []).length === 0 ? (
                  <div className="py-10 text-center">
                    <Heart className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No donations yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Client</TableHead>
                          <TableHead className="text-xs">Charity</TableHead>
                          <TableHead className="text-xs text-right">Pts</TableHead>
                          <TableHead className="text-xs text-right">£</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(charityDonationsData?.donations || []).map((d: any) => (
                          <TableRow key={d.id} data-testid={`row-donation-${d.id}`}>
                            <TableCell className="text-xs py-2">
                              <div className="font-medium">{d.clientName}</div>
                              <div className="text-muted-foreground">{d.clientEmail}</div>
                            </TableCell>
                            <TableCell className="text-xs py-2">{d.charityName}</TableCell>
                            <TableCell className="text-xs text-right font-semibold py-2">{Number(d.pointsDonated).toLocaleString('en-GB')}</TableCell>
                            <TableCell className="text-xs text-right py-2">£{Number(d.poundValue).toFixed(2)}</TableCell>
                            <TableCell className="py-2">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${d.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{d.status}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </BentoCard>
            </div>
            )}

          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

const EMPTY_DEAL_DRAFT = {
  id: "",
  storeName: "",
  category: "",
  tab: "homeware" as "homeware" | "leisure",
  iconKey: "ShoppingBag",
  logoUrl: "",
  logoFallback: "🛍️",
  dealTitle: "",
  dealDescription: "",
  cashbackRate: "",
  expiryDate: "",
  accentColor: "#44ba84",
  accentBg: "rgba(68,186,132,0.08)",
  trackingUrl: "",
  status: "active",
  sortOrder: 100,
  discountCode: "" as string | "",
};

function dealToDraft(d: AdminAffiliateDeal): typeof EMPTY_DEAL_DRAFT {
  return {
    id: d.id, storeName: d.storeName, category: d.category, tab: d.tab,
    iconKey: d.iconKey, logoUrl: d.logoUrl, logoFallback: d.logoFallback,
    dealTitle: d.dealTitle, dealDescription: d.dealDescription,
    cashbackRate: d.cashbackRate, expiryDate: d.expiryDate,
    accentColor: d.accentColor, accentBg: d.accentBg,
    trackingUrl: d.trackingUrl, status: d.status, sortOrder: d.sortOrder,
    discountCode: d.discountCode || "",
  };
}

function AffiliateDealsManager({
  expanded, deals, dealLabels,
}: {
  expanded: boolean;
  deals: AdminAffiliateDeal[];
  dealLabels: Record<string, string>;
}) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<typeof EMPTY_DEAL_DRAFT>(EMPTY_DEAL_DRAFT);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setEditingId(null);
      setCreating(false);
      setDraft(EMPTY_DEAL_DRAFT);
      setShowArchived(false);
    }
  }, [expanded]);

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliate-deals"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
    queryClient.invalidateQueries({ queryKey: ["affiliate-deals"] });
  };

  const startEdit = (d: AdminAffiliateDeal) => {
    setCreating(false);
    setEditingId(d.id);
    setTimeout(() => {
      document.querySelector('[data-testid="form-deal-editor"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    setDraft({
      id: d.id,
      storeName: d.storeName,
      category: d.category,
      tab: d.tab,
      iconKey: d.iconKey,
      logoUrl: d.logoUrl,
      logoFallback: d.logoFallback,
      dealTitle: d.dealTitle,
      dealDescription: d.dealDescription,
      cashbackRate: d.cashbackRate,
      expiryDate: d.expiryDate,
      accentColor: d.accentColor,
      accentBg: d.accentBg,
      trackingUrl: d.trackingUrl,
      status: d.status,
      sortOrder: d.sortOrder,
      discountCode: d.discountCode || "",
    });
  };

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setDraft({ ...EMPTY_DEAL_DRAFT, sortOrder: (deals.at(-1)?.sortOrder ?? 0) + 10 });
    setTimeout(() => {
      document.querySelector('[data-testid="form-deal-editor"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const startDuplicate = (d: AdminAffiliateDeal) => {
    setCreating(true);
    setEditingId(null);
    setDraft({
      ...dealToDraft(d),
      id: "",
      storeName: `${d.storeName} (copy)`,
      sortOrder: (deals.at(-1)?.sortOrder ?? 0) + 10,
      status: "paused",
    });
    toast.info("Editing a copy — give it a new slug, then Create deal");
    setTimeout(() => {
      document.querySelector('[data-testid="form-deal-editor"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const cancelEdit = () => { setEditingId(null); setCreating(false); };

  const updateMut = useMutation({
    mutationFn: async (payload: typeof EMPTY_DEAL_DRAFT) => {
      const { id, ...rest } = payload;
      const body = { ...rest, discountCode: rest.discountCode ? rest.discountCode : null };
      const res = await apiRequest("PATCH", `/api/admin/affiliate-deals/${encodeURIComponent(id)}`, body);
      return res.json();
    },
    onSuccess: () => { toast.success("Deal updated"); refetch(); cancelEdit(); },
    onError: (e: any) => toast.error(e?.message || "Failed to update deal"),
  });

  const createMut = useMutation({
    mutationFn: async (payload: typeof EMPTY_DEAL_DRAFT) => {
      const body = { ...payload, discountCode: payload.discountCode ? payload.discountCode : null };
      const res = await apiRequest("POST", `/api/admin/affiliate-deals`, body);
      return res.json();
    },
    onSuccess: () => { toast.success("Deal created"); refetch(); cancelEdit(); },
    onError: (e: any) => toast.error(e?.message || "Failed to create deal"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/affiliate-deals/${encodeURIComponent(id)}`);
      return res.json();
    },
    onSuccess: () => { toast.success("Deal removed"); refetch(); cancelEdit(); },
    onError: (e: any) => toast.error(e?.message || "Failed to remove deal"),
  });

  const isHttpUrl = (u: string) => {
    if (!u) return false;
    try { const p = new URL(u); return p.protocol === "http:" || p.protocol === "https:"; }
    catch { return false; }
  };

  const submit = () => {
    if (!draft.storeName.trim() || !draft.category.trim() || !draft.dealTitle.trim() || !draft.dealDescription.trim() || !draft.cashbackRate.trim() || !draft.expiryDate.trim() || !draft.trackingUrl.trim()) {
      toast.error("Fill all required fields"); return;
    }
    if (!isHttpUrl(draft.trackingUrl.trim())) {
      toast.error("Tracking URL must start with http:// or https://"); return;
    }
    if (draft.logoUrl && !isHttpUrl(draft.logoUrl.trim())) {
      toast.error("Logo URL must start with http:// or https://"); return;
    }
    if (creating) {
      if (!/^[a-z0-9-]{2,40}$/i.test(draft.id.trim())) { toast.error("Deal id must be 2-40 chars (letters/digits/-)"); return; }
      createMut.mutate(draft);
    } else {
      updateMut.mutate(draft);
    }
  };

  const visibleDeals = showArchived ? deals : deals.filter(d => d.status !== "archived");
  const sorted = [...visibleDeals].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const swapSortOrder = (a: AdminAffiliateDeal, b: AdminAffiliateDeal) => {
    updateMut.mutate({ ...dealToDraft(a), sortOrder: b.sortOrder ?? 0 });
    updateMut.mutate({ ...dealToDraft(b), sortOrder: a.sortOrder ?? 0 });
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    swapSortOrder(sorted[idx], sorted[idx - 1]);
  };
  const moveDown = (idx: number) => {
    if (idx >= sorted.length - 1) return;
    swapSortOrder(sorted[idx], sorted[idx + 1]);
  };

  const toggleStatus = (d: AdminAffiliateDeal) => {
    const next = d.status === "active" ? "paused" : "active";
    updateMut.mutate({ ...dealToDraft(d), status: next });
  };

  const restore = (d: AdminAffiliateDeal) => {
    updateMut.mutate({ ...dealToDraft(d), status: "paused" });
  };

  return (
    <div>
        <div className="mb-3">
          <h4 id="affiliate-deals-manager-heading" className="font-heading font-bold text-gray-900 text-base">Manage deals</h4>
          <p className="text-xs text-muted-foreground">Edit tracking links, add new partner deals, and archive stale offers.</p>
        </div>

        <div className="flex justify-between items-center mb-3 gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} data-testid="checkbox-show-archived" />
            Show archived
          </label>
          <Button onClick={startCreate} size="sm" data-testid="button-add-affiliate-deal"
            className="!bg-[#7fc89e] hover:!bg-[#6cbe8d] !text-white !border-0">
            <Plus className="w-4 h-4 mr-1" /> Add deal
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Tab</TableHead>
                <TableHead>Cashback</TableHead>
                <TableHead>Tracking URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Clicks 7d / 30d</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">No deals yet</TableCell></TableRow>
              )}
              {sorted.map((d, idx) => {
                const archived = d.status === "archived";
                return (
                  <TableRow key={d.id} data-testid={`row-deal-${d.id}`} className={archived ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0 || archived}
                          className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          data-testid={`button-move-up-${d.id}`}><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => moveDown(idx)} disabled={idx === sorted.length - 1 || archived}
                          className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          data-testid={`button-move-down-${d.id}`}><ArrowDown className="w-3.5 h-3.5" /></button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{d.storeName}</div>
                      <div className="text-xs text-muted-foreground">{d.id} · {d.category}</div>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{d.tab}</TableCell>
                    <TableCell className="text-sm">{d.cashbackRate}</TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="flex items-center gap-1.5">
                        <code className="text-[11px] text-gray-600 truncate flex-1" title={d.trackingUrl}>{d.trackingUrl}</code>
                        <a href={d.trackingUrl} target="_blank" rel="noreferrer noopener"
                          className="p-1 rounded hover:bg-gray-100 text-gray-500"
                          title="Preview link"
                          data-testid={`link-preview-${d.id}`}><ExternalLink className="w-3.5 h-3.5" /></a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.status === "active" ? "default" : "secondary"}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{d.clicks7d ?? 0} / {d.clicks30d ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {archived ? (
                          <Button size="sm" variant="outline" onClick={() => restore(d)} data-testid={`button-restore-deal-${d.id}`}>Restore</Button>
                        ) : (
                          <>
                            <button type="button" onClick={() => toggleStatus(d)}
                              className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                              title={d.status === "active" ? "Pause (hide from clients)" : "Activate"}
                              data-testid={`button-toggle-status-${d.id}`}
                            ><Power className={`w-3.5 h-3.5 ${d.status === "active" ? "text-emerald-600" : "text-gray-400"}`} /></button>
                            <Button size="sm" variant="outline" onClick={() => startEdit(d)} data-testid={`button-edit-deal-${d.id}`}>Edit</Button>
                            <button type="button" onClick={() => startDuplicate(d)}
                              className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600"
                              title="Duplicate this deal"
                              data-testid={`button-duplicate-deal-${d.id}`}
                            ><Copy className="w-3.5 h-3.5" /></button>
                            <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700"
                              onClick={() => { if (confirm(`Archive ${d.storeName}? Clients will no longer see this deal. Click history is preserved.`)) deleteMut.mutate(d.id); }}
                              data-testid={`button-delete-deal-${d.id}`}
                            ><Trash2 className="w-4 h-4" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {(creating || editingId) && (
          <div className="mt-5 rounded-xl border border-gray-200 p-4 bg-gray-50/60" data-testid="form-deal-editor">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-semibold text-gray-900">
                {creating ? "Add new deal" : `Edit ${draft.storeName}`}
              </h4>
              <button onClick={cancelEdit} className="p-1 rounded-md hover:bg-gray-200" data-testid="button-cancel-deal-edit">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {creating && (
                <Field label="Deal id (slug)*">
                  <Input value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} placeholder="ikea" data-testid="input-deal-id" />
                </Field>
              )}
              <Field label="Store name*">
                <Input value={draft.storeName} onChange={(e) => setDraft({ ...draft, storeName: e.target.value })} data-testid="input-deal-storeName" />
              </Field>
              <Field label="Category*">
                <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} data-testid="input-deal-category" />
              </Field>
              <Field label="Tab*">
                <Select value={draft.tab} onValueChange={(v) => setDraft({ ...draft, tab: v as "homeware" | "leisure" })}>
                  <SelectTrigger data-testid="select-deal-tab"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homeware">Homeware</SelectItem>
                    <SelectItem value="leisure">Leisure</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Icon">
                <Select value={draft.iconKey} onValueChange={(v) => setDraft({ ...draft, iconKey: v })}>
                  <SelectTrigger data-testid="select-deal-icon"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEAL_ICON_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger data-testid="select-deal-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cashback*">
                <Input value={draft.cashbackRate} onChange={(e) => setDraft({ ...draft, cashbackRate: e.target.value })} placeholder="3% cashback" data-testid="input-deal-cashback" />
              </Field>
              <Field label="Expiry (YYYY-MM-DD)*">
                <Input value={draft.expiryDate} onChange={(e) => setDraft({ ...draft, expiryDate: e.target.value })} placeholder="2026-12-31" data-testid="input-deal-expiry" />
              </Field>
              <Field label="Sort order">
                <Input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: parseInt(e.target.value) || 0 })} data-testid="input-deal-sortOrder" />
              </Field>
              <Field label="Discount code (optional)">
                <Input value={draft.discountCode} onChange={(e) => setDraft({ ...draft, discountCode: e.target.value })} data-testid="input-deal-discountCode" />
              </Field>
              <Field label="Logo URL">
                <Input value={draft.logoUrl} onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })} data-testid="input-deal-logoUrl" />
              </Field>
              <Field label="Logo fallback (emoji)">
                <Input value={draft.logoFallback} onChange={(e) => setDraft({ ...draft, logoFallback: e.target.value })} data-testid="input-deal-logoFallback" />
              </Field>
              <Field label="Accent color">
                <Input value={draft.accentColor} onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })} data-testid="input-deal-accentColor" />
              </Field>
              <Field label="Accent bg (rgba)">
                <Input value={draft.accentBg} onChange={(e) => setDraft({ ...draft, accentBg: e.target.value })} data-testid="input-deal-accentBg" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Deal title*">
                  <Input value={draft.dealTitle} onChange={(e) => setDraft({ ...draft, dealTitle: e.target.value })} data-testid="input-deal-title" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Deal description*">
                  <Input value={draft.dealDescription} onChange={(e) => setDraft({ ...draft, dealDescription: e.target.value })} data-testid="input-deal-description" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Tracking URL* (CJ deeplink or partner URL)">
                  <div className="flex gap-2">
                    <Input
                      value={draft.trackingUrl}
                      onChange={(e) => setDraft({ ...draft, trackingUrl: e.target.value })}
                      placeholder="https://www.anrdoezrs.net/click-..."
                      data-testid="input-deal-trackingUrl"
                      className={draft.trackingUrl && !isHttpUrl(draft.trackingUrl.trim()) ? "border-rose-400" : ""}
                    />
                    <a
                      href={isHttpUrl(draft.trackingUrl.trim()) ? draft.trackingUrl.trim() : "#"}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={(e) => { if (!isHttpUrl(draft.trackingUrl.trim())) e.preventDefault(); }}
                      aria-disabled={!isHttpUrl(draft.trackingUrl.trim())}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-md border text-xs font-medium ${
                        isHttpUrl(draft.trackingUrl.trim())
                          ? "border-gray-200 hover:bg-gray-50 text-gray-700"
                          : "border-gray-100 text-gray-300 cursor-not-allowed"
                      }`}
                      data-testid="button-preview-tracking-url"
                    ><ExternalLink className="w-3.5 h-3.5" /> Preview</a>
                  </div>
                  {draft.trackingUrl && !isHttpUrl(draft.trackingUrl.trim()) && (
                    <p className="text-[11px] text-rose-600 mt-1">Must start with http:// or https://</p>
                  )}
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={cancelEdit} data-testid="button-cancel-deal">Cancel</Button>
              <Button onClick={submit} disabled={createMut.isPending || updateMut.isPending} data-testid="button-save-deal"
                className="!bg-[#7fc89e] hover:!bg-[#6cbe8d] !text-white !border-0">
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {creating ? "Create deal" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
