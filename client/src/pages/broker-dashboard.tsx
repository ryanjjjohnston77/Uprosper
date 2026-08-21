import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Sparkles, Mail, Phone, MoreHorizontal, UserPlus, Send, Copy, Check, MessageSquare, Eye, ClipboardList, Home, ShieldCheck, Pencil, Calendar, CalendarCheck, Clock, TrendingUp, Users, Award, Heart, AlertTriangle, Activity, ArrowUpRight, ArrowDownRight, Info, Video, Megaphone, Building2, Plus, Share2, Gift, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistance, format, isPast, parseISO } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  mortgageValue: string;
  mortgageTerm: number | null;
  interestRate: string | null;
  monthlyPayment: string | null;
  renewalDate: string;
  lastContact: string | null;
  brokerUserId: string | null;
  reviewedByBroker: boolean;
  createdAt: string | null;
}

interface Message {
  id: number;
  clientId: number;
  brokerUserId: string;
  senderType: string;
  subject: string | null;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Enquiry {
  id: number;
  clientId: number;
  brokerUserId: string;
  productType: string;
  note: string | null;
  status: string;
  read: boolean;
  meetingDate: string | null;
  meetingTime: string | null;
  meetingStatus: string | null;
  createdAt: string;
}

interface JourneyStep {
  id: number;
  clientId: number;
  stepId: number;
  stepTitle: string;
  status: string;
  completedAt: string | null;
}

interface BrokerNotification {
  id: number;
  brokerUserId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  enquiryId: number | null;
  createdAt: string;
}

const JOURNEY_STEPS = [
  { stepId: 2, stepTitle: "Home Insurance", icon: "🏠" },
  { stepId: 3, stepTitle: "Life Insurance", icon: "🛡️" },
  { stepId: 4, stepTitle: "Wealth Review", icon: "💰" },
  { stepId: 5, stepTitle: "Will & Succession", icon: "📜" },
];

function PlanBadgeAndPortal({ plan, band, status }: { plan: string; band: number | null; status: string | null }) {
  const [busy, setBusy] = useState(false);
  const bandLabel = band === 1 ? "1–5 brokers" : band === 2 ? "5–10 brokers" : band === 3 ? "10+ brokers" : null;
  const planLabel = plan === "growth" ? `Growth${bandLabel ? ` · ${bandLabel}` : ""}` : plan.charAt(0).toUpperCase() + plan.slice(1);
  const statusLabel = status === "trialing" ? "Trial" : status === "active" ? "Active" : status === "past_due" ? "Past due" : status === "canceled" ? "Cancelled" : null;
  const openPortal = async () => {
    setBusy(true);
    try {
      const resp = await fetch("/api/billing/portal", { method: "POST", credentials: "include" });
      const data = await resp.json();
      if (resp.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Could not open billing portal");
        setBusy(false);
      }
    } catch {
      toast.error("Could not open billing portal");
      setBusy(false);
    }
  };
  return (
    <div className="liquid-glass-sm flex items-center gap-2 px-3 py-1.5" data-testid="plan-badge">
      <span className="text-xs text-muted-foreground">Plan:</span>
      <span className="text-sm font-semibold" style={{ color: '#1a7a5c' }} data-testid="plan-badge-label">{planLabel}</span>
      {statusLabel && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(68,186,132,0.12)', color: '#1a7a5c' }}>{statusLabel}</span>
      )}
      <button
        onClick={openPortal}
        disabled={busy}
        className="text-xs font-semibold underline disabled:opacity-50"
        style={{ color: '#1a7a5c' }}
        data-testid="button-manage-subscription"
      >
        Manage
      </button>
    </div>
  );
}

export default function BrokerDashboard() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [sendOfferOpen, setSendOfferOpen] = useState(false);
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [messageData, setMessageData] = useState({ clientId: 0, clientName: "", subject: "", body: "" });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientPopupOpen, setClientPopupOpen] = useState(false);
  const [reviewPopupOpen, setReviewPopupOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ mortgageValue: "", mortgageTerm: "", interestRate: "", renewalDate: "" });
  const pushPrompted = useRef(false);
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, permission: pushPermission, subscribe: subscribePush } = usePushNotifications(!!user);
  const [companyMsgOpen, setCompanyMsgOpen] = useState(false);
  const [companyMsgForm, setCompanyMsgForm] = useState({ subject: "", content: "" });
  const [companyThreadOpen, setCompanyThreadOpen] = useState(false);
  const [companyThreadReply, setCompanyThreadReply] = useState("");
  const [announcementPopupOpen, setAnnouncementPopupOpen] = useState(false);
  const [currentPopupAnnouncement, setCurrentPopupAnnouncement] = useState<{ id: number; title: string; content: string; priority: string; createdAt: string } | null>(null);
  const [seenAnnouncementIds, setSeenAnnouncementIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem("uprosper_seen_announcements");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const credits = params.get("credits");
    const creditQty = params.get("qty");
    if (checkout === "success") {
      toast.success("Plan activated — welcome aboard!");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } else if (checkout === "cancelled") {
      toast.info("Checkout cancelled. You can subscribe any time from your dashboard.");
    }
    if (credits === "success") {
      const qty = creditQty ? Number(creditQty) : 0;
      toast.success(qty > 0 ? `${qty} reward credit${qty > 1 ? "s" : ""} added to your wallet!` : "Reward credits added!");
      queryClient.invalidateQueries({ queryKey: ["broker-reward-credits"] });
    } else if (credits === "cancelled") {
      toast.info("Top-up cancelled.");
    }
    if (checkout || credits) {
      params.delete("checkout");
      params.delete("credits");
      params.delete("qty");
      const next = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", next);
    }
  }, [queryClient]);

  useEffect(() => {
    if (pushSupported && !pushSubscribed && pushPermission === "default" && user && !pushPrompted.current) {
      pushPrompted.current = true;
      const timer = setTimeout(() => {
        subscribePush();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pushSupported, pushSubscribed, pushPermission, user, subscribePush]);

  const dismissAnnouncement = () => {
    if (currentPopupAnnouncement) {
      const newSeen = new Set(seenAnnouncementIds);
      newSeen.add(currentPopupAnnouncement.id);
      setSeenAnnouncementIds(newSeen);
      try { localStorage.setItem("uprosper_seen_announcements", JSON.stringify([...newSeen])); } catch {}
      setAnnouncementPopupOpen(false);
      setCurrentPopupAnnouncement(null);
    }
  };

  const copyBrokerCode = () => {
    if (user?.brokerCode) {
      navigator.clipboard.writeText(user.brokerCode);
      setCodeCopied(true);
      toast.success("Broker code copied!");
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    mortgageValue: "",
    renewalDate: "",
    status: "Active"
  });
  const [offerData, setOfferData] = useState({
    clientId: 0,
    clientName: "",
    offerType: "",
    message: ""
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['broker-clients'],
    queryFn: async () => {
      const res = await fetch('/api/broker/my-clients', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  type EngagementSummary = {
    activeHomeowners: number;
    gainedThisMonth: number;
    activeThisMonthCount: number;
    activeThisMonthPct: number;
    clientActionsThisWeek: number;
    referralsCount: number;
    introductionsCount: number;
  };
  const emptyEngagement: EngagementSummary = {
    activeHomeowners: 0,
    gainedThisMonth: 0,
    activeThisMonthCount: 0,
    activeThisMonthPct: 0,
    clientActionsThisWeek: 0,
    referralsCount: 0,
    introductionsCount: 0,
  };
  const { data: engagement = emptyEngagement } = useQuery<EngagementSummary>({
    queryKey: ['/api/broker/engagement-summary'],
    queryFn: async () => {
      const res = await fetch('/api/broker/engagement-summary', { credentials: 'include' });
      if (!res.ok) return emptyEngagement;
      return res.json();
    },
    enabled: !!user && user.role === 'broker',
    refetchInterval: 30000,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['broker-messages'],
    queryFn: async () => {
      const res = await fetch('/api/broker/messages', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: enquiries = [] } = useQuery<Enquiry[]>({
    queryKey: ['broker-enquiries'],
    queryFn: async () => {
      const res = await fetch('/api/broker/enquiries', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const unreadEnquiriesCount = enquiries.filter(e => !e.read).length;

  const { data: brokerNotifications = [] } = useQuery<BrokerNotification[]>({
    queryKey: ['broker-notifications'],
    queryFn: async () => {
      const res = await fetch('/api/broker/notifications', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const unreadBrokerNotificationsCount = brokerNotifications.filter(bn => !bn.read).length;

  const { data: unreviewedClients = [] } = useQuery<Client[]>({
    queryKey: ['broker-unreviewed-clients'],
    queryFn: async () => {
      const res = await fetch('/api/broker/unreviewed-clients', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());
  const pendingReviewClients = unreviewedClients.filter(c => !reviewedIds.has(c.id));

  useEffect(() => {
    if (pendingReviewClients.length > 0 && !reviewPopupOpen) {
      const c = pendingReviewClients[0];
      setReviewForm({
        mortgageValue: c.mortgageValue && parseFloat(c.mortgageValue) > 0 ? c.mortgageValue : "",
        mortgageTerm: c.mortgageTerm ? String(c.mortgageTerm) : "",
        interestRate: c.interestRate ?? "",
        renewalDate: c.renewalDate || "",
      });
      setReviewPopupOpen(true);
    }
  }, [pendingReviewClients.length, reviewPopupOpen]);

  const reviewClientMutation = useMutation({
    mutationFn: async ({ clientId, data }: { clientId: number; data: { mortgageValue?: string; mortgageTerm?: string; interestRate?: string; renewalDate?: string } }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}/review`, data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      queryClient.invalidateQueries({ queryKey: ['broker-unreviewed-clients'] });
      setReviewedIds(prev => new Set(prev).add(variables.clientId));
      setReviewPopupOpen(false);
      toast.success("Client reviewed!");
    },
    onError: () => {
      toast.error("Failed to save client review.");
    },
  });

  const { data: companyAnnouncements = [] } = useQuery<{ id: number; title: string; content: string; priority: string; createdAt: string }[]>({
    queryKey: ["broker-company-announcements"],
    queryFn: async () => {
      const res = await fetch("/api/broker/company-announcements", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.companyId,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (companyAnnouncements.length > 0 && !announcementPopupOpen) {
      const unseen = companyAnnouncements.filter(a => !seenAnnouncementIds.has(a.id));
      if (unseen.length > 0) {
        setCurrentPopupAnnouncement(unseen[0]);
        setAnnouncementPopupOpen(true);
      }
    }
  }, [companyAnnouncements, seenAnnouncementIds, announcementPopupOpen]);

  const { data: companyMsgs = [] } = useQuery<{ id: number; brokerUserId: string; senderType: string; subject: string | null; content: string; read: boolean; createdAt: string }[]>({
    queryKey: ["broker-company-messages"],
    queryFn: async () => {
      const res = await fetch("/api/broker/company-messages", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.companyId,
    refetchInterval: 10000,
  });

  const sendCompanyMsgMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string }) => {
      const res = await apiRequest("POST", "/api/broker/company-messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-company-messages"] });
      setCompanyMsgOpen(false);
      setCompanyMsgForm({ subject: "", content: "" });
      setCompanyThreadReply("");
      toast.success("Message sent to company!");
    },
  });

  const companyUnreadCount = companyMsgs.filter(m => !m.read && m.senderType === "company").length;

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<BrokerNotification | null>(null);
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [enquiryMeetingLink, setEnquiryMeetingLink] = useState("");
  const [editingRenewalDate, setEditingRenewalDate] = useState(false);
  const [renewalDateValue, setRenewalDateValue] = useState("");
  const [editingMortgageValue, setEditingMortgageValue] = useState(false);
  const [mortgageValueEdit, setMortgageValueEdit] = useState("");
  const [editingInterestRate, setEditingInterestRate] = useState(false);
  const [interestRateEdit, setInterestRateEdit] = useState("");
  const [editingMonthlyPayment, setEditingMonthlyPayment] = useState(false);
  const [monthlyPaymentEdit, setMonthlyPaymentEdit] = useState("");

  const toggleClientStatusMutation = useMutation({
    mutationFn: async ({ clientId, status }: { clientId: number; status: string }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, { status });
      return res.json();
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, status: updatedClient.status });
      }
      toast.success(`Client marked as ${updatedClient.status}`);
    },
    onError: () => {
      toast.error("Failed to update client status.");
    }
  });

  const updateRenewalDateMutation = useMutation({
    mutationFn: async ({ clientId, renewalDate }: { clientId: number; renewalDate: string }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, { renewalDate });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      toast.success("Renewal date updated!");
      setEditingRenewalDate(false);
    },
    onError: () => {
      toast.error("Failed to update renewal date.");
    }
  });

  const updateMortgageValueMutation = useMutation({
    mutationFn: async ({ clientId, mortgageValue }: { clientId: number; mortgageValue: string }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, { mortgageValue });
      return res.json();
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, mortgageValue: updatedClient.mortgageValue });
      }
      toast.success("Mortgage value updated!");
      setEditingMortgageValue(false);
    },
    onError: () => {
      toast.error("Failed to update mortgage value.");
    }
  });

  const updateInterestRateMutation = useMutation({
    mutationFn: async ({ clientId, interestRate }: { clientId: number; interestRate: string }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, { interestRate });
      return res.json();
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, interestRate: updatedClient.interestRate });
      }
      toast.success("Interest rate updated!");
      setEditingInterestRate(false);
    },
    onError: () => {
      toast.error("Failed to update interest rate.");
    }
  });

  const updateMonthlyPaymentMutation = useMutation({
    mutationFn: async ({ clientId, monthlyPayment }: { clientId: number; monthlyPayment: string }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, { monthlyPayment });
      return res.json();
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, monthlyPayment: updatedClient.monthlyPayment });
      }
      toast.success("Monthly payment updated!");
      setEditingMonthlyPayment(false);
    },
    onError: () => {
      toast.error("Failed to update monthly payment.");
    }
  });

  const { data: clientJourneySteps = [], isFetching: isJourneyFetching } = useQuery<JourneyStep[]>({
    queryKey: ['client-journey', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const res = await fetch(`/api/clients/${selectedClient.id}/journey`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedClient && clientPopupOpen,
    staleTime: 0, // Always fetch fresh data when popup opens
  });

  const toggleJourneyStepMutation = useMutation({
    mutationFn: async ({ clientId, stepId, stepTitle }: { clientId: number; stepId: number; stepTitle: string }) => {
      const res = await apiRequest('POST', `/api/broker/clients/${clientId}/journey-toggle`, { stepId, stepTitle });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-journey', selectedClient?.id] });
      queryClient.invalidateQueries({ queryKey: ['broker-commission'] });
    },
    onError: () => {
      toast.error("Failed to update journey step.");
    }
  });

  const isStepCompleted = (stepId: number) => {
    const step = clientJourneySteps.find(s => s.stepId === stepId);
    return step?.status === 'completed';
  };

  const markMessageReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest('POST', `/api/messages/${messageId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-messages'] });
    }
  });

  const scheduleMeetingMutation = useMutation({
    mutationFn: async ({ enquiryId, meetingDate, meetingTime, meetingLink }: { enquiryId: number; meetingDate: string; meetingTime: string; meetingLink?: string }) => {
      const res = await apiRequest('POST', `/api/enquiries/${enquiryId}/schedule`, { meetingDate, meetingTime, meetingLink });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-enquiries'] });
      toast.success("Meeting scheduled! Your client will be notified.");
      setSchedulingMeeting(false);
      setMeetingDate("");
      setMeetingTime("");
      setEnquiryMeetingLink("");
      setSelectedEnquiry(null);
    },
    onError: () => {
      toast.error("Failed to schedule meeting. Please try again.");
    }
  });

  const markEnquiryReadMutation = useMutation({
    mutationFn: async (enquiryId: number) => {
      const res = await apiRequest('POST', `/api/enquiries/${enquiryId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-enquiries'] });
    }
  });

  const markBrokerNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('POST', `/api/broker/notifications/${notificationId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-notifications'] });
    }
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ clientId, content }: { clientId: number; content: string }) => {
      const res = await apiRequest('POST', '/api/broker/messages', { clientId, content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-messages'] });
      toast.success("Reply sent successfully!");
      setReplyText("");
      setSelectedMessage(null);
    },
    onError: () => {
      toast.error("Failed to send reply. Please try again.");
    }
  });

  const sendBookingLinkMutation = useMutation({
    mutationFn: async ({ clientId, productType }: { clientId: number; productType: string }) => {
      const calendarUrl = (user as any)?.calendarUrl?.trim();
      if (!calendarUrl) throw new Error("NO_CALENDAR_URL");
      const subject = `Book a ${productType} consultation`;
      const content = `Thanks for your ${productType} enquiry. Pick a time that works for you using my booking link below — I'll be in touch as soon as we're scheduled.`;
      const res = await apiRequest('POST', '/api/broker/messages', {
        clientId,
        subject,
        content,
        messageType: "booking_link",
        meetingLink: calendarUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Booking link sent to your client.");
      queryClient.invalidateQueries({ queryKey: ["/api/broker/messages"] });
      setSelectedEnquiry(null);
    },
    onError: (err: any) => {
      if (err?.message === "NO_CALENDAR_URL") {
        toast.error("Add your calendar booking link in Profile first.");
      } else {
        toast.error("Failed to send booking link. Please try again.");
      }
    }
  });

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      markMessageReadMutation.mutate(message.id);
    }
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const BROKER_REWARD_BRANDS = [
    { id: 'amazon', label: 'Amazon', icon: '📦', bg: 'rgba(255,153,0,0.07)' },
    { id: 'starbucks', label: 'Starbucks', icon: '☕', bg: 'rgba(0,112,74,0.07)' },
    { id: 'marks-and-spencer', label: 'M&S', icon: '🛍️', bg: 'rgba(0,0,0,0.04)' },
  ];

  const [sendRewardModal, setSendRewardModal] = useState<{
    open: boolean; clientId: number | null; clientName: string; brand: string | null; step: 'brand' | 'confirm';
  }>({ open: false, clientId: null, clientName: '', brand: null, step: 'brand' });
  const [sentHistoryOpen, setSentHistoryOpen] = useState(false);

  const { data: brokerSentRewardsList = [] } = useQuery<any[]>({
    queryKey: ['broker-sent-rewards'],
    queryFn: async () => {
      const res = await fetch('/api/broker/sent-rewards', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: rewardCreditsData, refetch: refetchCredits } = useQuery<{ credits: number }>({
    queryKey: ['broker-reward-credits'],
    queryFn: async () => {
      const res = await fetch('/api/broker/reward-credits', { credentials: 'include' });
      if (!res.ok) return { credits: 0 };
      return res.json();
    },
    enabled: !!user && user.role === 'broker',
    refetchInterval: 30000,
  });
  const rewardCredits = rewardCreditsData?.credits ?? 0;

  const [topUpBusy, setTopUpBusy] = useState<number | null>(null);
  const handleTopUp = async (credits: number) => {
    setTopUpBusy(credits);
    try {
      const res = await fetch('/api/billing/reward-credits/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack: String(credits) }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Could not start checkout');
        setTopUpBusy(null);
      }
    } catch {
      toast.error('Could not start checkout');
      setTopUpBusy(null);
    }
  };

  const sendRewardMutation = useMutation({
    mutationFn: async ({ clientId, brand }: { clientId: number; brand: string }) => {
      const res = await fetch('/api/broker/sent-rewards', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, brand }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: () => {
      const label = BROKER_REWARD_BRANDS.find(b => b.id === sendRewardModal.brand)?.label || 'gift card';
      toast.success(`£5 ${label} gift card queued!`);
      queryClient.invalidateQueries({ queryKey: ['broker-sent-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['broker-reward-credits'] });
      setSendRewardModal({ open: false, clientId: null, clientName: '', brand: null, step: 'brand' });
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to send reward';
      if (msg.includes('Insufficient') || msg.includes('credits')) {
        toast.error('Not enough credits — top up your wallet first.');
      } else {
        toast.error(msg);
      }
    },
  });

  // Only show messages sent by clients (not broker replies)
  const clientMessages = messages.filter(m => m.senderType === 'client');
  const unreadMessagesCount = clientMessages.filter(m => !m.read).length;

  const sortedAppointments = [...enquiries.filter(e => e.meetingDate)].sort((a, b) => {
    const dateA = a.meetingDate ? new Date(a.meetingDate).getTime() : 0;
    const dateB = b.meetingDate ? new Date(b.meetingDate).getTime() : 0;
    const nowMs = Date.now();
    const aIsPast = dateA < nowMs;
    const bIsPast = dateB < nowMs;
    if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
    return aIsPast ? dateB - dateA : dateA - dateB;
  });
  const upcomingAppointmentsCount = sortedAppointments.filter(
    a => a.meetingDate && !isPast(parseISO(a.meetingDate))
  ).length;
  const formatMeetingDateTime = (date: string | null, time: string | null) => {
    if (!date) return "—";
    try {
      const formatted = format(parseISO(date), "EEE, dd MMM yyyy");
      return time ? `${formatted} at ${time}` : formatted;
    } catch {
      return date;
    }
  };

  const addClientMutation = useMutation({
    mutationFn: async (clientData: typeof newClient) => {
      const res = await apiRequest('POST', '/api/clients', clientData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      toast.success("Client added successfully!");
      setAddClientOpen(false);
      setNewClient({ name: "", email: "", phone: "", mortgageValue: "", renewalDate: "", status: "Active" });
    },
    onError: () => {
      toast.error("Failed to add client. Please try again.");
    }
  });

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    addClientMutation.mutate(newClient);
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const offerTitles: Record<string, string> = {
        reward: "You have received a reward 🎉",
        fixed_rate_ending: "Your fixed-rate mortgage ends in 3 months ⏰",
        moving_house: "Thinking of moving or upsizing? 🏡",
        home_insurance: "Explore Home Insurance 🏠",
        life_insurance: "Explore Life Insurance 🛡️",
        wealth: "Wealth Opportunity 💡"
      };
      const res = await fetch('/api/broker/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clientId: offerData.clientId,
          type: offerData.offerType,
          title: offerTitles[offerData.offerType] || "New Offer",
          message: offerData.message || (
            offerData.offerType === 'reward'
              ? "Click here to claim!"
              : offerData.offerType === 'home_insurance' || offerData.offerType === 'life_insurance' 
              ? "Optional introduction to an FCA-regulated provider."
              : offerData.offerType === 'fixed_rate_ending'
              ? "It's a good time to review your options and plan ahead."
              : offerData.offerType === 'moving_house'
              ? "We can check affordability and options before you commit."
              : `Your broker has sent you a ${offerData.offerType.replace('_', ' ')} notification.`
          )
        })
      });
      if (!res.ok) throw new Error('Failed to send notification');
      toast.success(`Offer sent to ${offerData.clientName}!`);
      setSendOfferOpen(false);
      setOfferData({ clientId: 0, clientName: "", offerType: "", message: "" });
    } catch (error) {
      toast.error('Failed to send offer. Please try again.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/broker/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clientId: messageData.clientId,
          subject: messageData.subject || "Message from your broker",
          content: messageData.body
        })
      });
      if (!res.ok) throw new Error('Failed to send message');
      toast.success(`Message sent to ${messageData.clientName}!`);
      setSendMessageOpen(false);
      setMessageData({ clientId: 0, clientName: "", subject: "", body: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/broker/messages"] });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "Active").length;
  const retentionRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
  
  const avgClientLifetime = totalClients > 0 ? '3.2 yrs' : '0 yrs';
  const renewalsSoon = clients.filter(c => {
    const rd = c.renewalDate?.toLowerCase();
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const currentYear = new Date().getFullYear().toString();
    return rd?.includes(currentMonth) || rd?.includes(currentYear);
  }).length;

  return (
    <Shell>
      <div className="relative space-y-6">
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-green-100/40 via-emerald-50/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/30 via-indigo-50/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-purple-50/20 to-rose-50/15 rounded-full blur-3xl" />
        </div>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-muted-foreground mt-1">Here's your portfolio overview</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(user as any)?.plan && (
              <PlanBadgeAndPortal plan={(user as any).plan} band={(user as any).growthBand ?? null} status={(user as any).subscriptionStatus ?? null} />
            )}
            {user?.brokerCode && (
              <button
                onClick={copyBrokerCode}
                className="liquid-glass-sm flex items-center gap-2 px-3 py-2 hover:scale-[1.02] transition-all"
                data-testid="button-copy-broker-code"
              >
                <span className="text-xs text-muted-foreground">Code:</span>
                <span className="font-mono font-bold text-sm text-primary tracking-wider" data-testid="text-broker-code">{user.brokerCode}</span>
                {codeCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:brightness-110" style={{ background: '#44ba84', border: '1px solid rgba(255,255,255,0.25)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} data-testid="button-add-client" onClick={() => setAddClientOpen(true)}>
              <UserPlus className="w-4 h-4" /> Add Client
            </button>
          </div>
        </div>

        {/* Add Client Dialog — QR Code Invite */}
        <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
          <DialogContent className="sm:max-w-sm bg-white" overlayClassName="bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-gray-900">Invite Client</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Ask your client to scan this code to sign up — they'll be linked to you automatically.
              </DialogDescription>
            </DialogHeader>
            {!user?.brokerCode && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No broker code found on your account. Please contact support.</p>
              </div>
            )}
            {user?.brokerCode && (() => {
              const signupUrl = `${window.location.origin}/signup?broker=${user.brokerCode}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(signupUrl)}&color=166534&bgcolor=f8faf9`;
              return (
                <div className="flex flex-col items-center gap-5 pt-2 pb-1">
                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      background: 'rgba(68,186,132,0.06)',
                      border: '1px solid rgba(68,186,132,0.15)',
                    }}
                  >
                    <img
                      src={qrUrl}
                      alt="Client signup QR code"
                      className="w-[200px] h-[200px] rounded-lg"
                      data-testid="img-invite-qr"
                    />
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Your broker code</p>
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                      style={{
                        background: 'rgba(68,186,132,0.06)',
                        border: '1px dashed rgba(68,186,132,0.35)',
                      }}
                    >
                      <span className="font-mono font-bold text-lg tracking-[0.25em]" style={{ color: '#2d8a5e' }} data-testid="text-invite-broker-code">
                        {user.brokerCode}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(signupUrl);
                      toast.success("Signup link copied!");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                    style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                    data-testid="button-copy-invite-link"
                  >
                    <Copy className="w-4 h-4" /> Copy Signup Link
                  </button>

                  {(() => {
                    const shareTitle = "Join me on Uprosper";
                    const shareText = `Sign up with my broker code ${user.brokerCode} on Uprosper:`;
                    const shareBody = `${shareText} ${signupUrl}`;
                    const canNativeShare = typeof navigator !== "undefined" && typeof (navigator as any).share === "function";

                    const handleNativeShare = async () => {
                      try {
                        await (navigator as any).share({ title: shareTitle, text: shareText, url: signupUrl });
                      } catch (err: any) {
                        if (err?.name !== "AbortError") {
                          toast.error("Couldn't open share menu");
                        }
                      }
                    };

                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02]"
                            style={{
                              background: 'rgba(68,186,132,0.08)',
                              border: '1px solid rgba(68,186,132,0.35)',
                              color: '#2d8a5e',
                            }}
                            data-testid="button-share-invite-link"
                          >
                            <Share2 className="w-4 h-4" /> Share
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-56">
                          {canNativeShare && (
                            <DropdownMenuItem onClick={handleNativeShare} data-testid="menu-share-native">
                              <Share2 className="w-4 h-4 mr-2" /> Share via…
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild data-testid="menu-share-sms">
                            <a href={`sms:?&body=${encodeURIComponent(shareBody)}`}>
                              <MessageSquare className="w-4 h-4 mr-2" /> Messages
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild data-testid="menu-share-whatsapp">
                            <a href={`https://wa.me/?text=${encodeURIComponent(shareBody)}`} target="_blank" rel="noopener noreferrer">
                              <Phone className="w-4 h-4 mr-2" /> WhatsApp
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild data-testid="menu-share-email">
                            <a href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareBody)}`}>
                              <Mail className="w-4 h-4 mr-2" /> Email
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  })()}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Send Offer Dialog */}
        <Dialog open={sendOfferOpen} onOpenChange={setSendOfferOpen}>
          <DialogContent className="sm:max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-gray-900">Send Client Offer</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Send a personalized offer to one of your clients.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendOffer} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="offerClient" className="text-sm font-medium text-gray-700">Select Client</Label>
                <Select value={offerData.clientId ? String(offerData.clientId) : ""} onValueChange={(value) => {
                    const selectedClient = clients.find(c => c.id === parseInt(value));
                    setOfferData({ ...offerData, clientId: parseInt(value), clientName: selectedClient?.name || "" });
                  }}>
                  <SelectTrigger className="bg-gray-50 border-gray-200" data-testid="select-offer-client">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="offerType" className="text-sm font-medium text-gray-700">Offer Type</Label>
                <Select value={offerData.offerType} onValueChange={(value) => setOfferData({ ...offerData, offerType: value })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200" data-testid="select-offer-type">
                    <SelectValue placeholder="Select offer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reward">Rewards</SelectItem>
                    <SelectItem value="fixed_rate_ending">Fixed Rate Ending</SelectItem>
                    <SelectItem value="moving_house">Moving House?</SelectItem>
                    <SelectItem value="home_insurance">Home Insurance</SelectItem>
                    <SelectItem value="life_insurance">Life Insurance</SelectItem>
                    <SelectItem value="wealth">Wealth Offers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="offerMessage" className="text-sm font-medium text-gray-700">Personal Message (Optional)</Label>
                <Input
                  id="offerMessage"
                  placeholder="Add a personal note..."
                  value={offerData.message}
                  onChange={(e) => setOfferData({ ...offerData, message: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                  data-testid="input-offer-message"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSendOfferOpen(false)}
                  data-testid="button-cancel-send-offer"
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100"
                  style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                  disabled={!offerData.clientId || !offerData.offerType}
                  data-testid="button-submit-send-offer"
                >
                  <Send className="w-4 h-4" /> Send Offer
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Send Message Dialog */}
        <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
          <DialogContent className="sm:max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-gray-900">Send Client Message</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Send a message directly to one of your clients.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendMessage} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="messageClient" className="text-sm font-medium text-gray-700">Select Client</Label>
                <Select value={messageData.clientId ? String(messageData.clientId) : ""} onValueChange={(value) => {
                    const selectedClient = clients.find(c => c.id === parseInt(value));
                    setMessageData({ ...messageData, clientId: parseInt(value), clientName: selectedClient?.name || "" });
                  }}>
                  <SelectTrigger className="bg-gray-50 border-gray-200" data-testid="select-message-client">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="messageSubject" className="text-sm font-medium text-gray-700">Subject</Label>
                <Input
                  id="messageSubject"
                  placeholder="Enter message subject..."
                  value={messageData.subject}
                  onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                  data-testid="input-message-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="messageBody" className="text-sm font-medium text-gray-700">Message</Label>
                <Textarea
                  id="messageBody"
                  placeholder="Write your message here..."
                  value={messageData.body}
                  onChange={(e) => setMessageData({ ...messageData, body: e.target.value })}
                  className="bg-gray-50 border-gray-200 min-h-[120px]"
                  data-testid="input-message-body"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSendMessageOpen(false)}
                  data-testid="button-cancel-send-message"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={!messageData.clientId || !messageData.body}
                  data-testid="button-submit-send-message"
                >
                  <Send className="w-4 h-4" /> Send Message
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bento Grid Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Engagement Overview - Large main bento box */}
          <div className="order-1 md:col-span-7 md:order-1 liquid-glass p-6" data-testid="bento-performance">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 via-transparent to-emerald-50/30 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">Engagement Overview</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="liquid-glass-sm p-4 hover:scale-[1.02] transition-all group cursor-pointer"
                  onClick={() => setLocation("/broker/clients")}
                  data-testid="card-active-homeowners"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-4 w-4 text-primary/60" />
                    {engagement.gainedThisMonth > 0 && (
                      <span className="flex items-center text-xs text-green-600 font-medium" data-testid="badge-gained-this-month">
                        <ArrowUpRight className="h-3 w-3" /> +{engagement.gainedThisMonth} this month
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-heading font-bold text-gray-900" data-testid="text-active-homeowners">{engagement.activeHomeowners}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active Homeowners</p>
                </div>
                <div className="liquid-glass-sm p-4 hover:scale-[1.02] transition-all group" data-testid="card-engagement-rate">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="h-4 w-4 text-rose-500/60" />
                    <span className="text-xs text-muted-foreground font-medium">this month</span>
                  </div>
                  <p className="text-3xl font-heading font-bold text-gray-900" data-testid="text-engagement-rate">{engagement.activeThisMonthPct}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Engagement Rate
                    <span className="block text-[10px] mt-0.5">
                      {engagement.activeThisMonthCount} of {engagement.activeHomeowners} active
                    </span>
                  </p>
                </div>
                <div className="liquid-glass-sm p-4 hover:scale-[1.02] transition-all group" data-testid="card-client-actions">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="h-4 w-4 text-blue-500/60" />
                    <span className="text-xs text-muted-foreground font-medium">last 7 days</span>
                  </div>
                  <p className="text-3xl font-heading font-bold text-gray-900" data-testid="text-client-actions-week">{engagement.clientActionsThisWeek}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Client Actions This Week
                    <span className="block text-[10px] mt-0.5">journeys · meetings · enquiries · tools</span>
                  </p>
                </div>
                <div className="liquid-glass-sm p-4 hover:scale-[1.02] transition-all group" data-testid="card-referrals-introductions">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="h-4 w-4 text-purple-500/60" />
                  </div>
                  <p className="text-3xl font-heading font-bold text-gray-900" data-testid="text-referrals-introductions-total">
                    {engagement.referralsCount + engagement.introductionsCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Referrals & Introductions
                    <span className="block text-[10px] mt-0.5">
                      {engagement.referralsCount} referrals · {engagement.introductionsCount} introductions
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Health bento box */}
          <div className="order-4 md:col-span-4 md:order-4 liquid-glass p-6" data-testid="bento-client-health">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/30 via-transparent to-orange-50/20 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-rose-500/10 backdrop-blur-sm">
                  <Heart className="h-5 w-5 text-rose-500" />
                </div>
                <h2 className="text-lg font-heading font-bold text-gray-900">Client Health</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-700">{retentionRate}%</span>
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
                  <span className="text-sm font-bold text-purple-600" data-testid="text-active-offers">{activeClients}</span>
                </div>
                <div className="h-px bg-gray-100/80" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Avg. Client Lifetime</p>
                      <p className="text-xs text-muted-foreground">Above industry average</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{avgClientLifetime}</span>
                </div>
                <div className="h-px bg-gray-100/80" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Renewals Due</p>
                      <p className="text-xs text-muted-foreground">{renewalsSoon} clients this quarter</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{renewalsSoon}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity bento box */}
          <div className="order-2 md:col-span-5 md:order-2 liquid-glass p-6" data-testid="bento-activity">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/20 via-transparent to-slate-50/20 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-violet-500/10 backdrop-blur-sm">
                    <Activity className="h-5 w-5 text-violet-600" />
                  </div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">Notifications</h2>
                </div>
                {(unreadMessagesCount + unreadEnquiriesCount + unreadBrokerNotificationsCount) > 0 && (
                  <Badge variant="destructive" className="rounded-full">{unreadMessagesCount + unreadEnquiriesCount + unreadBrokerNotificationsCount} new</Badge>
                )}
              </div>
              <div className="space-y-2">
                {(() => {
                  const recentItems: { type: string; label: string; detail: string; time: string; timestamp: number; icon: React.ReactNode; isNew: boolean; onClick?: () => void }[] = [];
                  clientMessages.slice(0, 5).forEach(m => {
                    recentItems.push({
                      type: 'message',
                      label: getClientName(m.clientId),
                      detail: m.subject || m.content.substring(0, 50),
                      time: formatDistance(new Date(m.createdAt), new Date(), { addSuffix: true }),
                      timestamp: new Date(m.createdAt).getTime(),
                      icon: <MessageSquare className="h-3.5 w-3.5" />,
                      isNew: !m.read,
                      onClick: () => handleViewMessage(m)
                    });
                  });
                  enquiries.slice(0, 5).forEach(e => {
                    recentItems.push({
                      type: 'enquiry',
                      label: getClientName(e.clientId),
                      detail: e.note ? `${e.productType} enquiry — "${e.note}"` : `${e.productType} enquiry`,
                      time: formatDistance(new Date(e.createdAt), new Date(), { addSuffix: true }),
                      timestamp: new Date(e.createdAt).getTime(),
                      icon: <ClipboardList className="h-3.5 w-3.5" />,
                      isNew: !e.read,
                      onClick: () => { if (!e.read) markEnquiryReadMutation.mutate(e.id); setSelectedEnquiry(e); }
                    });
                  });
                  brokerNotifications.slice(0, 5).forEach(bn => {
                    recentItems.push({
                      type: 'appointment_reminder',
                      label: bn.title,
                      detail: bn.message,
                      time: formatDistance(new Date(bn.createdAt), new Date(), { addSuffix: true }),
                      timestamp: new Date(bn.createdAt).getTime(),
                      icon: <Calendar className="h-3.5 w-3.5" />,
                      isNew: !bn.read,
                      onClick: () => { if (!bn.read) markBrokerNotificationReadMutation.mutate(bn.id); setSelectedReminder(bn); }
                    });
                  });
                  clients.filter(c => c.createdAt).slice(0, 2).forEach(c => {
                    recentItems.push({
                      type: 'new_client',
                      label: c.name,
                      detail: 'Joined your portfolio',
                      time: formatDistance(new Date(c.createdAt!), new Date(), { addSuffix: true }),
                      timestamp: new Date(c.createdAt!).getTime(),
                      icon: <UserPlus className="h-3.5 w-3.5" />,
                      isNew: false
                    });
                  });
                  const typeColors: Record<string, { bg: string; border: string; iconBg: string; iconText: string; dot: string }> = {
                    message: { bg: 'bg-green-50/50', border: 'border-green-100/60', iconBg: 'bg-green-100', iconText: 'text-green-700', dot: 'bg-green-500' },
                    enquiry: { bg: 'bg-blue-50/50', border: 'border-blue-100/60', iconBg: 'bg-blue-100', iconText: 'text-blue-700', dot: 'bg-blue-500' },
                    new_client: { bg: 'bg-amber-50/50', border: 'border-amber-100/60', iconBg: 'bg-amber-100', iconText: 'text-amber-700', dot: 'bg-amber-500' },
                    appointment_reminder: { bg: 'bg-violet-50/50', border: 'border-violet-100/60', iconBg: 'bg-violet-100', iconText: 'text-violet-700', dot: 'bg-violet-500' },
                  };
                  return recentItems.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5).map((item, i) => {
                    const colors = typeColors[item.type] || typeColors.message;
                    return (
                    <div 
                      key={i} 
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${item.onClick ? 'cursor-pointer hover:bg-white/80 hover:shadow-sm' : 'hover:bg-white/60'} ${item.isNew ? `${colors.bg} border ${colors.border}` : 'bg-white/30 border border-white/30'}`}
                      onClick={item.onClick}
                      data-testid={`activity-item-${item.type}-${i}`}
                    >
                      <div className={`p-1.5 rounded-lg ${colors.iconBg} ${colors.iconText}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {item.isNew && <span className={`w-1.5 h-1.5 ${colors.dot} rounded-full animate-pulse`} />}
                          <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                        {item.onClick && <ArrowUpRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                  );});
                })()}
                {clientMessages.length === 0 && enquiries.length === 0 && clients.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setLocation("/broker/notifications")}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium text-violet-600 bg-violet-50/60 hover:bg-violet-100/80 border border-violet-100/60 transition-all hover:shadow-sm flex items-center justify-center gap-2"
                data-testid="button-view-all-notifications"
              >
                View All Notifications
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Client Communication (tabbed) */}
          <div className="order-3 md:col-span-8 md:order-3 liquid-glass" data-testid="bento-client-engagement">
            <Tabs defaultValue="enquiries" className="w-full">
              <div className="p-4 sm:p-5 border-b border-gray-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100">
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-heading font-bold text-gray-900">Client Communication</h3>
                </div>
                <TabsList className="bg-gray-50 h-9 w-full sm:w-auto grid grid-cols-4 sm:flex sm:items-center">
                  <TabsTrigger value="enquiries" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5 px-1.5 sm:px-3 data-[state=active]:bg-white data-[state=active]:text-emerald-700" data-testid="tab-client-enquiries">
                    <ClipboardList className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">Client </span>Enquiries
                    {unreadEnquiriesCount > 0 && (
                      <Badge variant="destructive" className="ml-0.5 sm:ml-1 rounded-full h-4 px-1 sm:px-1.5 text-[10px]">{unreadEnquiriesCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="appointments" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5 px-1.5 sm:px-3 data-[state=active]:bg-white data-[state=active]:text-emerald-700" data-testid="tab-client-appointments">
                    <CalendarCheck className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">Client </span>Appointments
                    {upcomingAppointmentsCount > 0 && (
                      <Badge variant="secondary" className="ml-0.5 sm:ml-1 rounded-full h-4 px-1 sm:px-1.5 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">{upcomingAppointmentsCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5 px-1.5 sm:px-3 data-[state=active]:bg-white data-[state=active]:text-emerald-700" data-testid="tab-client-messages">
                    <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">Client </span>Messages
                    {unreadMessagesCount > 0 && (
                      <Badge variant="destructive" className="ml-0.5 sm:ml-1 rounded-full h-4 px-1 sm:px-1.5 text-[10px]">{unreadMessagesCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="client-rewards" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5 px-1.5 sm:px-3 data-[state=active]:bg-white data-[state=active]:text-emerald-700" data-testid="tab-client-rewards">
                    <Gift className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">Client </span>Rewards
                    {brokerSentRewardsList.filter((r: any) => r.status === 'pending').length > 0 && (
                      <Badge variant="secondary" className="ml-0.5 sm:ml-1 rounded-full h-4 px-1 sm:px-1.5 text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">{brokerSentRewardsList.filter((r: any) => r.status === 'pending').length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Appointments tab */}
              <TabsContent value="appointments" className="m-0 p-2">
                <div className="px-3 pt-1 pb-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {sortedAppointments.length === 0
                      ? 'No meetings yet'
                      : `${sortedAppointments.length} total · ${upcomingAppointmentsCount} upcoming`}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8 rounded-lg border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-700"
                    onClick={() => setLocation("/broker/appointments")}
                    data-testid="button-open-appointments"
                  >
                    <Plus className="h-3.5 w-3.5" /> Schedule Meeting
                  </Button>
                </div>
                {sortedAppointments.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No appointments scheduled yet</p>
                    <p className="text-xs">Schedule a meeting using the button above, or from a client enquiry.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sortedAppointments.slice(0, 6).map((appointment) => {
                      const meetingIsPast = appointment.meetingDate ? isPast(parseISO(appointment.meetingDate)) : false;
                      return (
                        <div
                          key={appointment.id}
                          className={`p-3 rounded-xl transition-all hover:bg-white/60 bg-white/30 ${meetingIsPast ? 'opacity-60' : ''}`}
                          data-testid={`appointment-row-${appointment.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="p-1.5 rounded-lg bg-blue-100 flex-shrink-0">
                                <Calendar className="h-3.5 w-3.5 text-blue-700" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm text-gray-900 truncate" data-testid={`appointment-client-${appointment.id}`}>
                                    {getClientName(appointment.clientId)}
                                  </span>
                                  <span className="text-xs text-muted-foreground capitalize" data-testid={`appointment-product-${appointment.id}`}>
                                    {appointment.productType.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground" data-testid={`appointment-date-${appointment.id}`}>
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{formatMeetingDateTime(appointment.meetingDate, appointment.meetingTime)}</span>
                                  {appointment.meetingDate && (
                                    <span className="hidden sm:inline text-muted-foreground/70">
                                      ({formatDistance(parseISO(appointment.meetingDate), new Date(), { addSuffix: true })})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary" className={`text-[10px] py-0 flex-shrink-0 ${
                              appointment.meetingStatus === 'confirmed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                              appointment.meetingStatus === 'change_requested' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                              appointment.meetingStatus === 'completed' ? 'bg-gray-100 text-gray-600 hover:bg-gray-100' :
                              'bg-blue-100 text-blue-700 hover:bg-blue-100'
                            }`} data-testid={`appointment-status-${appointment.id}`}>
                              {appointment.meetingStatus === 'confirmed' ? 'Confirmed' :
                               appointment.meetingStatus === 'change_requested' ? 'Change Requested' :
                               appointment.meetingStatus === 'completed' ? 'Completed' : 'Scheduled'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    {sortedAppointments.length > 6 && (
                      <div className="pt-2 pb-1 text-center">
                        <Button variant="link" size="sm" className="text-xs text-primary" data-testid="button-view-all-appointments" onClick={() => setLocation("/broker/appointments")}>
                          View all {sortedAppointments.length} appointments
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Enquiries tab */}
              <TabsContent value="enquiries" className="m-0 p-2">
                {enquiries.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No enquiries yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {enquiries.slice(0, 6).map((enquiry) => (
                      <div
                        key={enquiry.id}
                        className={`p-3 rounded-xl cursor-pointer transition-all hover:bg-white/60 ${!enquiry.read ? 'bg-green-50/50 border border-green-100/60' : 'bg-white/30'}`}
                        data-testid={`enquiry-row-${enquiry.id}`}
                        onClick={() => {
                          setSelectedEnquiry(enquiry);
                          if (!enquiry.read) markEnquiryReadMutation.mutate(enquiry.id);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-lg ${!enquiry.read ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {enquiry.productType === "Home Insurance" ? (
                              <Home className="h-3.5 w-3.5 text-green-700" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5 text-green-700" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!enquiry.read && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                              <span className="font-medium text-sm text-gray-900 truncate" data-testid={`enquiry-product-${enquiry.id}`}>
                                {enquiry.productType}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistance(new Date(enquiry.createdAt), new Date(), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-muted-foreground">{getClientName(enquiry.clientId)}</p>
                              {enquiry.meetingStatus === "scheduled" && (
                                <Badge variant="outline" className="text-[10px] py-0 bg-blue-50 text-blue-600 border-blue-200">Pending</Badge>
                              )}
                              {enquiry.meetingStatus === "confirmed" && (
                                <Badge variant="outline" className="text-[10px] py-0 bg-green-50 text-green-600 border-green-200">Confirmed</Badge>
                              )}
                              {enquiry.meetingStatus === "change_requested" && (
                                <Badge variant="outline" className="text-[10px] py-0 bg-amber-50 text-amber-600 border-amber-200">Reschedule</Badge>
                              )}
                            </div>
                            {enquiry.note && (
                              <p
                                className="text-xs text-gray-700 mt-1 italic line-clamp-2"
                                data-testid={`enquiry-note-${enquiry.id}`}
                              >
                                "{enquiry.note}"
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0 text-gray-400 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEnquiry(enquiry);
                              if (!enquiry.read) markEnquiryReadMutation.mutate(enquiry.id);
                            }}
                            data-testid={`button-view-enquiry-${enquiry.id}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Messages tab */}
              <TabsContent value="messages" className="m-0 p-2">
                <div className="px-3 pt-1 pb-2 flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8 rounded-lg border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-700"
                    onClick={() => setSendMessageOpen(true)}
                    data-testid="button-send-client-message"
                  >
                    <Send className="h-3.5 w-3.5" /> Send Message
                  </Button>
                </div>
                {clientMessages.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {clientMessages.slice(0, 6).map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-xl cursor-pointer transition-all hover:bg-white/60 ${!message.read ? 'bg-green-50/50 border border-green-100/60' : 'bg-white/30'}`}
                        onClick={() => handleViewMessage(message)}
                        data-testid={`message-row-${message.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!message.read && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                              <span className="font-medium text-sm text-gray-900 truncate" data-testid={`message-client-${message.id}`}>
                                {getClientName(message.clientId)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistance(new Date(message.createdAt), new Date(), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{message.content}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0 text-gray-400 hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); handleViewMessage(message); }}
                            data-testid={`button-view-message-${message.id}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {clientMessages.length > 6 && (
                      <div className="pt-2 pb-1 text-center">
                        <Button variant="link" size="sm" className="text-xs text-primary" data-testid="button-view-all-messages" onClick={() => setLocation("/broker/messages")}>
                          View all {clientMessages.length} messages
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Client Rewards tab */}
              <TabsContent value="client-rewards" className="m-0 p-2" data-testid="tab-content-client-rewards">
                <div className="px-3 pt-1 pb-2">
                  <p className="text-xs text-muted-foreground">Send a £5 gift card to any of your clients as a goodwill gesture</p>
                </div>

                {/* Credit wallet bento */}
                <div className="mx-1 mb-3 rounded-2xl overflow-hidden" style={{ border: '1.5px solid rgba(68,186,132,0.22)', background: 'linear-gradient(135deg, rgba(68,186,132,0.06) 0%, rgba(255,255,255,0.85) 100%)' }} data-testid="bento-reward-credits">
                  <div className="flex divide-x" style={{ divideColor: 'rgba(68,186,132,0.15)' }}>
                    {/* Balance panel */}
                    <div className="flex-1 p-4 flex flex-col items-start gap-0.5 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Credit wallet</p>
                      <div className="flex items-end gap-1.5 mt-1">
                        <span className="text-3xl font-heading font-bold" style={{ color: '#1a7a5c' }} data-testid="text-reward-credits-balance">{rewardCredits}</span>
                        <span className="text-xs text-muted-foreground mb-1">credit{rewardCredits !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-[11px] font-semibold" style={{ color: '#1a7a5c' }} data-testid="text-reward-credits-value">£{rewardCredits * 5} value</p>
                      <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">1 credit = 1 gift card sent</p>
                    </div>
                    {/* Top-up panel */}
                    <div className="flex-[2] p-3 flex flex-col gap-1.5 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 mb-0.5">Top up</p>
                      {([
                        { credits: 1, price: 5, label: '1 credit' },
                        { credits: 5, price: 25, label: '5 credits' },
                        { credits: 10, price: 50, label: '10 credits' },
                      ] as const).map(pack => (
                        <button
                          key={pack.credits}
                          onClick={() => handleTopUp(pack.credits)}
                          disabled={topUpBusy !== null}
                          className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-left transition-all disabled:opacity-60"
                          style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(68,186,132,0.2)' }}
                          data-testid={`button-topup-${pack.credits}`}
                        >
                          <span className="text-xs font-medium text-gray-800">{pack.label}</span>
                          <span className="text-xs font-bold shrink-0 ml-2 flex items-center gap-1" style={{ color: '#1a7a5c' }}>
                            {topUpBusy === pack.credits ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `£${pack.price}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {rewardCredits === 0 && clients.length > 0 && (
                  <div className="mx-1 mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-amber-800 font-medium" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }} data-testid="banner-no-credits">
                    <span className="text-sm">⚠️</span>
                    <span>Your credit wallet is empty — top up above to send gift cards to clients.</span>
                  </div>
                )}

                {clients.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Gift className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No clients yet</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                    {clients.map((client: any) => {
                      const latestReward = brokerSentRewardsList.find((r: any) => r.clientId === client.id);
                      return (
                        <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-all" data-testid={`row-client-reward-${client.id}`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{client.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                          </div>
                          {latestReward && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${latestReward.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' : latestReward.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`} data-testid={`status-reward-${client.id}`}>
                              {latestReward.status === 'fulfilled' ? '✓ Fulfilled' : latestReward.status === 'sent' ? 'Sent' : 'Pending'}
                            </span>
                          )}
                          <Button
                            size="sm"
                            className="h-7 text-xs rounded-lg shrink-0 text-white disabled:opacity-50"
                            style={{ background: rewardCredits > 0 ? '#44ba84' : '#9ca3af' }}
                            disabled={rewardCredits === 0}
                            title={rewardCredits === 0 ? 'Top up your credit wallet to send a gift card' : undefined}
                            onClick={() => setSendRewardModal({ open: true, clientId: client.id, clientName: client.name, brand: null, step: 'brand' })}
                            data-testid={`button-send-reward-${client.id}`}
                          >
                            <Gift className="h-3.5 w-3.5 mr-1" /> Send
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {brokerSentRewardsList.length > 0 && (
                  <div className="mt-4 px-3 border-t pt-3">
                    <button
                      className="flex items-center justify-between w-full mb-2 group"
                      onClick={() => setSentHistoryOpen(o => !o)}
                      data-testid="button-toggle-sent-history"
                    >
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent History ({brokerSentRewardsList.length})</p>
                      <span className="text-[10px] text-muted-foreground group-hover:text-gray-600 transition-colors">{sentHistoryOpen ? '▲ Hide' : '▼ Show'}</span>
                    </button>
                    {sentHistoryOpen && (
                      <div className="space-y-0.5 max-h-[160px] overflow-y-auto">
                        {brokerSentRewardsList.slice(0, 10).map((r: any) => {
                          const brand = BROKER_REWARD_BRANDS.find(b => b.id === r.brand);
                          const dateStr = r.createdAt ? format(new Date(r.createdAt), 'd MMM yyyy') : '';
                          return (
                            <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground py-1.5 px-2 rounded-lg hover:bg-white/40" data-testid={`row-reward-history-${r.id}`}>
                              <span>{brand?.icon || '🎁'}</span>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-700">{r.clientName}</span>
                                <span className="hidden sm:inline text-gray-400"> · {brand?.label || r.brand} £{Number(r.valueGbp).toFixed(2)}</span>
                              </div>
                              <span className="hidden sm:inline text-gray-400 shrink-0">{dateStr}</span>
                              <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${r.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' : r.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                {r.status === 'fulfilled' ? '✓ Fulfilled' : r.status === 'sent' ? 'Sent' : 'Pending'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Send Reward Dialog */}
        <Dialog open={sendRewardModal.open} onOpenChange={(open) => { if (!open) setSendRewardModal({ open: false, clientId: null, clientName: '', brand: null, step: 'brand' }); }}>
          <DialogContent className="sm:max-w-md bg-white" data-testid="dialog-send-reward">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-gray-900">
                {sendRewardModal.step === 'brand' ? 'Choose a Gift Card' : 'Confirm & Send'}
              </DialogTitle>
              <DialogDescription>
                {sendRewardModal.step === 'brand'
                  ? `Select a £5 gift card to send to ${sendRewardModal.clientName}`
                  : `You're sending a £5 ${BROKER_REWARD_BRANDS.find(b => b.id === sendRewardModal.brand)?.label} gift card to ${sendRewardModal.clientName}`}
              </DialogDescription>
            </DialogHeader>
            {sendRewardModal.step === 'brand' ? (
              <div className="space-y-2 mt-2">
                {BROKER_REWARD_BRANDS.map(brand => (
                  <button
                    key={brand.id}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-sm text-left"
                    style={{ borderColor: 'rgba(68,186,132,0.2)', background: brand.bg }}
                    onClick={() => setSendRewardModal(s => ({ ...s, brand: brand.id, step: 'confirm' }))}
                    data-testid={`button-brand-${brand.id}`}
                  >
                    <span className="text-2xl">{brand.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{brand.label}</p>
                      <p className="text-xs text-muted-foreground">£5 Gift Card</p>
                    </div>
                    <span className="ml-auto text-emerald-500 text-xs font-medium">Select →</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                <div className="flex gap-3 p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}>
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Rewards must only be sent as a goodwill bonus <strong>after a completed milestone</strong> — never to incentivise or influence a financial transaction.
                  </p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(68,186,132,0.06)', border: '1px solid rgba(68,186,132,0.15)' }}>
                  <span className="text-2xl">{BROKER_REWARD_BRANDS.find(b => b.id === sendRewardModal.brand)?.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{BROKER_REWARD_BRANDS.find(b => b.id === sendRewardModal.brand)?.label} — £5 Gift Card</p>
                    <p className="text-sm text-muted-foreground">To: {sendRewardModal.clientName}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setSendRewardModal(s => ({ ...s, step: 'brand' }))} data-testid="button-back-brand">
                    ← Back
                  </Button>
                  <Button
                    className="flex-1 text-white"
                    style={{ background: '#44ba84' }}
                    disabled={sendRewardMutation.isPending}
                    onClick={() => sendRewardMutation.mutate({ clientId: sendRewardModal.clientId!, brand: sendRewardModal.brand! })}
                    data-testid="button-confirm-send-reward"
                  >
                    {sendRewardMutation.isPending ? 'Sending…' : 'Confirm & Send 🎁'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Message Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={(open) => { if (!open) { setSelectedMessage(null); setReplyText(""); } }}>
          <DialogContent className="sm:max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-gray-900">
                {selectedMessage?.subject || "Message"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                From {selectedMessage ? getClientName(selectedMessage.clientId) : ''} • {selectedMessage?.createdAt && formatDistance(new Date(selectedMessage.createdAt), new Date(), { addSuffix: true })}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage?.content}</p>
            </div>
            <div className="mt-4 space-y-3">
              <Label htmlFor="replyMessage" className="text-sm font-medium text-gray-700">Reply</Label>
              <Textarea
                id="replyMessage"
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="bg-gray-50 border-gray-200 min-h-[100px]"
                data-testid="textarea-reply"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => { setSelectedMessage(null); setReplyText(""); }}
                data-testid="button-close-message"
              >
                Close
              </Button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                disabled={!replyText.trim() || sendReplyMutation.isPending}
                onClick={() => {
                  if (selectedMessage && replyText.trim()) {
                    sendReplyMutation.mutate({
                      clientId: selectedMessage.clientId,
                      content: replyText.trim()
                    });
                  }
                }}
                data-testid="button-send-reply"
              >
                <Send className="w-4 h-4" /> {sendReplyMutation.isPending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Enquiry Dialog */}
        <Dialog open={!!selectedEnquiry} onOpenChange={(open) => { if (!open) { setSelectedEnquiry(null); setSchedulingMeeting(false); setMeetingDate(""); setMeetingTime(""); setEnquiryMeetingLink(""); } }}>
          <DialogContent className="sm:max-w-lg bg-white">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  {selectedEnquiry?.productType === "Home Insurance" ? (
                    <Home className="h-5 w-5 text-green-700" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-green-700" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl font-heading font-bold text-gray-900">
                    {selectedEnquiry?.productType?.endsWith("Enquiry") ? selectedEnquiry.productType : `${selectedEnquiry?.productType} Enquiry`}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    From {selectedEnquiry ? getClientName(selectedEnquiry.clientId) : ''} • {selectedEnquiry?.createdAt && formatDistance(new Date(selectedEnquiry.createdAt), new Date(), { addSuffix: true })}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedEnquiry?.meetingStatus === "change_requested" && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-900 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Reschedule Requested
                </h4>
                <p className="text-sm text-amber-700">Let me know when you are free for a meeting!</p>
              </div>
            )}

            {selectedEnquiry?.meetingStatus === "scheduled" && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Meeting Scheduled
                </h4>
                <p className="text-sm text-blue-700">
                  {selectedEnquiry.meetingDate && new Date(selectedEnquiry.meetingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {selectedEnquiry.meetingTime}
                </p>
                {selectedEnquiry.meetingLink && (
                  <a href={selectedEnquiry.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 inline-block" data-testid="link-enquiry-meeting">
                    Join Meeting
                  </a>
                )}
                <p className="text-xs text-blue-600 mt-1">Waiting for client to confirm</p>
              </div>
            )}

            {selectedEnquiry?.meetingStatus === "confirmed" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Meeting Confirmed
                </h4>
                <p className="text-sm text-green-700">
                  {selectedEnquiry.meetingDate && new Date(selectedEnquiry.meetingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {selectedEnquiry.meetingTime}
                </p>
                {selectedEnquiry.meetingLink && (
                  <a href={selectedEnquiry.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 inline-block" data-testid="link-enquiry-meeting-confirmed">
                    Join Meeting
                  </a>
                )}
              </div>
            )}

            {!schedulingMeeting ? (
              <>
                <div className="mt-4 space-y-4">
                  {selectedEnquiry?.note && (
                    <div
                      className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-1"
                      data-testid="enquiry-detail-note"
                    >
                      <h4 className="font-medium text-blue-900 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Note from client
                      </h4>
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">"{selectedEnquiry.note}"</p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <h4 className="font-medium text-gray-900">Product Details</h4>
                    {selectedEnquiry?.productType === "Home Insurance" ? (
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>Your client is interested in <strong>Home Insurance</strong> coverage.</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Buildings and contents protection</li>
                          <li>Accidental damage cover</li>
                          <li>Personal possessions coverage</li>
                          <li>Legal expenses protection</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>Your client is interested in <strong>{selectedEnquiry?.productType}</strong>.</p>
                        {(selectedEnquiry?.productType === "Life Insurance") && (
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Term life or whole life options</li>
                            <li>Critical illness cover</li>
                            <li>Income protection</li>
                            <li>Family protection plans</li>
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => { setSelectedEnquiry(null); setSchedulingMeeting(false); }}
                    data-testid="button-close-enquiry"
                  >
                    Close
                  </Button>
                  {(() => {
                    const hasCalendarUrl = !!(user as any)?.calendarUrl?.trim();
                    if (!hasCalendarUrl) {
                      return (
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setLocation("/profile")}
                          data-testid="button-add-calendar-link"
                        >
                          <Calendar className="w-4 h-4 mr-2" /> Add booking link in Profile
                        </Button>
                      );
                    }
                    const isReschedule = selectedEnquiry?.meetingStatus === "change_requested" || selectedEnquiry?.meetingStatus === "confirmed";
                    return (
                      <button
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100"
                        style={{ background: isReschedule ? '#d97706' : '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                        onClick={() => {
                          if (selectedEnquiry) {
                            sendBookingLinkMutation.mutate({
                              clientId: selectedEnquiry.clientId,
                              productType: selectedEnquiry.productType,
                            });
                          }
                        }}
                        disabled={sendBookingLinkMutation.isPending}
                        data-testid="button-schedule-meeting"
                      >
                        <Calendar className="w-4 h-4" /> {sendBookingLinkMutation.isPending ? "Sending..." : (isReschedule ? "Send New Booking Link" : "Schedule a Meeting")}
                      </button>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Meeting Link (Optional)</Label>
                  <Input
                    type="url"
                    placeholder="https://zoom.us/j/... or Google Meet link"
                    value={enquiryMeetingLink}
                    onChange={(e) => setEnquiryMeetingLink(e.target.value)}
                    className="bg-white"
                    data-testid="input-enquiry-meeting-link"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Paste your Zoom, Teams, or Google Meet link</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-700" /> Pick a Date & Time
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">Date</Label>
                      <Input
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-white"
                        data-testid="input-meeting-date"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">Time</Label>
                      <Input
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="bg-white"
                        data-testid="input-meeting-time"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => { setSchedulingMeeting(false); setMeetingDate(""); setMeetingTime(""); setEnquiryMeetingLink(""); }}
                    data-testid="button-cancel-schedule"
                  >
                    Back
                  </Button>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100"
                    style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                    disabled={!meetingDate || !meetingTime || scheduleMeetingMutation.isPending}
                    onClick={() => {
                      if (selectedEnquiry && meetingDate && meetingTime) {
                        scheduleMeetingMutation.mutate({
                          enquiryId: selectedEnquiry.id,
                          meetingDate,
                          meetingTime,
                          meetingLink: enquiryMeetingLink || undefined,
                        });
                      }
                    }}
                    data-testid="button-confirm-schedule"
                  >
                    <Send className="w-4 h-4" /> {scheduleMeetingMutation.isPending ? "Sending..." : "Send to Client"}
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Client Management Table */}
        <div className="liquid-glass">
          <div className="p-5 border-b border-gray-100/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="text-base font-heading font-bold text-gray-900">Client Portfolio</h3>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-full text-xs">{totalClients}</Badge>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-[1.03]"
                style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.2)' }}
                onClick={() => setLocation("/broker/clients")}
                data-testid="button-view-all-clients"
              >
                <Users className="w-3.5 h-3.5" /> View All
              </button>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100/60 bg-white/30">
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ paddingLeft: '15px' }}>Client</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Renewal</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...clients]
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 15)
                .map((client) => (
                  <TableRow 
                    key={client.id} 
                    className="hover:bg-white/40 transition-colors cursor-pointer border-b border-gray-100/40" 
                    data-testid={`row-client-${client.id}`}
                    onClick={() => {
                      queryClient.removeQueries({ queryKey: ['client-journey'] });
                      setSelectedClient(client);
                      setClientPopupOpen(true);
                    }}
                  >
                    <TableCell className="font-medium text-sm text-gray-900" style={{ paddingLeft: '15px' }} data-testid={`text-client-name-${client.id}`}>{client.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs rounded-full ${
                        client.status === "Active" ? "bg-green-100/80 text-green-700 hover:bg-green-100" :
                        client.status === "Pending" ? "bg-yellow-100/80 text-yellow-700 hover:bg-yellow-100" :
                        "bg-gray-100/80 text-gray-600 hover:bg-gray-100"
                      }`}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-sm ${client.renewalDate?.includes("2024") ? "text-amber-600 font-medium" : "text-gray-600"}`}>
                      {client.renewalDate || 'Not set'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                      {client.email}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-primary rounded-lg" data-testid={`button-email-${client.id}`}>
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-primary rounded-lg" data-testid={`button-phone-${client.id}`}>
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 rounded-lg" data-testid={`button-more-${client.id}`}>
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-3 text-center border-t border-gray-100/40">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs text-primary gap-1.5 rounded-xl" 
              data-testid="button-view-full-client-list"
              onClick={() => setLocation("/broker/clients")}
            >
              View Full Client List <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {user?.companyId && (companyAnnouncements.length > 0 || companyMsgs.length > 0 || true) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="liquid-glass p-6" data-testid="bento-company-announcements">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-transparent to-orange-50/20 pointer-events-none rounded-[1.25rem]" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-amber-100">
                    <Megaphone className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-base font-heading font-bold text-gray-900">Company Announcements</h3>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {companyAnnouncements.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No announcements from your company</p>
                    </div>
                  ) : (
                    companyAnnouncements.slice(0, 5).map((ann) => (
                      <div key={ann.id} className="liquid-glass-sm p-3" data-testid={`card-broker-announcement-${ann.id}`}>
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

            <div className="liquid-glass p-6" data-testid="bento-company-messages">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 via-transparent to-purple-50/20 pointer-events-none rounded-[1.25rem]" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-100">
                      <Building2 className="h-4 w-4 text-violet-600" />
                    </div>
                    <h3 className="text-base font-heading font-bold text-gray-900">Company Messages</h3>
                    {companyUnreadCount > 0 && (
                      <Badge variant="destructive" className="rounded-full px-2 text-xs">{companyUnreadCount}</Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-8 rounded-lg bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => setCompanyMsgOpen(true)}
                    data-testid="button-message-company"
                  >
                    <Send className="h-3.5 w-3.5" /> Message
                  </Button>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {companyMsgs.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Building2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No messages from your company</p>
                    </div>
                  ) : (
                    <>
                      <button
                        className="w-full liquid-glass-sm p-3 text-left hover:scale-[1.01] transition-all"
                        onClick={() => {
                          setCompanyThreadOpen(true);
                          companyMsgs.filter(m => !m.read && m.senderType === "company").forEach(m => {
                            fetch(`/api/broker/company-messages/${m.id}/read`, { method: "POST", credentials: "include" });
                          });
                          queryClient.invalidateQueries({ queryKey: ["broker-company-messages"] });
                        }}
                        data-testid="button-view-company-thread"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-semibold shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">Your Company</p>
                              {companyUnreadCount > 0 && (
                                <Badge variant="destructive" className="rounded-full px-1.5 text-[10px]">{companyUnreadCount}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {companyMsgs[companyMsgs.length - 1].senderType === "broker" ? "You: " : ""}{companyMsgs[companyMsgs.length - 1].content}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistance(new Date(companyMsgs[companyMsgs.length - 1].createdAt), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <Dialog open={companyMsgOpen} onOpenChange={setCompanyMsgOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-heading font-bold flex items-center gap-2">
                <Send className="h-5 w-5 text-violet-600" />
                Message Company
              </DialogTitle>
              <DialogDescription>Send a message to your company</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label htmlFor="company-msg-subject" className="text-sm font-medium">Subject</Label>
                <Input
                  id="company-msg-subject"
                  placeholder="Message subject"
                  value={companyMsgForm.subject}
                  onChange={(e) => setCompanyMsgForm(f => ({ ...f, subject: e.target.value }))}
                  className="mt-1"
                  data-testid="input-company-msg-subject"
                />
              </div>
              <div>
                <Label htmlFor="company-msg-content" className="text-sm font-medium">Message</Label>
                <Textarea
                  id="company-msg-content"
                  placeholder="Type your message..."
                  value={companyMsgForm.content}
                  onChange={(e) => setCompanyMsgForm(f => ({ ...f, content: e.target.value }))}
                  rows={4}
                  className="mt-1"
                  data-testid="input-company-msg-content"
                />
              </div>
              <Button
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => sendCompanyMsgMutation.mutate(companyMsgForm)}
                disabled={!companyMsgForm.content || sendCompanyMsgMutation.isPending}
                data-testid="button-send-company-message"
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
                <Building2 className="h-5 w-5 text-violet-600" />
                Company Messages
              </DialogTitle>
              <DialogDescription>Your conversation with your company</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-[200px] max-h-[400px]">
              {companyMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === "broker" ? "justify-end" : "justify-start"}`}
                  data-testid={`company-thread-msg-${msg.id}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.senderType === "broker"
                      ? "bg-violet-600 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  }`}>
                    {msg.subject && (
                      <p className={`text-xs font-semibold mb-1 ${msg.senderType === "broker" ? "text-violet-200" : "text-gray-500"}`}>
                        {msg.subject}
                      </p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.senderType === "broker" ? "text-violet-200" : "text-gray-400"}`}>
                      {formatDistance(new Date(msg.createdAt), new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Input
                placeholder="Type a reply..."
                value={companyThreadReply}
                onChange={(e) => setCompanyThreadReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && companyThreadReply.trim()) {
                    sendCompanyMsgMutation.mutate({ subject: "", content: companyThreadReply.trim() });
                    setCompanyThreadReply("");
                  }
                }}
                data-testid="input-company-thread-reply"
              />
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white px-4"
                onClick={() => {
                  if (companyThreadReply.trim()) {
                    sendCompanyMsgMutation.mutate({ subject: "", content: companyThreadReply.trim() });
                    setCompanyThreadReply("");
                  }
                }}
                disabled={!companyThreadReply.trim() || sendCompanyMsgMutation.isPending}
                data-testid="button-company-thread-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={announcementPopupOpen} onOpenChange={(open) => { if (!open) dismissAnnouncement(); }}>
          <DialogContent className="max-w-md bg-white p-0 overflow-hidden" data-testid="dialog-announcement-popup">
            <div className={`px-6 pt-6 pb-4 ${currentPopupAnnouncement?.priority === "urgent" ? "bg-gradient-to-br from-red-50 via-orange-50/50 to-white" : "bg-gradient-to-br from-amber-50 via-yellow-50/30 to-white"}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${currentPopupAnnouncement?.priority === "urgent" ? "bg-red-100" : "bg-amber-100"}`}>
                  <Megaphone className={`h-6 w-6 ${currentPopupAnnouncement?.priority === "urgent" ? "text-red-600" : "text-amber-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Company Announcement</p>
                    {currentPopupAnnouncement?.priority === "urgent" && (
                      <Badge className="border-0 bg-red-100 text-red-700 hover:bg-red-100 text-[10px] px-1.5 py-0">Urgent</Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-heading font-bold text-gray-900" data-testid="text-announcement-popup-title">
                    {currentPopupAnnouncement?.title}
                  </h3>
                </div>
              </div>
            </div>
            <div className="px-6 pb-2">
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100/60">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" data-testid="text-announcement-popup-content">
                  {currentPopupAnnouncement?.content}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4 mb-2">
                <span className="text-xs text-muted-foreground">
                  {currentPopupAnnouncement?.createdAt && formatDistance(new Date(currentPopupAnnouncement.createdAt), new Date(), { addSuffix: true })}
                </span>
                <Button
                  onClick={dismissAnnouncement}
                  className={`px-6 ${currentPopupAnnouncement?.priority === "urgent" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"} text-white`}
                  data-testid="button-dismiss-announcement"
                >
                  Got it
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Client Details Popup */}
        <Dialog open={clientPopupOpen} onOpenChange={(open) => { setClientPopupOpen(open); if (!open) { setEditingMortgageValue(false); setEditingRenewalDate(false); setEditingInterestRate(false); setEditingMonthlyPayment(false); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading flex items-center gap-2">
                {selectedClient?.name}
              </DialogTitle>
              <DialogDescription>
                Client details and quick actions
              </DialogDescription>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-4">
                {/* Personal Info bento */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: '#ffffff', border: '1px solid rgba(68,186,132,0.18)' }}
                  data-testid="bento-personal-info"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: '#0f766e' }}>Personal Info</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                      <button
                        onClick={() => {
                          const newStatus = selectedClient.status === "Active" ? "Inactive" : "Active";
                          toggleClientStatusMutation.mutate({ clientId: selectedClient.id, status: newStatus });
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedClient.status === "Active"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                        data-testid="button-toggle-client-status"
                      >
                        <div className={`w-7 h-4 rounded-full relative transition-colors ${
                          selectedClient.status === "Active" ? "bg-green-500" : "bg-gray-300"
                        }`}>
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${
                            selectedClient.status === "Active" ? "left-3.5" : "left-0.5"
                          }`} />
                        </div>
                        {selectedClient.status === "Active" ? "Active" : "Inactive"}
                      </button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="text-gray-700 text-sm break-all" data-testid="text-client-email">{selectedClient.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                      <p className="text-gray-700 text-sm" data-testid="text-client-phone">
                        {selectedClient.phone || <span className="text-gray-400">Not provided</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mortgage Details bento */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: '#ffffff', border: '1px solid rgba(68,186,132,0.18)' }}
                  data-testid="bento-mortgage-details"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: '#0f766e' }}>Mortgage Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Mortgage Value</p>
                      {editingMortgageValue ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                            <Input
                              type="number"
                              value={mortgageValueEdit}
                              onChange={(e) => setMortgageValueEdit(e.target.value)}
                              placeholder="e.g. 250000"
                              className="h-8 text-sm pl-6"
                              data-testid="input-mortgage-value"
                            />
                          </div>
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:brightness-110"
                            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                            onClick={() => {
                              if (mortgageValueEdit.trim()) {
                                updateMortgageValueMutation.mutate({
                                  clientId: selectedClient.id,
                                  mortgageValue: mortgageValueEdit.trim()
                                });
                              }
                            }}
                            data-testid="button-save-mortgage-value"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-700">
                            £{Number(selectedClient.mortgageValue).toLocaleString()}
                          </p>
                          <button
                            onClick={() => {
                              setMortgageValueEdit(selectedClient.mortgageValue);
                              setEditingMortgageValue(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            data-testid="button-edit-mortgage-value"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Interest Rate</p>
                      {editingInterestRate ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={interestRateEdit}
                              onChange={(e) => setInterestRateEdit(e.target.value)}
                              placeholder="e.g. 4.25"
                              className="h-8 text-sm pr-6"
                              data-testid="input-interest-rate"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                          </div>
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:brightness-110"
                            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                            onClick={() => {
                              updateInterestRateMutation.mutate({
                                clientId: selectedClient.id,
                                interestRate: interestRateEdit.trim()
                              });
                            }}
                            data-testid="button-save-interest-rate"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-700" data-testid="text-interest-rate">
                            {selectedClient.interestRate
                              ? `${parseFloat(selectedClient.interestRate)}%`
                              : <span className="text-gray-400">Not set</span>}
                          </p>
                          <button
                            onClick={() => {
                              setInterestRateEdit(selectedClient.interestRate ?? "");
                              setEditingInterestRate(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            data-testid="button-edit-interest-rate"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Payment</p>
                      {editingMonthlyPayment ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={monthlyPaymentEdit}
                              onChange={(e) => setMonthlyPaymentEdit(e.target.value)}
                              placeholder="e.g. 1542"
                              className="h-8 text-sm pl-6"
                              data-testid="input-monthly-payment"
                            />
                          </div>
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:brightness-110"
                            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                            onClick={() => {
                              updateMonthlyPaymentMutation.mutate({
                                clientId: selectedClient.id,
                                monthlyPayment: monthlyPaymentEdit.trim()
                              });
                            }}
                            data-testid="button-save-monthly-payment"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-700" data-testid="text-monthly-payment">
                            {selectedClient.monthlyPayment
                              ? `£${Number(selectedClient.monthlyPayment).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
                              : <span className="text-gray-400">Not set</span>}
                          </p>
                          <button
                            onClick={() => {
                              setMonthlyPaymentEdit(selectedClient.monthlyPayment ?? "");
                              setEditingMonthlyPayment(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            data-testid="button-edit-monthly-payment"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Renewal Date</p>
                      {editingRenewalDate ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={renewalDateValue}
                            onChange={(e) => setRenewalDateValue(e.target.value)}
                            placeholder="e.g., March 2025"
                            className="h-8 text-sm"
                            data-testid="input-renewal-date"
                          />
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:brightness-110"
                            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                            onClick={() => {
                              if (renewalDateValue.trim()) {
                                updateRenewalDateMutation.mutate({
                                  clientId: selectedClient.id,
                                  renewalDate: renewalDateValue.trim()
                                });
                              }
                            }}
                            data-testid="button-save-renewal-date"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${selectedClient.renewalDate?.includes("2024") ? "text-amber-600" : "text-gray-700"}`}>
                            {selectedClient.renewalDate}
                          </p>
                          <button
                            onClick={() => {
                              setRenewalDateValue(selectedClient.renewalDate);
                              setEditingRenewalDate(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            data-testid="button-edit-renewal-date"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">Quick Actions</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => {
                          setClientPopupOpen(false);
                          setMessageData({ 
                            clientId: selectedClient.id, 
                            clientName: selectedClient.name, 
                            subject: "", 
                            body: "" 
                          });
                          setSendMessageOpen(true);
                        }}
                        data-testid="button-popup-send-message"
                      >
                        <MessageSquare className="h-4 w-4" /> Send Message
                      </Button>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => window.location.href = `mailto:${selectedClient.email}`}
                        data-testid="button-popup-email"
                      >
                        <Mail className="h-4 w-4" /> Email Client
                      </Button>
                    </div>
                    <button 
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                      onClick={() => {
                        setClientPopupOpen(false);
                        setOfferData({ 
                          clientId: selectedClient.id, 
                          clientName: selectedClient.name, 
                          offerType: "", 
                          message: "" 
                        });
                        setSendOfferOpen(true);
                      }}
                      data-testid="button-popup-send-offer"
                    >
                      <Sparkles className="h-4 w-4" /> Send Offer
                    </button>
                    {selectedClient.phone && (
                      <Button 
                        variant="ghost" 
                        className="w-full gap-2"
                        onClick={() => window.location.href = `tel:${selectedClient.phone}`}
                        data-testid="button-popup-call"
                      >
                        <Phone className="h-4 w-4" /> Call Client
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Appointment Reminder Popup */}
        <Dialog open={!!selectedReminder} onOpenChange={(open) => !open && setSelectedReminder(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Appointment Reminder
              </DialogTitle>
              <DialogDescription>
                {selectedReminder?.message}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {(() => {
                const enquiry = selectedReminder?.enquiryId ? enquiries.find(e => e.id === selectedReminder.enquiryId) : null;
                const client = enquiry ? clients.find(c => c.id === enquiry.clientId) : null;
                return (
                  <>
                    {client && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                        {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                        {enquiry && <p className="text-xs text-muted-foreground mt-1">Regarding: {enquiry.productType}</p>}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.open('https://zoom.us/start/videomeeting', '_blank')}
                        data-testid="button-zoom-meeting"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Zoom
                      </Button>
                      {client?.phone && (
                        <Button
                          variant="outline"
                          className="flex-1 border-green-600 text-green-700 hover:bg-green-50"
                          onClick={() => window.open(`tel:${client.phone}`, '_self')}
                          data-testid="button-call-client"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={reviewPopupOpen} onOpenChange={(open) => { if (!open) setReviewPopupOpen(false); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" data-testid="text-review-popup-title">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                New Client Review
                {pendingReviewClients.length > 1 && (
                  <Badge variant="outline" className="ml-auto text-xs">1 of {pendingReviewClients.length}</Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Review and confirm mortgage details for your new client.
              </DialogDescription>
            </DialogHeader>
            {pendingReviewClients[0] && (
              <div className="space-y-4 mt-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 text-base" data-testid="text-review-client-name">{pendingReviewClients[0].name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{pendingReviewClients[0].email}</p>
                  {pendingReviewClients[0].phone && (
                    <p className="text-sm text-muted-foreground">{pendingReviewClients[0].phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Joined {pendingReviewClients[0].createdAt ? formatDistance(new Date(pendingReviewClients[0].createdAt!), new Date(), { addSuffix: true }) : "recently"}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="review-mortgage-value" className="text-sm font-medium">Mortgage Value (£)</Label>
                    <Input
                      id="review-mortgage-value"
                      type="number"
                      placeholder="e.g. 250000"
                      value={reviewForm.mortgageValue}
                      onChange={(e) => setReviewForm(f => ({ ...f, mortgageValue: e.target.value }))}
                      className="mt-1"
                      data-testid="input-review-mortgage-value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="review-interest-rate" className="text-sm font-medium">Interest Rate (%)</Label>
                    <Input
                      id="review-interest-rate"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 4.25"
                      min={0}
                      max={25}
                      value={reviewForm.interestRate}
                      onChange={(e) => setReviewForm(f => ({ ...f, interestRate: e.target.value }))}
                      className="mt-1"
                      data-testid="input-review-interest-rate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="review-mortgage-term" className="text-sm font-medium">Mortgage Term (years)</Label>
                    <Input
                      id="review-mortgage-term"
                      type="number"
                      placeholder="e.g. 25"
                      min={1}
                      max={40}
                      value={reviewForm.mortgageTerm}
                      onChange={(e) => setReviewForm(f => ({ ...f, mortgageTerm: e.target.value }))}
                      className="mt-1"
                      data-testid="input-review-mortgage-term"
                    />
                  </div>
                  <div>
                    <Label htmlFor="review-renewal-date" className="text-sm font-medium">Renewal Date</Label>
                    <Input
                      id="review-renewal-date"
                      type="date"
                      value={reviewForm.renewalDate}
                      onChange={(e) => setReviewForm(f => ({ ...f, renewalDate: e.target.value }))}
                      className="mt-1"
                      data-testid="input-review-renewal-date"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      reviewClientMutation.mutate({
                        clientId: pendingReviewClients[0].id,
                        data: {},
                      });
                    }}
                    data-testid="button-review-skip"
                  >
                    Skip
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      reviewClientMutation.mutate({
                        clientId: pendingReviewClients[0].id,
                        data: {
                          mortgageValue: reviewForm.mortgageValue || undefined,
                          mortgageTerm: reviewForm.mortgageTerm || undefined,
                          interestRate: reviewForm.interestRate || undefined,
                          renewalDate: reviewForm.renewalDate || undefined,
                        },
                      });
                    }}
                    disabled={reviewClientMutation.isPending}
                    data-testid="button-review-save"
                  >
                    {reviewClientMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
