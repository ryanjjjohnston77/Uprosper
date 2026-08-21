import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Shell } from "@/components/layout/Shell";
import { FinancialJourney } from "@/components/financial-journey";
import { RewardsSection } from "@/components/rewards-section";
import { Bell, Calendar, ChevronRight, Phone, ShieldCheck, Send, X, Coffee, Home, TrendingUp, MessageSquare, Gift, Users, Copy, Share2, Sparkles, Star, PartyPopper, ExternalLink, ShoppingBag, CheckCircle2, QrCode, Tag, Building2, Link2, Check } from "lucide-react";
import { useAffiliateDeals, trackingUrlFor, iconFor } from "@/lib/affiliate-deals";

function absoluteTrackingUrl(dealId: string): string {
  if (typeof window === "undefined") return trackingUrlFor(dealId);
  return `${window.location.origin}${trackingUrlFor(dealId)}`;
}
import type { AffiliateDeal } from "@/lib/affiliate-deals";
import { DealCard } from "@/components/deal-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { formatDistance } from "date-fns";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: affiliateDeals = [] } = useAffiliateDeals();
  const queryClient = useQueryClient();
  const [contactOpen, setContactOpen] = useState(false);
  const [quickContactOpen, setQuickContactOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [coffeeQrOpen, setCoffeeQrOpen] = useState(false);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [pensionOpen, setPensionOpen] = useState(false);
  const [homeInsuranceOpen, setHomeInsuranceOpen] = useState(false);
  const [lifeInsuranceOpen, setLifeInsuranceOpen] = useState(false);
  const [fixedRateEndingOpen, setFixedRateEndingOpen] = useState(false);
  const [movingHouseOpen, setMovingHouseOpen] = useState(false);
  const [selectedHomeInsuranceNotificationId, setSelectedHomeInsuranceNotificationId] = useState<number | null>(null);
  const [selectedLifeInsuranceNotificationId, setSelectedLifeInsuranceNotificationId] = useState<number | null>(null);
  const [selectedFixedRateNotificationId, setSelectedFixedRateNotificationId] = useState<number | null>(null);
  const [selectedMovingHouseNotificationId, setSelectedMovingHouseNotificationId] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedBrokerMessage, setSelectedBrokerMessage] = useState<any>(null);
  const [chatReplyText, setChatReplyText] = useState("");
  const [bookingFlowStep, setBookingFlowStep] = useState<"invite" | "confirm" | "set-time" | "done">("invite");
  const [bookedDate, setBookedDate] = useState("");
  const [bookedTime, setBookedTime] = useState("");
  const [addReminder24h, setAddReminder24h] = useState(true);
  const bookingConfirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formData, setFormData] = useState({ subject: "", message: "" });

  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false);
  const [showDiscounts, setShowDiscounts] = useState(false);
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const [selectedDealQR, setSelectedDealQR] = useState<AffiliateDeal | null>(null);
  const pushPrompted = useRef(false);

  const { isSupported: pushSupported, isSubscribed: pushSubscribed, permission: pushPermission, subscribe: subscribePush } = usePushNotifications(!!user);

  useEffect(() => {
    if (pushSupported && !pushSubscribed && pushPermission === "default" && user && !pushPrompted.current) {
      pushPrompted.current = true;
      const timer = setTimeout(() => {
        subscribePush();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pushSupported, pushSubscribed, pushPermission, user, subscribePush]);

  const smoothScrollTo = (targetY: number, duration = 1200) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo(0, startY + diff * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const scrollToRewards = () => {
    const el = document.getElementById('rewards-offers-heading');
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      smoothScrollTo(y, 1200);
    }
  };
  const [showWelcomeCelebration, setShowWelcomeCelebration] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const welcomeBackDismissed = useRef(false);
  const [selectedRewardNotification, setSelectedRewardNotification] = useState<any>(null);
  const [activeNavTab, setActiveNavTab] = useState<"home" | "equity" | "marketplace" | "checklist" | "points">("home");
  const [redeemModal, setRedeemModal] = useState<{ open: boolean; card: any | null; error: string | null }>({ open: false, card: null, error: null });
  const [activeChecklistPill, setActiveChecklistPill] = useState<"onboarding" | "monthly">("onboarding");
  const [marketplaceCategory, setMarketplaceCategory] = useState<"homeware" | "leisure">("homeware");
  const [dismissedMeetings, setDismissedMeetings] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('dismissed_meetings');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const dismissMeeting = (enquiryId: number) => {
    setDismissedMeetings(prev => {
      const next = new Set(prev);
      next.add(enquiryId);
      localStorage.setItem('dismissed_meetings', JSON.stringify([...next]));
      return next;
    });
    toast.success("Meeting notification dismissed");
  };

  // Check if user just signed up and delay showing notifications for new users
  useEffect(() => {
    if (!user?.createdAt) return;
    
    const storageKey = `welcome_shown_${user.id}`;
    const celebrationKey = `welcome_celebration_shown_${user.id}`;
    const hasShownBefore = localStorage.getItem(storageKey);
    const hasCelebrated = localStorage.getItem(celebrationKey);
    
    if (hasShownBefore) {
      setShowWelcomeNotification(true);
      setShowDiscounts(true);
      return;
    }
    
    const createdTime = new Date(user.createdAt).getTime();
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;
    const isNewUser = (now - createdTime) < fiveMinutesMs;
    
    if (isNewUser && !hasCelebrated) {
      // Show celebration popup immediately for brand new users
      const celebrationTimer = setTimeout(() => {
        setShowWelcomeCelebration(true);
        localStorage.setItem(celebrationKey, 'true');
      }, 500);
      
      return () => {
        clearTimeout(celebrationTimer);
      };
    } else {
      setShowWelcomeNotification(true);
      setShowDiscounts(true);
      localStorage.setItem(storageKey, 'true');
    }
  }, [user?.createdAt, user?.id]);

  useEffect(() => {
    if (!user?.createdAt || !user?.id) return;

    const createdTime = new Date(user.createdAt).getTime();
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;
    const isNewUser = (now - createdTime) < fiveMinutesMs;
    if (isNewUser) return;

    const today = new Date().toISOString().split('T')[0];
    const lastWelcomeDate = localStorage.getItem(`uprosper_last_welcome_date_${user.id}`);
    if (lastWelcomeDate === today) return;

    const timer = setTimeout(() => {
      setShowWelcomeBack(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [user?.createdAt, user?.id]);

  useEffect(() => {
    if (!showWelcomeBack) return;
    const timer = setTimeout(() => {
      setShowWelcomeBack(false);
      welcomeBackDismissed.current = true;
      if (user?.id) {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`uprosper_last_welcome_date_${user.id}`, today);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [showWelcomeBack, user?.id]);

  const handleWelcomeCelebrationComplete = () => {
    setShowWelcomeCelebration(false);
    const storageKey = `welcome_shown_${user?.id}`;
    // After celebration dismisses, stagger the notifications
    setTimeout(() => {
      setShowWelcomeNotification(true);
    }, 500);
    setTimeout(() => {
      setShowDiscounts(true);
      if (user?.id) localStorage.setItem(storageKey, 'true');
    }, 2000);
  };


  // Fetch the current user's client profile
  const { data: client } = useQuery({
    queryKey: ['client-me'],
    queryFn: async () => {
      const res = await fetch('/api/client/me', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  const clientId = client?.id;

  useEffect(() => {
    if (showWelcomeBack || !welcomeBackDismissed.current || !clientId) return;
    const today = new Date().toISOString().split('T')[0];
    const welcomeBackSent = localStorage.getItem(`uprosper_wb_notif_sent_${user?.id}`);
    if (welcomeBackSent !== today) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          type: 'welcome_back',
          title: 'Welcome back! 👋',
          message: `Great to see you again${user?.name ? ', ' + user.name.split(' ')[0] : ''}! Your financial journey continues.`,
          read: false,
        }),
      }).then(() => {
        localStorage.setItem(`uprosper_wb_notif_sent_${user?.id}`, today);
        queryClient.invalidateQueries({ queryKey: ['notifications', clientId] });
      }).catch(() => {});
    }
  }, [showWelcomeBack, clientId, user?.id, user?.name, queryClient]);

  const { data: journeySteps } = useQuery({
    queryKey: ['journey', clientId],
    queryFn: () => api.journey.getSteps(clientId!),
    enabled: !!clientId,
    refetchInterval: 3000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', clientId],
    queryFn: () => api.notifications.getByClient(clientId!),
    enabled: !!clientId,
    refetchInterval: 4000,
  });


  // Fetch messages from broker
  const { data: brokerMessages = [] } = useQuery({
    queryKey: ['client-messages'],
    queryFn: async () => {
      const res = await fetch('/api/client/messages', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientId,
    refetchInterval: 4000,
  });

  // Fetch client enquiries (for meeting scheduling)
  const { data: clientEnquiries = [] } = useQuery<any[]>({
    queryKey: ['client-enquiries', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/enquiries`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientId,
    refetchInterval: 4000,
  });

  const meetingResponseMutation = useMutation({
    mutationFn: async ({ enquiryId, response }: { enquiryId: number; response: "confirmed" | "change_requested" }) => {
      const res = await apiRequest('POST', `/api/enquiries/${enquiryId}/meeting-response`, { response });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (variables.response === "confirmed") {
        toast.success("Meeting confirmed! Your broker has been notified.");
      } else {
        toast.success("Reschedule requested. Your broker will suggest a new time.");
      }
    },
    onError: () => {
      toast.error("Failed to respond. Please try again.");
    },
  });

  const { data: brokerInfo } = useQuery({
    queryKey: ['broker-info', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/client/broker-info', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  const brokerShareLink = brokerInfo?.brokerCode
    ? `${window.location.origin}/signup?broker=${brokerInfo.brokerCode}`
    : '';

  const handleShareBroker = async () => {
    if (brokerShareLink) {
      const shareData = {
        title: 'Get expert mortgage advice',
        text: `I'd recommend my mortgage broker${brokerInfo?.brokerName ? ` ${brokerInfo.brokerName}` : ''}${brokerInfo?.companyName ? ` at ${brokerInfo.companyName}` : ''}. Sign up here:`,
        url: brokerShareLink,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {}
      } else {
        try {
          await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
          toast.success("Share message copied to clipboard!");
        } catch {
          toast.error("Failed to copy share message");
        }
      }
    }
  };

  // Generate referral code if client doesn't have one yet
  const { data: generatedReferral } = useQuery({
    queryKey: ['referral-code', clientId],
    queryFn: async () => {
      const res = await fetch('/api/client/referral-code', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!clientId && !client?.referralCode,
  });

  const referralCode = client?.referralCode || generatedReferral?.referralCode;

  // Fetch referral stats
  const { data: referralStats } = useQuery({
    queryKey: ['referral-stats', clientId],
    queryFn: async () => {
      const res = await fetch('/api/client/referral-stats', { credentials: 'include' });
      if (!res.ok) return { count: 0, totalRewards: '0.00' };
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !!clientId,
  });

  const handleCopyReferralCode = async () => {
    if (referralCode) {
      try {
        await navigator.clipboard.writeText(referralCode);
        toast.success("Referral code copied!");
      } catch {
        toast.error("Failed to copy code");
      }
    }
  };

  const referralSignupLink = referralCode
    ? `${window.location.origin}/signup?ref=${referralCode}${brokerInfo?.brokerCode ? `&broker=${brokerInfo.brokerCode}` : ''}`
    : '';

  const handleShareReferralLink = async () => {
    if (!referralCode) {
      toast.error("Generating your referral link, try again in a sec");
      return;
    }
    const shareData = {
      title: 'Join Uprosper',
      text: `Join me on Uprosper — sign up with my referral code ${referralCode} and we'll both earn rewards!`,
      url: referralSignupLink,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(referralSignupLink);
      toast.success("Referral link copied to clipboard!");
    } catch {
      toast.error("Couldn't copy your referral link");
    }
  };

  const handleShareReferral = async () => {
    if (referralCode) {
      const shareData = {
        title: 'Join Uprosper',
        text: `Use my referral code ${referralCode} when you sign up${brokerInfo?.companyName ? ` with ${brokerInfo.companyName}` : ''} and we'll both get rewards!`,
        url: referralSignupLink || (window.location.origin + '/signup'),
      };
      
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          // User cancelled or share failed
        }
      } else {
        // Fallback: copy the message
        try {
          await navigator.clipboard.writeText(shareData.text);
          toast.success("Share message copied to clipboard!");
        } catch {
          toast.error("Failed to copy share message");
        }
      }
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  
  // Get the most recent unread welcome and coffee notifications (for dashboard display)
  const welcomeNotification = [...notifications]
    .filter(n => n.type === "welcome" && !n.read)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  
  const discountsNotification = [...notifications]
    .filter(n => n.type === "homeowner_discounts" && !n.read)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { clientId: number; brokerUserId: string; subject: string; content: string }) => {
      const res = await apiRequest('POST', '/api/messages', messageData);
      return res.json();
    },
    onSuccess: () => {
      toast.success("Message sent! Your broker will be in touch soon.");
      setContactOpen(false);
      setFormData({ subject: "", message: "" });
    },
    onError: () => {
      toast.error("Failed to send message. Please try again.");
    }
  });

  const markMessageReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest('POST', `/api/client/messages/${messageId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-messages'] });
    }
  });

  const saveBookedAppointmentMutation = useMutation({
    mutationFn: async (data: { meetingDate: string; meetingTime: string; addReminder: boolean }) => {
      const res = await apiRequest('POST', '/api/client/appointments', data);
      return res.json();
    },
    onSuccess: () => {
      setBookingFlowStep("done");
      toast.success(addReminder24h ? "Saved — we'll remind you 24h before." : "Appointment saved.");
      setTimeout(() => {
        setChatOpen(false);
        setChatReplyText("");
        setSelectedBrokerMessage(null);
        setBookingFlowStep("invite");
        setBookedDate("");
        setBookedTime("");
        setAddReminder24h(true);
      }, 1500);
    },
    onError: () => {
      toast.error("Couldn't save your appointment. Please try again.");
    },
  });

  const chatReplyMutation = useMutation({
    mutationFn: async ({ messageId, ...messageData }: { clientId: number; brokerUserId: string; subject: string; content: string; messageId: number }) => {
      const res = await apiRequest('POST', '/api/messages', messageData);
      return { response: await res.json(), messageId };
    },
    onSuccess: (data) => {
      // Mark the broker message as read after replying
      markMessageReadMutation.mutate(data.messageId);
      toast.success("Reply sent!");
      queryClient.invalidateQueries({ queryKey: ['client-messages'] });
      setChatReplyText("");
      setChatOpen(false);
      setSelectedBrokerMessage(null);
    },
    onError: () => {
      toast.error("Failed to send reply. Please try again.");
    }
  });

  const dismissNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('POST', `/api/notifications/${notificationId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleDismissMessage = (messageId: number) => {
    markMessageReadMutation.mutate(messageId);
    setChatOpen(false);
    setChatReplyText("");
    setSelectedBrokerMessage(null);
    setBookingFlowStep("invite");
    setBookedDate("");
    setBookedTime("");
    setAddReminder24h(true);
    if (bookingConfirmTimerRef.current) {
      clearTimeout(bookingConfirmTimerRef.current);
      bookingConfirmTimerRef.current = null;
    }
    toast.success("Message dismissed");
  };

  const { data: checklistData, refetch: refetchChecklist } = useQuery({
    queryKey: ['checklist-current'],
    queryFn: async () => {
      const res = await fetch('/api/checklist/current', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json() as Promise<{
        month: string;
        items: Array<{ id: number; title: string; points: number; sortOrder: number; completed: boolean }>;
        completedCount: number;
        totalCount: number;
        pointsThisMonth: number;
      }>;
    },
    enabled: !!clientId,
  });

  const { data: onboardingChecklistData, refetch: refetchOnboarding } = useQuery({
    queryKey: ['checklist-onboarding'],
    queryFn: async () => {
      const res = await fetch('/api/checklist/onboarding', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json() as Promise<{
        items: Array<{ id: number; title: string; points: number; sortOrder: number; completed: boolean }>;
        completedCount: number;
        totalCount: number;
        pointsEarned: number;
      }>;
    },
    enabled: !!clientId,
  });

  const { data: pointsData, refetch: refetchPoints } = useQuery({
    queryKey: ['client-points'],
    queryFn: async () => {
      const res = await fetch('/api/client/points', { credentials: 'include' });
      if (!res.ok) return { totalPoints: 0 };
      return res.json() as Promise<{ totalPoints: number }>;
    },
    enabled: !!clientId,
  });

  const completeChecklistItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest('POST', `/api/checklist/${itemId}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      refetchChecklist();
      refetchPoints();
      queryClient.invalidateQueries({ queryKey: ['client-points'] });
    },
    onError: () => {
      toast.error("Couldn't mark item complete. Please try again.");
    },
  });

  const completeOnboardingItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest('POST', `/api/checklist/${itemId}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      refetchOnboarding();
      refetchPoints();
      queryClient.invalidateQueries({ queryKey: ['client-points'] });
    },
    onError: () => {
      toast.error("Couldn't mark item complete. Please try again.");
    },
  });

  const totalPoints = pointsData?.totalPoints ?? 0;

  const redeemGiftCardMutation = useMutation({
    mutationFn: async ({ brandKey, pointsCost }: { brandKey: string; pointsCost: number }) => {
      const res = await fetch(`/api/rewards/redeem/${brandKey}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsCost }),
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.error || 'Failed'), { code: data.error });
      return data as { card: any; newBalance: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-points'] });
      setRedeemModal({ open: true, card: data.card, error: null });
    },
    onError: (err: any) => {
      if (err.code === 'OUT_OF_STOCK') {
        setRedeemModal({ open: true, card: null, error: "out_of_stock" });
      } else if (err.code === 'INSUFFICIENT_POINTS') {
        toast.error("You don't have enough points for this reward.");
      } else {
        toast.error("Redemption failed. Please try again.");
      }
    },
  });

  // Filter to get only unread broker messages for notifications
  const unreadBrokerMessages = brokerMessages.filter((m: any) => m.senderType === 'broker' && !m.read);

  const handleOpenChat = (message: any) => {
    setSelectedBrokerMessage(message);
    setChatOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Unable to find your client profile. Please try again.");
      return;
    }
    if (!client?.brokerUserId) {
      toast.error("No broker assigned to your account yet.");
      return;
    }
    sendMessageMutation.mutate({
      clientId: clientId,
      brokerUserId: client.brokerUserId,
      subject: formData.subject,
      content: formData.message,
    });
  };

  return (
    <>
      {/* Welcome Celebration Overlay */}
      <AnimatePresence>
        {showWelcomeCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleWelcomeCelebrationComplete}
            data-testid="welcome-celebration-overlay"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: -8 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(68,186,132,0.15)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* pastel header */}
              <div className="px-6 pt-6 pb-5 text-center" style={{ background: 'rgba(68,186,132,0.07)', borderBottom: '1px solid rgba(68,186,132,0.12)' }}>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mx-auto mb-3 w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: '#ffffff', border: '1px solid rgba(68,186,132,0.2)', boxShadow: '0 1px 4px rgba(68,186,132,0.1)' }}
                >
                  <span className="text-2xl">🎉</span>
                </motion.div>
                <motion.h2
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-heading font-bold text-gray-900"
                >
                  Welcome to Uprosper!
                </motion.h2>
                <motion.p
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-500 mt-1"
                >
                  Your prosperity journey {brokerInfo?.companyName ? <>with <span className="font-semibold text-primary">{brokerInfo.companyName}</span></> : 'starts here'}!
                </motion.p>
              </div>

              {/* bento info tiles */}
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-2 px-5 py-4"
                style={{ borderBottom: '1px solid rgba(68,186,132,0.1)' }}
              >
                {[
                  { emoji: '🏡', label: 'Home Journey' },
                  { emoji: '🎁', label: 'Rewards' },
                  { emoji: '📈', label: 'Wealth Growth' },
                ].map(({ emoji, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 py-2.5 rounded-2xl" style={{ background: 'rgba(68,186,132,0.06)', border: '1px solid rgba(68,186,132,0.1)' }}>
                    <span className="text-xl">{emoji}</span>
                    <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">{label}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="px-5 py-4"
              >
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:brightness-110"
                  style={{ background: '#44ba84', boxShadow: '0 2px 8px rgba(68,186,132,0.25)' }}
                  onClick={handleWelcomeCelebrationComplete}
                  data-testid="button-welcome-continue"
                >
                  Let's Go!
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcomeBack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setShowWelcomeBack(false);
              welcomeBackDismissed.current = true;
              if (user?.id) {
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem(`uprosper_last_welcome_date_${user.id}`, today);
              }
            }}
            data-testid="welcome-back-overlay"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: -8 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(68,186,132,0.15)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* pastel green header strip */}
              <div className="px-6 pt-6 pb-5 text-center" style={{ background: 'rgba(68,186,132,0.07)', borderBottom: '1px solid rgba(68,186,132,0.12)' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.15, duration: 0.5 }}
                  className="mx-auto mb-3 w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: '#ffffff', border: '1px solid rgba(68,186,132,0.2)', boxShadow: '0 1px 4px rgba(68,186,132,0.1)' }}
                >
                  <span className="text-2xl">👋</span>
                </motion.div>
                <motion.h2
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-heading font-bold text-gray-900"
                >
                  Welcome back{user?.name ? ', ' + user.name.split(' ')[0] : ''}! 👋
                </motion.h2>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-500 mt-1"
                >
                  Great to see you — your prosperity journey continues.
                </motion.p>
              </div>

              {/* progress bar */}
              <div className="px-6 py-4">
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(68,186,132,0.12)' }}>
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 4, ease: "linear" }}
                    className="h-full rounded-full"
                    style={{ background: '#44ba84' }}
                  />
                </div>
                <p className="text-xs text-center text-gray-400 mt-2">Taking you to your dashboard…</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    <Shell>
      <div className="space-y-8 pb-12">
        {/* Welcome Header */}
        <div id="welcome-header-section" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0] || client?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Your financial health score is <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Excellent</span> today.
            </p>
            <button
              onClick={() => setCompanyOpen(true)}
              className="flex items-center gap-5 mt-4 px-5 py-5 rounded-2xl cursor-pointer text-left transition-all duration-300 hover:scale-[1.01] group"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(68,186,132,0.18)',
              }}
              data-testid="button-company-info"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-105" style={{ background: '#ffffff', border: '1px solid rgba(68,186,132,0.18)' }}>
                {brokerInfo?.companyLogoUrl ? (
                  <img src={brokerInfo.companyLogoUrl} alt={brokerInfo.companyName || 'Your broker'} className="w-full h-full object-cover" data-testid="img-broker-logo" />
                ) : (
                  <Building2 className="w-7 h-7" style={{ color: '#44ba84' }} data-testid="img-broker-logo" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm text-gray-500 leading-snug" data-testid="text-broker-intro">
                  {brokerInfo?.brokerName
                    ? <>Your broker is <span className="font-semibold text-gray-700">{brokerInfo.brokerName.split(' ')[0]}</span></>
                    : 'No broker assigned yet'}
                </p>
                <p className="text-lg font-heading font-bold text-gray-900 leading-tight" data-testid="text-broker-name">
                  {brokerInfo?.companyName || 'Find a broker'}
                </p>
                <p className="text-xs" style={{ color: '#0f766e' }} data-testid="text-broker-tagline">
                  {brokerInfo?.companyName ? 'Your trusted mortgage broker' : 'Tap to get matched with one'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:translate-x-0.5" style={{ background: 'rgba(68,186,132,0.1)', border: '1px solid rgba(68,186,132,0.18)' }}>
                <ChevronRight className="h-4 w-4" style={{ color: '#44ba84' }} />
              </div>
            </button>
          </div>
          <button
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:brightness-110"
            style={{ background: '#44ba84', border: '1px solid rgba(68,186,132,0.2)' }}
            data-testid="button-contact-broker"
            onClick={() => setQuickContactOpen(true)}
          >
            <Phone className="h-4 w-4" /> Contact Broker
          </button>
        </div>

        {/* Quick Contact Broker Dialog */}
        <Dialog open={quickContactOpen} onOpenChange={setQuickContactOpen}>
          <DialogContent
            className="max-w-[calc(100vw-2rem)] sm:max-w-md p-0 overflow-hidden border-none rounded-2xl"
            style={{ background: '#ffffff' }}
          >
            <div className="px-5 sm:px-6 pt-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white font-heading font-bold text-lg"
                  style={{ background: 'linear-gradient(135deg, #44ba84 0%, #2f9b6a 100%)', border: '1px solid rgba(68,186,132,0.25)' }}
                >
                  {(brokerInfo?.brokerName || 'YB')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p: string) => p[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <DialogHeader className="text-left space-y-0.5">
                    <DialogTitle className="text-lg font-heading font-bold text-gray-900 text-left">
                      {brokerInfo?.brokerName || 'Your broker'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-left text-gray-500 flex items-center gap-1.5 flex-wrap">
                      Your Mortgage Broker
                      {brokerInfo?.companyName && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#44ba84' }} />
                          <span style={{ color: '#44ba84' }}>{brokerInfo.companyName}</span>
                        </>
                      )}
                    </DialogDescription>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                      <span className="text-xs font-medium" style={{ color: '#15803d' }}>Available today</span>
                    </div>
                  </DialogHeader>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-6 pt-4 space-y-3">
              <div
                className="rounded-xl px-4 py-3 text-sm text-gray-700 italic leading-snug"
                style={{ background: 'rgba(68,186,132,0.08)', borderLeft: '3px solid #44ba84' }}
              >
                "Whatever your mortgage question — big or small — I'm always here to help."
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01]"
                  style={{ background: 'rgba(68,186,132,0.1)', border: '1px solid rgba(68,186,132,0.25)', color: '#0f766e' }}
                  onClick={() => {
                    if (brokerInfo?.calendarUrl) {
                      window.open(brokerInfo.calendarUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      setQuickContactOpen(false);
                      setContactOpen(true);
                    }
                  }}
                  data-testid="button-quick-call-broker"
                >
                  <Calendar className="w-4 h-4" /> Book a Call
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01]"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', color: '#1d4ed8' }}
                  onClick={() => {
                    setQuickContactOpen(false);
                    setContactOpen(true);
                  }}
                  data-testid="button-quick-message-broker"
                >
                  <MessageSquare className="w-4 h-4" /> Send a Message
                </button>
              </div>

              <button
                type="button"
                className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors pt-1"
                onClick={() => setQuickContactOpen(false)}
                data-testid="button-quick-dismiss"
              >
                Dismiss
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Company Info Dialog */}
        <Dialog open={companyOpen} onOpenChange={setCompanyOpen}>
          <DialogContent
            className="max-w-[calc(100vw-2rem)] sm:max-w-md p-0 overflow-hidden border-none rounded-2xl"
            style={{ background: '#ffffff' }}
          >
            <div className="px-5 sm:px-6 pt-6">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="shrink-0"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(68,186,132,0.18)' }}>
                    {brokerInfo?.companyLogoUrl ? (
                      <img src={brokerInfo.companyLogoUrl} alt={brokerInfo.companyName || 'Your broker'} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-7 h-7" style={{ color: '#44ba84' }} />
                    )}
                  </div>
                </motion.div>
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-left min-w-0"
                >
                  <DialogHeader className="text-left space-y-0.5">
                    {brokerInfo?.companyName && (
                      <div
                        className="text-[10px] font-bold uppercase tracking-wider leading-none mb-1"
                        style={{ color: '#44ba84' }}
                        data-testid="text-broker-company-name"
                      >
                        {brokerInfo.companyName}
                      </div>
                    )}
                    <DialogTitle className="text-lg font-heading font-bold text-gray-900 text-left">
                      {brokerInfo?.brokerName || 'Your broker'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-left" style={{ color: '#0f766e' }}>
                      Your trusted mortgage broker
                    </DialogDescription>
                  </DialogHeader>
                </motion.div>
              </div>
            </div>
            <div className="px-5 sm:px-6 pb-6 pt-4 space-y-4 overflow-y-auto max-h-[70vh]">
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-600"
              >
                Helping families secure their dream homes for over 15 years. As an independent broker, we have access to 20+ lenders to find you the best rates.
              </motion.p>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: '#0f766e' }} /> Why Choose Us?
                </h4>
                <ul className="text-xs text-gray-600 space-y-1.5 pl-3">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#44ba84' }} /> Dedicated personal mortgage advisor</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#44ba84' }} /> Free initial consultation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#44ba84' }} /> Support from application to completion</li>
                </ul>
              </motion.div>

              {brokerInfo?.brokerCode && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <Link2 className="w-4 h-4" style={{ color: '#1d4ed8' }} /> Refer Your Broker
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Know someone who needs mortgage advice? Share your broker's link and help them get expert guidance.
                  </p>
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                    style={{ background: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
                    onClick={handleShareBroker}
                    data-testid="button-share-broker"
                  >
                    <Share2 className="w-4 h-4" />
                    Share with Friends
                  </button>
                </motion.div>
              )}

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                  style={{ background: '#44ba84', border: '1px solid rgba(68,186,132,0.2)' }}
                  onClick={() => {
                    setCompanyOpen(false);
                    setQuickContactOpen(true);
                  }}
                  data-testid="button-company-contact"
                >
                  <Phone className="h-4 w-4" /> Contact Broker
                </button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contact Broker Dialog */}
        <Dialog open={contactOpen} onOpenChange={setContactOpen}>
          <DialogContent
            className="max-w-[calc(100vw-2rem)] sm:max-w-md p-0 overflow-hidden border-none rounded-2xl"
            style={{ background: '#ffffff' }}
          >
            <div className="px-5 sm:px-6 pt-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(68,186,132,0.12)', border: '1px solid rgba(68,186,132,0.18)' }}
                >
                  <Phone className="w-6 h-6" style={{ color: '#44ba84' }} />
                </div>
                <div className="min-w-0">
                  <DialogHeader className="text-left space-y-0.5">
                    <DialogTitle className="text-lg font-heading font-bold text-gray-900 text-left">Contact Your Broker</DialogTitle>
                    <DialogDescription className="text-sm text-left" style={{ color: '#0f766e' }}>
                      We'll get back to you within 24 hours
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-4 sm:px-5 pb-5 pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-medium text-gray-600">Subject</Label>
                <Input
                  id="subject"
                  placeholder="What can we help you with?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="bg-white rounded-xl h-10"
                  style={{ border: '1px solid rgba(0,0,0,0.08)' }}
                  data-testid="input-contact-subject"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-medium text-gray-600">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your enquiry..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-white rounded-xl min-h-[100px] resize-none"
                  style={{ border: '1px solid rgba(0,0,0,0.08)' }}
                  data-testid="input-contact-message"
                  required
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
                  onClick={() => setContactOpen(false)}
                  data-testid="button-contact-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:brightness-110 disabled:opacity-50"
                  style={{ background: '#44ba84', border: '1px solid rgba(68,186,132,0.2)' }}
                  data-testid="button-contact-send"
                  disabled={sendMessageMutation.isPending}
                >
                  <Send className="w-4 h-4" /> {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Updates and Rewards Section */}
        <section id="notification-panel-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-bold text-gray-900" data-testid="text-updates-heading">Notification Panel</h2>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-[1.03]"
              style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.2)' }}
              onClick={() => setLocation("/client/updates")}
              data-testid="button-view-all-updates"
            >
              <Bell className="w-3.5 h-3.5" /> View All
            </button>
          </div>
          <div className="grid gap-4">
            {(() => {
              type UnifiedItem = {
                source: 'message' | 'meeting' | 'notification';
                sortDate: number;
                key: string;
                data: any;
                subType?: string;
              };
              const items: UnifiedItem[] = [];

              unreadBrokerMessages.forEach((message: any) => {
                items.push({
                  source: 'message',
                  sortDate: new Date(message.createdAt || message.sentAt || 0).getTime(),
                  key: `msg-${message.id}`,
                  data: message,
                });
              });

              clientEnquiries
                .filter((e: any) => (e.meetingStatus === "scheduled" || e.meetingStatus === "confirmed") && !dismissedMeetings.has(e.id))
                .forEach((enquiry: any) => {
                  items.push({
                    source: 'meeting',
                    sortDate: new Date(enquiry.createdAt || enquiry.meetingDate || 0).getTime(),
                    key: `meeting-${enquiry.id}-${enquiry.meetingStatus}`,
                    data: enquiry,
                    subType: enquiry.meetingStatus,
                  });
                });

              const visibleNotifTypes = [
                'home_insurance_referral', 'welcome', 'welcome_back', 'homeowner_discounts',
                'reward', 'referral_reward', 'costa_reward',
                'fixed_rate_ending', 'moving_house', 'mortgage_update',
                'home_insurance', 'life_insurance', 'wealth', 'appointment_reminder'
              ];
              notifications
                .filter((n: any) => visibleNotifTypes.includes(n.type) && !n.read)
                .forEach((notif: any) => {
                  if (notif.type === 'welcome' && !(showWelcomeNotification && welcomeNotification && notif.id === welcomeNotification.id)) return;
                  if (notif.type === 'homeowner_discounts' && !(showDiscounts && discountsNotification && notif.id === discountsNotification.id)) return;
                  if (notif.type === 'welcome_back' && notif.createdAt) {
                    const hoursAgo = (Date.now() - new Date(notif.createdAt).getTime()) / (1000 * 60 * 60);
                    if (hoursAgo >= 23) return;
                  }
                  items.push({
                    source: 'notification',
                    sortDate: new Date(notif.createdAt).getTime(),
                    key: `notif-${notif.id}`,
                    data: notif,
                    subType: notif.type,
                  });
                });

              const welcomeRank = (item: typeof items[0]) => {
                if (item.source === 'notification' && item.subType === 'welcome') return 0;
                if (item.source === 'notification' && item.subType === 'homeowner_discounts') return 1;
                return 2;
              };
              items.sort((a, b) => {
                const ra = welcomeRank(a), rb = welcomeRank(b);
                if (ra !== rb) return ra - rb;
                return b.sortDate - a.sortDate;
              });

              const displayItems = items.slice(0, 3);

              if (displayItems.length === 0) {
                return (
                  <div className="px-6 py-9 text-center text-muted-foreground border border-gray-200 rounded-lg text-sm" data-testid="updates-empty-state">
                    <Bell className="h-9 w-9 mx-auto mb-2 opacity-30" />
                    <p>Notifications will appear here</p>
                  </div>
                );
              }

              return displayItems.map((item) => {
                if (item.source === 'message') {
                  const message = item.data;
                  const isBookingLink = message.messageType === 'booking_link' && message.meetingLink;
                  const previewWords = message.content?.split(' ').slice(0, 5).join(' ') || '';
                  const preview = previewWords + (message.content?.split(' ').length > 5 ? '...' : '');

                  if (isBookingLink) {
                    return (
                      <Card
                        key={item.key}
                        className="bg-white border-l-4 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        style={{ borderLeftColor: '#a78bfa' }}
                        data-testid={`notification-booking-link-${message.id}`}
                        onClick={() => handleOpenChat(message)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2 md:mb-0">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 rounded-full text-white shrink-0" style={{ background: '#a78bfa' }}>
                              <Calendar className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-gray-900">Schedule your consultation 📅</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 hover:bg-violet-50"
                            style={{ color: '#6d28d9' }}
                            data-testid={`button-view-booking-${message.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChat(message);
                            }}
                          >
                            Book <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 pl-12 md:pl-12 pb-1">Tap to choose a time that works for you.</p>
                      </Card>
                    );
                  }

                  return (
                    <Card 
                      key={item.key}
                      className="bg-white border-l-4 border-l-green-400 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
                      data-testid={`notification-broker-message-${message.id}`}
                      onClick={() => handleOpenChat(message)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 md:mb-0">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-green-500 p-2 rounded-full text-white shrink-0">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-gray-900">New message from your broker 💬</h4>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-800 hover:text-green-900 hover:bg-green-50 shrink-0" 
                          data-testid={`button-view-message-${message.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(message);
                          }}
                        >
                          View <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 pl-12 md:pl-12 pb-1">{preview}</p>
                    </Card>
                  );
                }

                if (item.source === 'meeting') {
                  const enquiry = item.data;
                  if (item.subType === 'scheduled') {
                    return (
                      <Card 
                        key={item.key}
                        className="bg-white border-l-4 border-l-blue-500 p-4 shadow-sm"
                        data-testid={`notification-meeting-${enquiry.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900">Meeting Scheduled</h4>
                              <button
                                onClick={() => dismissMeeting(enquiry.id)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                data-testid={`button-dismiss-meeting-${enquiry.id}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Your broker has scheduled a meeting for{' '}
                              <span className="font-semibold">
                                {enquiry.meetingDate ? new Date(enquiry.meetingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                              </span>{' '}
                              at <span className="font-semibold">{enquiry.meetingTime}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Regarding: {enquiry.productType}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Button 
                                size="sm" 
                                className="bg-green-800 hover:bg-green-900 text-white"
                                data-testid={`button-confirm-meeting-${enquiry.id}`}
                                disabled={meetingResponseMutation.isPending}
                                onClick={() => meetingResponseMutation.mutate({ enquiryId: enquiry.id, response: "confirmed" })}
                              >
                                Confirm Meeting
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                data-testid={`button-reschedule-meeting-${enquiry.id}`}
                                disabled={meetingResponseMutation.isPending}
                                onClick={() => meetingResponseMutation.mutate({ enquiryId: enquiry.id, response: "change_requested" })}
                              >
                                Request Different Time
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                  return (
                    <Card 
                      key={item.key}
                      className="bg-white border-l-4 border-l-green-500 p-4 shadow-sm"
                      data-testid={`notification-meeting-confirmed-${enquiry.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-900">Meeting Confirmed</h4>
                            <button
                              onClick={() => dismissMeeting(enquiry.id)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                              data-testid={`button-dismiss-meeting-confirmed-${enquiry.id}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Your meeting is confirmed for{' '}
                            <span className="font-semibold">
                              {enquiry.meetingDate ? new Date(enquiry.meetingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                            </span>{' '}
                            at <span className="font-semibold">{enquiry.meetingTime}</span>
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Regarding: {enquiry.productType}
                          </p>
                          
                        </div>
                      </div>
                    </Card>
                  );
                }

                const notif = item.data;

                if (notif.type === 'home_insurance_referral') {
                  return (
                    <Card 
                      key={item.key}
                      className="bg-white border-l-4 border-l-green-500 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
                      data-testid={`notification-home-insurance-${notif.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 md:mb-0">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0">
                            <Home className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-gray-900">{notif.title}</h4>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0" 
                          data-testid={`button-home-insurance-details-${notif.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHomeInsuranceNotificationId(notif.id);
                            setHomeInsuranceOpen(true);
                          }}
                        >
                          Learn More <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 pl-12 md:pl-12 pb-1">{notif.message}</p>
                    </Card>
                  );
                }

                if (notif.type === 'welcome') {
                  return (
                    <Card 
                      key={item.key}
                      className="p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-0" 
                      style={{ background: 'rgba(68,186,132,0.08)', borderLeft: '4px solid #44ba84' }}
                      data-testid="notification-welcome"
                      onClick={() => setWelcomePopupOpen(true)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 md:mb-0">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 rounded-full shrink-0" style={{ background: 'rgba(68,186,132,0.15)', color: '#44ba84' }}>
                            <Bell className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-gray-900">{notif.title}</h4>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0" 
                          data-testid="button-dismiss-welcome"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotificationMutation.mutate(notif.id);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 pl-12 md:pl-12">{notif.message}</p>
                      <div className="pl-12 pt-2">
                        <Button
                          size="sm"
                          className="text-white font-semibold text-xs px-3 h-7 rounded-full"
                          style={{ background: '#44ba84' }}
                          data-testid="button-welcome-tour"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWelcomePopupOpen(true);
                          }}
                        >
                          Take a Tour
                        </Button>
                      </div>
                    </Card>
                  );
                }

                if (notif.type === 'homeowner_discounts') {
                  return (
                    <Card 
                      key={item.key}
                      className="border-l-4 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
                      style={{ background: 'rgba(59,130,246,0.04)', borderLeftColor: '#3B82F6' }}
                      data-testid="notification-homeowner-discounts"
                      onClick={() => setLocation("/marketplace")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-full shrink-0" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                          <Tag className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-base truncate">{notif.title}</h4>
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                          <Button
                            size="sm"
                            className="text-white font-semibold text-xs px-3 h-7 rounded-full mt-2"
                            style={{ background: '#3B82F6' }}
                            data-testid="button-discounts-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation("/marketplace");
                            }}
                          >
                            View Marketplace
                          </Button>
                        </div>
                        <Button 
                          variant="ghost"
                          size="sm" 
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0 h-8 w-8 p-0 rounded-full"
                          data-testid="button-discounts-dismiss"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotificationMutation.mutate(notif.id);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                }

                if (notif.type === 'costa_reward') {
                  return (
                    <Card 
                      key={item.key}
                      className="border-l-4 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      style={{ background: 'rgba(109,8,57,0.04)', borderLeftColor: '#6d0839' }}
                      data-testid={`notification-costa-${notif.id}`}
                      onClick={() => scrollToRewards()}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-full shrink-0" style={{ background: 'rgba(109,8,57,0.12)', color: '#6d0839' }}>
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-base truncate">{notif.title}</h4>
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                          <Button
                            size="sm"
                            className="text-white font-semibold text-xs px-3 h-7 rounded-full mt-2"
                            style={{ background: '#6d0839' }}
                            data-testid={`button-costa-claim-${notif.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollToRewards();
                            }}
                          >
                            View Reward
                          </Button>
                        </div>
                        <Button 
                          variant="ghost"
                          size="sm" 
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0 h-8 w-8 p-0 rounded-full"
                          data-testid={`button-dismiss-costa-${notif.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotificationMutation.mutate(notif.id);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                }

                if (notif.type === 'reward' || notif.type === 'referral_reward') {
                  return (
                    <Card 
                      key={item.key}
                      className="border-l-4 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      style={{ background: '#FFF5EC', borderLeftColor: '#F0A868' }}
                      data-testid={`notification-reward-${notif.id}`}
                      onClick={() => scrollToRewards()}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-full shrink-0" style={{ background: '#FFEAD6', color: '#D4853A' }}>
                          <Gift className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-base truncate">{notif.title}</h4>
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                          <Button
                            size="sm"
                            className="text-white font-semibold text-xs px-3 h-7 rounded-full mt-2"
                            style={{ background: '#E8734A' }}
                            data-testid={`button-claim-notif-${notif.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollToRewards();
                            }}
                          >
                            Claim Now
                          </Button>
                        </div>
                        <Button 
                          variant="ghost"
                          size="sm" 
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0 h-8 w-8 p-0 rounded-full"
                          data-testid={`button-dismiss-reward-${notif.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotificationMutation.mutate(notif.id);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                }

                const colorConfig: Record<string, { border: string; bg: string; text: string; icon: string }> = {
                  fixed_rate_ending: { border: 'border-l-[#F0A868]', bg: 'bg-[#FFF5EC]', text: 'text-[#D4853A]', icon: 'text-[#D4853A]' },
                  moving_house: { border: 'border-l-[#F0A868]', bg: 'bg-[#FFF5EC]', text: 'text-[#D4853A]', icon: 'text-[#D4853A]' },
                  mortgage_update: { border: 'border-l-[#F0A868]', bg: 'bg-[#FFF5EC]', text: 'text-[#D4853A]', icon: 'text-[#D4853A]' },
                  home_insurance: { border: 'border-l-emerald-400', bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'text-emerald-600' },
                  life_insurance: { border: 'border-l-emerald-400', bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'text-emerald-600' },
                  wealth: { border: 'border-l-purple-500', bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-600' },
                  appointment_reminder: { border: 'border-l-blue-500', bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-600' }
                };
                const colors = colorConfig[notif.type] || colorConfig.fixed_rate_ending;
                const IconComponent = notif.type === 'appointment_reminder' ? Calendar :
                                      (notif.type === 'fixed_rate_ending' || notif.type === 'moving_house' || notif.type === 'mortgage_update') ? Bell :
                                      (notif.type === 'home_insurance' || notif.type === 'life_insurance') ? ShieldCheck : TrendingUp;
                const isClickable = notif.type === 'home_insurance' || notif.type === 'life_insurance' || notif.type === 'fixed_rate_ending' || notif.type === 'moving_house';
                return (
                  <Card 
                    key={item.key}
                    className={`bg-white border-l-4 ${colors.border} p-4 shadow-sm ${isClickable ? 'cursor-pointer' : ''} hover:shadow-md transition-shadow`}
                    data-testid={`notification-offer-${notif.id}`}
                    onClick={() => {
                      if (notif.type === 'home_insurance') {
                        setSelectedHomeInsuranceNotificationId(notif.id);
                        setHomeInsuranceOpen(true);
                      } else if (notif.type === 'life_insurance') {
                        setSelectedLifeInsuranceNotificationId(notif.id);
                        setLifeInsuranceOpen(true);
                      } else if (notif.type === 'fixed_rate_ending') {
                        setSelectedFixedRateNotificationId(notif.id);
                        setFixedRateEndingOpen(true);
                      } else if (notif.type === 'moving_house') {
                        setSelectedMovingHouseNotificationId(notif.id);
                        setMovingHouseOpen(true);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2 md:mb-0">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`${colors.bg} p-2 rounded-full ${colors.icon} shrink-0`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900">{notif.title}</h4>
                      </div>
                      {isClickable ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`${colors.text} hover:${colors.text} ${(notif.type === 'fixed_rate_ending' || notif.type === 'moving_house') ? 'hover:bg-[#FFF5EC]' : 'hover:bg-emerald-50'} shrink-0`}
                          data-testid={`button-view-offer-${notif.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notif.type === 'home_insurance') {
                              setSelectedHomeInsuranceNotificationId(notif.id);
                              setHomeInsuranceOpen(true);
                            } else if (notif.type === 'life_insurance') {
                              setSelectedLifeInsuranceNotificationId(notif.id);
                              setLifeInsuranceOpen(true);
                            } else if (notif.type === 'fixed_rate_ending') {
                              setSelectedFixedRateNotificationId(notif.id);
                              setFixedRateEndingOpen(true);
                            } else if (notif.type === 'moving_house') {
                              setSelectedMovingHouseNotificationId(notif.id);
                              setMovingHouseOpen(true);
                            }
                          }}
                        >
                          Learn More <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0" 
                          data-testid={`button-dismiss-offer-${notif.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotificationMutation.mutate(notif.id);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {(() => {
                      const meetingLinkMatch = notif.type === 'appointment_reminder' ? notif.message.match(/\[MEETING_LINK:(.*?)\]/) : null;
                      const displayMessage = notif.message.replace(/\n?\[MEETING_LINK:.*?\]/, '');
                      return (
                        <div className="pl-12 md:pl-12 pb-1">
                          <p className="text-sm text-gray-600">{displayMessage}</p>
                          {meetingLinkMatch && meetingLinkMatch[1] && (
                            <a
                              href={meetingLinkMatch[1]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 underline mt-1 inline-block"
                              data-testid={`link-meeting-join-${notif.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Join waiting room
                            </a>
                          )}
                        </div>
                      );
                    })()}
                  </Card>
                );
              });
            })()}
          </div>
        </section>

        {/* Tabs + active tab content wrapped in one bento */}
        <div
          className="rounded-2xl p-5 sm:p-6 space-y-4"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(68,186,132,0.18)',
          }}
          data-testid="dashboard-tabs-bento"
        >
        {(() => {
          const NAV_TABS = [
            { id: "home" as const,        label: "Home",        Icon: Home,         color: "#2f9b6a", colorActive: "#2f9b6a", soft: "transparent", softActive: "rgba(214,243,230,0.55)", border: "transparent", borderActive: "rgba(68,186,132,0.35)"  },
            { id: "equity" as const,      label: "Equity",      Icon: TrendingUp,   color: "#0891b2", colorActive: "#0891b2", soft: "transparent", softActive: "rgba(207,250,254,0.55)", border: "transparent", borderActive: "rgba(34,211,238,0.35)"  },
            { id: "marketplace" as const, label: "Marketplace", Icon: ShoppingBag,  color: "#f4a261", colorActive: "#f4a261", soft: "transparent", softActive: "rgba(253,230,211,0.55)", border: "transparent", borderActive: "rgba(244,162,97,0.35)"  },
            { id: "checklist" as const,   label: "Checklist",   Icon: CheckCircle2, color: "#0d9488", colorActive: "#0d9488", soft: "transparent", softActive: "rgba(204,251,241,0.55)", border: "transparent", borderActive: "rgba(20,184,166,0.35)"  },
            { id: "points" as const,      label: "Rewards",     Icon: Gift,         color: "#be3144", colorActive: "#be3144", soft: "transparent", softActive: "rgba(254,215,219,0.55)", border: "transparent", borderActive: "rgba(244,114,128,0.35)"  },
          ];
          return (
            <nav
              className="flex justify-between sm:justify-start gap-2 sm:gap-2 rounded-2xl p-1.5"
              role="tablist"
              aria-label="Dashboard sections"
              data-testid="nav-dashboard-tabs"
              style={{ background: 'rgba(68,186,132,0.04)', border: '1px solid rgba(68,186,132,0.13)' }}
            >
              {NAV_TABS.map(({ id, label, Icon, color, colorActive, soft, softActive, border, borderActive }) => {
                const active = activeNavTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveNavTab(id)}
                    className="flex-1 py-2 sm:py-1.5 flex flex-col items-center justify-center gap-1 rounded-2xl px-1 transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: active ? softActive : soft,
                      border: `1px solid ${active ? borderActive : 'transparent'}`,
                      boxShadow: 'none',
                    }}
                    data-testid={`nav-tab-${id}`}
                  >
                    <Icon style={{ color: active ? colorActive : color }} className="shrink-0 w-[26px] h-[26px] sm:w-5 sm:h-5" />
                    <span
                      className="text-[11px] sm:text-xs font-semibold leading-none truncate"
                      style={{ color: active ? colorActive : color }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </nav>
          );
        })()}

        {/* Home tab content — mortgage metrics */}
        {activeNavTab === "home" && (
        <div data-testid="home-dashboard-section">
          <div className="flex items-end justify-between mb-3 px-1 gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-gray-900 truncate" data-testid="text-home-dashboard-heading">
                Home Dashboard
              </h3>
              <p className="text-sm text-gray-500/80" data-testid="text-home-dashboard-subheading">
                Your mortgage at a glance
              </p>
            </div>
            <button
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-[1.03]"
              style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.2)' }}
              onClick={() => setLocation("/client/home")}
              data-testid="button-home-dashboard-see-more"
            >
              See more <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {(() => {
            const principal = client?.mortgageValue ? parseFloat(client.mortgageValue) : 0;
            const ratePct = client?.interestRate ? parseFloat(client.interestRate) : 0;
            const termYears = client?.mortgageTerm ?? 0;
            const storedMonthly = client?.monthlyPayment ? parseFloat(client.monthlyPayment) : 0;
            let monthly = storedMonthly;
            if (monthly <= 0 && principal > 0 && ratePct > 0 && termYears > 0) {
              const r = ratePct / 100 / 12;
              const n = termYears * 12;
              monthly = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            }
            let yearsLeft: number | null = null;
            if (client?.renewalDate) {
              const d = new Date(client.renewalDate);
              if (!isNaN(d.getTime())) {
                yearsLeft = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365.25);
              }
            }
            const placeholder = "—";
            const valueText = principal > 0
              ? `£${principal.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
              : placeholder;
            const rateText = ratePct > 0 ? `${ratePct}%` : placeholder;
            const monthlyText = monthly > 0
              ? `£${monthly.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
              : placeholder;
            const hasRenewal = yearsLeft !== null && yearsLeft > 0;
            const termPrimaryText = termYears > 0
              ? (hasRenewal
                  ? `${Math.max(0, Math.round(yearsLeft!))} yrs`
                  : `${termYears} yrs`)
              : placeholder;
            const termPrimaryLabel = hasRenewal ? "To Renewal" : "Term Remaining";
            const termSublineText = termYears > 0 && hasRenewal
              ? `of ${termYears} yr term`
              : null;
            return (
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(209,250,229,0.4)', border: '0.75px solid rgba(16,185,129,0.5)' }}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: '#047857' }}>Mortgage Value</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-mortgage-value">{valueText}</p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(219,234,254,0.4)', border: '0.75px solid rgba(59,130,246,0.5)' }}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: '#1d4ed8' }}>Interest Rate</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-mortgage-rate">{rateText}</p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(254,243,199,0.4)', border: '0.75px solid rgba(245,158,11,0.5)' }}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: '#b45309' }}>Monthly Payment</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-mortgage-monthly">{monthlyText}</p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(237,233,254,0.4)', border: '0.75px solid rgba(139,92,246,0.5)' }}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: '#6d28d9' }}>{termPrimaryLabel}</p>
                  <p className="text-2xl font-bold text-gray-900 leading-tight" data-testid="text-mortgage-term-remaining">{termPrimaryText}</p>
                  {termSublineText && (
                    <p className="text-[10px] text-gray-500 mt-0.5" data-testid="text-mortgage-term-total">{termSublineText}</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Renewal countdown */}
          {(() => {
            const ratePct = client?.interestRate ? parseFloat(client.interestRate) : 0;
            let monthsRemaining: number | null = null;
            let renewalLabel = "—";
            if (client?.renewalDate) {
              const d = new Date(client.renewalDate);
              if (!isNaN(d.getTime())) {
                const ms = d.getTime() - Date.now();
                monthsRemaining = Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24 * 30.4375)));
                renewalLabel = d.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
              }
            }
            const fixedTermMonths = 60;
            const elapsed = monthsRemaining !== null ? Math.max(0, fixedTermMonths - monthsRemaining) : 0;
            const progressPct = monthsRemaining !== null
              ? Math.min(100, Math.max(0, (elapsed / fixedTermMonths) * 100))
              : 0;
            const monthsText = monthsRemaining !== null ? `${monthsRemaining}` : "—";
            const rateText = ratePct > 0 ? `${ratePct}%` : "—";
            return (
              <div
                className="mt-4 rounded-2xl p-5"
                style={{
                  background: 'rgba(214,243,230,0.45)',
                  border: '1px solid rgba(68,186,132,0.22)',
                }}
                data-testid="renewal-countdown"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#0f766e' }}>
                    Renewal Countdown
                  </p>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-medium text-gray-500/80 leading-none mb-1">Current Rate</p>
                    <p className="text-lg font-bold" style={{ color: '#0f766e' }} data-testid="text-renewal-current-rate">{rateText}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-gray-900 font-heading" data-testid="text-renewal-months">{monthsText}</p>
                    <p className="text-base text-gray-500">months</p>
                  </div>
                  <p className="text-sm text-gray-500/80 mt-1" data-testid="text-renewal-date">Renews {renewalLabel}</p>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden mb-4"
                  style={{ background: 'rgba(68,186,132,0.15)' }}
                  data-testid="progress-renewal"
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #44ba84 0%, #2f9b6a 100%)',
                    }}
                  />
                </div>
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(90deg, #44ba84 0%, #2f9b6a 100%)',
                    boxShadow: '0 4px 14px rgba(68,186,132,0.28)',
                  }}
                  onClick={() => setContactOpen(true)}
                  data-testid="button-renewal-talk-broker"
                >
                  Talk to your broker about rates <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })()}
        </div>
        )}

        {/* Equity tab content */}
        {activeNavTab === "equity" && (
          <div data-testid="equity-tab-section">
            <div className="flex items-end justify-between mb-3 px-1 gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-gray-900 truncate" data-testid="text-equity-dashboard-heading">
                  Equity Dashboard
                </h3>
                <p className="text-sm text-gray-500/80" data-testid="text-equity-dashboard-subheading">
                  Track your home's growing value
                </p>
              </div>
            </div>
            {(() => {
              const principal = client?.mortgageValue ? parseFloat(client.mortgageValue) : 0;
              const ratePct = client?.interestRate ? parseFloat(client.interestRate) : 4.25;
              const termYears = client?.mortgageTerm ?? 25;
              const storedMonthly = client?.monthlyPayment ? parseFloat(client.monthlyPayment) : 0;

              let monthly = storedMonthly;
              if (monthly <= 0 && principal > 0 && ratePct > 0 && termYears > 0) {
                const r = ratePct / 100 / 12;
                const n = termYears * 12;
                monthly = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
              }

              const startDate = user?.createdAt ? new Date(user.createdAt) : new Date();
              const now = new Date();
              const monthsElapsed = Math.max(0,
                (now.getFullYear() - startDate.getFullYear()) * 12 +
                (now.getMonth() - startDate.getMonth())
              );

              const monthlyRate = ratePct / 100 / 12;
              let capitalRepaid = 0;
              let runningBal = principal;
              for (let m = 0; m < monthsElapsed; m++) {
                const interest = monthlyRate > 0 ? runningBal * monthlyRate : 0;
                const cap = Math.max(0, Math.min(monthly - interest, runningBal));
                if (cap <= 0) break;
                runningBal -= cap;
                capitalRepaid += cap;
              }
              capitalRepaid = Math.round(capitalRepaid);
              const remainingBalance = Math.max(0, Math.round(principal - capitalRepaid));

              // Est. property value: mortgage value grown at 3%/yr compounded monthly
              const propertyValueNow = principal > 0
                ? Math.round(principal * Math.pow(1 + 0.03 / 12, monthsElapsed))
                : 0;
              const propertyGain = Math.max(0, propertyValueNow - principal);

              const equity = capitalRepaid + propertyGain;
              const equityPct = propertyValueNow > 0 ? Math.round((equity / propertyValueNow) * 100) : 0;
              const balancePct = Math.max(0, 100 - equityPct);
              const gainPct = principal > 0 ? ((propertyGain / principal) * 100).toFixed(1) : "0";

              // Total cash paid out (principal + interest) over months elapsed
              const totalPaid = Math.round(monthly * monthsElapsed);

              const repaidFraction = principal > 0 ? Math.min(1, capitalRepaid / principal) : 0;
              const repaidPct = capitalRepaid > 0 && monthsElapsed >= 1
                ? Math.max(1, Math.round(repaidFraction * 100))
                : Math.round(repaidFraction * 100);
              const fmt = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

              const milestones = principal > 0
                ? [5, 20, 40, 60, 80, 100].map((pct, i) => ({
                    value: Math.round(principal * pct / 100),
                    label: `${pct}% · ${fmt(Math.round(principal * pct / 100))}`,
                    points: [100, 200, 300, 400, 500, 500][i],
                  }))
                : [];

              const R = 56;
              const circ = 2 * Math.PI * R;
              const targetOffset = circ * (1 - repaidFraction);

              return (
                <div className="space-y-4">
                  {/* Repaid / Remaining donut — same spiral animation as home dashboard */}
                  <div
                    className="rounded-2xl p-5 flex flex-col items-center"
                    style={{ background: 'rgba(209,250,229,0.40)', border: '1px solid rgba(68,186,132,0.22)' }}
                    data-testid="tile-repaid-donut"
                  >
                    <div className="relative w-52 h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Paid", value: Math.max(capitalRepaid, 0) },
                              { name: "Remaining", value: Math.max(remainingBalance, 1) },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius="68%"
                            outerRadius="98%"
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={capitalRepaid > 0 && remainingBalance > 0 ? 1.5 : 0}
                            dataKey="value"
                            stroke="none"
                            isAnimationActive
                            animationDuration={900}
                            animationEasing="ease-out"
                          >
                            <Cell fill="#44ba84" />
                            <Cell fill="#d6f3e6" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-3xl font-bold tabular-nums" style={{ color: '#0f766e' }} data-testid="text-repaid-pct">{repaidPct}%</p>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">REPAID</p>
                        <p className="text-[11px] text-gray-600 mt-1 tabular-nums">{fmt(capitalRepaid)} of {fmt(principal)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-5 mt-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#44ba84' }} />
                        <span className="text-gray-600">Paid <span className="font-semibold text-gray-900">{fmt(capitalRepaid)}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#d6f3e6', border: '1px solid rgba(68,186,132,0.3)' }} />
                        <span className="text-gray-600">Remaining <span className="font-semibold text-gray-900">{fmt(remainingBalance)}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Total Equity hero tile */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: 'rgba(68,186,132,0.10)', border: '1px solid rgba(68,186,132,0.22)' }}
                    data-testid="tile-total-equity"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#0f766e' }}>
                      Total Equity (Est.)
                    </p>
                    <p className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mt-1" data-testid="text-total-equity-value">
                      {fmt(equity)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span style={{ color: '#15803d' }}>↑ +{fmt(propertyGain)}</span> property appreciation · {gainPct}% in {monthsElapsed}mo
                    </p>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                        <span>Mortgage Balance</span>
                        <span>Your Equity</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full overflow-hidden flex" style={{ background: 'rgba(0,0,0,0.06)' }}>
                        <div style={{ width: `${balancePct}%`, background: '#3b82f6' }} />
                        <div style={{ width: `${equityPct}%`, background: '#44ba84' }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1.5">
                        <span>{fmt(remainingBalance)} ({balancePct}%)</span>
                        <span>{equityPct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Equity Milestones at 20% steps of mortgage value */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: 'rgba(204,251,241,0.45)', border: '1px solid rgba(20,184,166,0.18)' }}
                    data-testid="tile-equity-milestones"
                  >
                    <h4 className="font-heading font-bold text-gray-900 mb-3">Equity Milestones</h4>
                    {milestones.length === 0 ? (
                      <p className="text-sm text-gray-400">No mortgage data available yet.</p>
                    ) : (
                      <ul className="divide-y divide-teal-900/5">
                        {milestones.map((m) => {
                          const reached = equity >= m.value;
                          return (
                            <li
                              key={m.value}
                              className="flex items-center justify-between py-2.5"
                              data-testid={`row-equity-milestone-${m.value}`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                  style={{
                                    background: reached ? '#44ba84' : 'rgba(0,0,0,0.06)',
                                    border: `1px solid ${reached ? 'rgba(68,186,132,0.4)' : 'rgba(0,0,0,0.08)'}`,
                                  }}
                                >
                                  {reached ? (
                                    <Check className="w-4 h-4 text-white" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                                  )}
                                </div>
                                <span className={`text-sm font-medium ${reached ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {m.label}
                                </span>
                              </div>
                              <span className="text-xs font-semibold" style={{ color: reached ? '#0f766e' : '#9ca3af' }}>
                                +{m.points}pts
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Bottom 4 stat tiles */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Mortgage Value', value: fmt(principal), bg: 'rgba(219,234,254,0.5)', border: 'rgba(59,130,246,0.18)', text: '#1d4ed8', tid: 'tile-mortgage-value' },
                      { label: 'Est. Value Now', value: fmt(propertyValueNow), bg: 'rgba(209,250,229,0.55)', border: 'rgba(16,185,129,0.2)', text: '#047857', tid: 'tile-est-value-now' },
                      { label: 'Mortgage Paid', value: fmt(totalPaid), bg: 'rgba(237,233,254,0.5)', border: 'rgba(139,92,246,0.18)', text: '#6d28d9', tid: 'tile-mortgage-paid' },
                      { label: 'Interest Rate', value: `${ratePct.toFixed(2)}%`, bg: 'rgba(254,243,199,0.5)', border: 'rgba(245,158,11,0.2)', text: '#b45309', tid: 'tile-interest-rate' },
                    ].map((t) => (
                      <div
                        key={t.label}
                        className="rounded-2xl p-4"
                        style={{ background: t.bg, border: `1px solid ${t.border}` }}
                        data-testid={t.tid}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: t.text }}>
                          {t.label}
                        </p>
                        <p className="font-heading font-bold text-xl text-gray-900 mt-1">{t.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Checklist tab content */}
        {activeNavTab === "checklist" && (
          <div data-testid="checklist-tab-section">
            <div className="flex items-end justify-between mb-3 px-1 gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-gray-900 truncate" data-testid="text-checklist-heading">
                  {activeChecklistPill === "onboarding" ? "New Homeowner Checklist" : "Home Checklist"}
                </h3>
                <p className="text-sm text-gray-500/80">
                  {activeChecklistPill === "onboarding" ? "Essential steps when you first move in" : "Earn points keeping your home in shape"}
                </p>
              </div>
            </div>

            {/* Pill tabs */}
            <div className="flex gap-2 mb-4" role="tablist" aria-label="Checklist type">
              {([
                { key: "onboarding" as const, label: "New Homeowner" },
                { key: "monthly" as const, label: new Date().toLocaleString("en-GB", { month: "long" }) + " Checklist" },
              ]).map(({ key, label }) => {
                const active = activeChecklistPill === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveChecklistPill(key)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-[1.03]"
                    style={{
                      color: active ? '#ffffff' : '#0f766e',
                      background: active ? '#0d9488' : 'rgba(20,184,166,0.08)',
                      border: `1px solid ${active ? 'rgba(13,148,136,0.4)' : 'rgba(20,184,166,0.2)'}`,
                    }}
                    data-testid={`pill-checklist-${key}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Onboarding checklist */}
            {activeChecklistPill === "onboarding" && (
              onboardingChecklistData ? (
                <div className="space-y-3">
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: 'rgba(204,251,241,0.45)', border: '1px solid rgba(20,184,166,0.20)' }}
                    data-testid="tile-onboarding-progress"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#0d9488' }}>
                          NEW HOMEOWNER CHECKLIST
                        </p>
                        <p className="font-heading font-bold text-3xl text-gray-900 mt-1">
                          {onboardingChecklistData.completedCount}/{onboardingChecklistData.totalCount} Done
                        </p>
                        {onboardingChecklistData.completedCount < onboardingChecklistData.totalCount ? (
                          <p className="text-xs text-gray-500 mt-1">
                            Complete all tasks to earn <span className="font-semibold" style={{ color: '#0d9488' }}>
                              {onboardingChecklistData.items.reduce((s, i) => s + i.points, 0)} pts
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs font-semibold mt-1" style={{ color: '#0d9488' }}>
                            🎉 All done — welcome home!
                          </p>
                        )}
                      </div>
                      <div className="relative w-14 h-14 shrink-0">
                        <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(20,184,166,0.15)" strokeWidth="5" />
                          <circle
                            cx="28" cy="28" r="22" fill="none"
                            stroke="#0d9488" strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 22}`}
                            strokeDashoffset={`${2 * Math.PI * 22 * (1 - (onboardingChecklistData.completedCount / Math.max(onboardingChecklistData.totalCount, 1)))}`}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: '#0d9488' }}>
                          {Math.round((onboardingChecklistData.completedCount / Math.max(onboardingChecklistData.totalCount, 1)) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#ffffff', border: '1px solid rgba(20,184,166,0.14)' }}
                  >
                    {onboardingChecklistData.items.map((item, idx) => {
                      const isLast = idx === onboardingChecklistData.items.length - 1;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={item.completed || completeOnboardingItemMutation.isPending}
                          onClick={() => !item.completed && completeOnboardingItemMutation.mutate(item.id)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-200 hover:bg-teal-50/40 disabled:cursor-default text-left"
                          style={{ borderBottom: isLast ? 'none' : '1px solid rgba(20,184,166,0.10)' }}
                          data-testid={`button-onboarding-item-${item.id}`}
                        >
                          <div
                            className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center transition-all duration-300"
                            style={{
                              background: item.completed ? '#0d9488' : 'rgba(20,184,166,0.08)',
                              border: item.completed ? '2px solid #0d9488' : '2px solid rgba(20,184,166,0.30)',
                            }}
                          >
                            {item.completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <span
                            className="flex-1 text-sm font-medium leading-snug"
                            style={{ color: item.completed ? '#9ca3af' : '#1f2937', textDecoration: item.completed ? 'line-through' : 'none' }}
                          >
                            {item.title}
                          </span>
                          <span
                            className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ color: item.completed ? '#9ca3af' : '#0d9488', background: item.completed ? 'rgba(156,163,175,0.10)' : 'rgba(20,184,166,0.10)' }}
                          >
                            +{item.points}pts
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className="rounded-2xl p-5 text-center"
                    style={{ background: 'rgba(204,251,241,0.30)', border: '1px solid rgba(20,184,166,0.16)' }}
                    data-testid="tile-onboarding-points-earned"
                  >
                    <p className="text-xs text-gray-500 font-medium">Points earned from setup</p>
                    <p className="font-heading font-bold text-2xl mt-1" style={{ color: '#0d9488' }}>
                      +{onboardingChecklistData.pointsEarned} pts
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(204,251,241,0.30)', border: '1px solid rgba(20,184,166,0.15)' }}>
                  <p className="text-sm text-gray-500">Loading your checklist…</p>
                </div>
              )
            )}

            {/* Monthly checklist */}
            {activeChecklistPill === "monthly" && (
              checklistData ? (
                <div className="space-y-3">
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: 'rgba(204,251,241,0.45)', border: '1px solid rgba(20,184,166,0.20)' }}
                    data-testid="tile-checklist-progress"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#0d9488' }}>
                          {new Date().toLocaleString("en-GB", { month: "long" }).toUpperCase()} CHECKLIST
                        </p>
                        <p className="font-heading font-bold text-3xl text-gray-900 mt-1">
                          {checklistData.completedCount}/{checklistData.totalCount} Done
                        </p>
                        {checklistData.completedCount < checklistData.totalCount ? (
                          <p className="text-xs text-gray-500 mt-1">
                            Complete all tasks to earn the full <span className="font-semibold" style={{ color: '#0d9488' }}>
                              {checklistData.items.reduce((s, i) => s + i.points, 0)} pts
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs font-semibold mt-1" style={{ color: '#0d9488' }}>
                            🎉 All done — great work this month!
                          </p>
                        )}
                      </div>
                      <div className="relative w-14 h-14 shrink-0">
                        <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(20,184,166,0.15)" strokeWidth="5" />
                          <circle
                            cx="28" cy="28" r="22" fill="none"
                            stroke="#0d9488" strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 22}`}
                            strokeDashoffset={`${2 * Math.PI * 22 * (1 - (checklistData.completedCount / Math.max(checklistData.totalCount, 1)))}`}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: '#0d9488' }}>
                          {Math.round((checklistData.completedCount / Math.max(checklistData.totalCount, 1)) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#ffffff', border: '1px solid rgba(20,184,166,0.14)' }}
                  >
                    {checklistData.items.map((item, idx) => {
                      const isLast = idx === checklistData.items.length - 1;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={item.completed || completeChecklistItemMutation.isPending}
                          onClick={() => !item.completed && completeChecklistItemMutation.mutate(item.id)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-200 hover:bg-teal-50/40 disabled:cursor-default text-left"
                          style={{ borderBottom: isLast ? 'none' : '1px solid rgba(20,184,166,0.10)' }}
                          data-testid={`button-checklist-item-${item.id}`}
                        >
                          <div
                            className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center transition-all duration-300"
                            style={{
                              background: item.completed ? '#0d9488' : 'rgba(20,184,166,0.08)',
                              border: item.completed ? '2px solid #0d9488' : '2px solid rgba(20,184,166,0.30)',
                            }}
                          >
                            {item.completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <span
                            className="flex-1 text-sm font-medium leading-snug"
                            style={{ color: item.completed ? '#9ca3af' : '#1f2937', textDecoration: item.completed ? 'line-through' : 'none' }}
                          >
                            {item.title}
                          </span>
                          <span
                            className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ color: item.completed ? '#9ca3af' : '#0d9488', background: item.completed ? 'rgba(156,163,175,0.10)' : 'rgba(20,184,166,0.10)' }}
                          >
                            +{item.points}pts
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className="rounded-2xl p-5 text-center"
                    style={{ background: 'rgba(204,251,241,0.30)', border: '1px solid rgba(20,184,166,0.16)' }}
                    data-testid="tile-checklist-points-earned"
                  >
                    <p className="text-xs text-gray-500 font-medium">Points earned this month</p>
                    <p className="font-heading font-bold text-2xl mt-1" style={{ color: '#0d9488' }}>
                      +{checklistData.pointsThisMonth} pts
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(204,251,241,0.30)', border: '1px solid rgba(20,184,166,0.15)' }}>
                  <p className="text-sm text-gray-500">Loading your checklist…</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Rewards tab content */}
        {activeNavTab === "points" && (
          <div data-testid="rewards-tab-section">
            <div className="flex items-end justify-between mb-3 px-1 gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-gray-900 truncate" data-testid="text-rewards-dashboard-heading">
                  Rewards & Points
                </h3>
                <p className="text-sm text-gray-500/80" data-testid="text-rewards-dashboard-subheading">
                  Earn points, claim rewards
                </p>
              </div>
              <button
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-[1.03]"
                style={{ color: '#be3144', background: 'rgba(244,114,128,0.10)', border: '1px solid rgba(244,114,128,0.22)' }}
                onClick={() => setLocation("/rewards")}
                data-testid="button-rewards-dashboard-see-more"
              >
                See more <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {(() => {
              const balancePts = totalPoints;
              const redemptionValue = (balancePts * 0.01).toFixed(2);
              const redeemItems: Array<{
                id: string; icon: string; category: string; title: string; value?: string; cost: number;
                bg: string; border: string; text: string; locked?: boolean;
              }> = [
                { id: "starbucks", icon: "☕", category: "Coffee", title: "Starbucks Coffee", value: "£5 gift card", cost: 500,
                  bg: "rgba(204,251,241,0.5)", border: "rgba(20,184,166,0.18)", text: "#0f766e" },
                { id: "amazon-10", icon: "📦", category: "Shopping", title: "Amazon", value: "£10 gift card", cost: 1000,
                  bg: "rgba(254,243,199,0.5)", border: "rgba(245,158,11,0.2)", text: "#b45309" },
                { id: "deliveroo", icon: "🍕", category: "Food", title: "Deliveroo", value: "£15 gift card", cost: 1500,
                  bg: "rgba(255,228,230,0.5)", border: "rgba(244,63,94,0.18)", text: "#be123c" },
                { id: "prize-draw", icon: "🎟️", category: "Draws", title: "Prize Draw Entry", value: "1 entry", cost: 300,
                  bg: "rgba(237,233,254,0.5)", border: "rgba(139,92,246,0.18)", text: "#6d28d9" },
                { id: "charity", icon: "❤️", category: "Give Back", title: "Charity Donation", value: "£10 donated", cost: 1000,
                  bg: "rgba(219,234,254,0.5)", border: "rgba(59,130,246,0.18)", text: "#1d4ed8" },
                { id: "thermostat", icon: "🌡️", category: "Home Tech", title: "Smart Thermostat", value: "£225 value", cost: 22500,
                  bg: "rgba(224,242,254,0.5)", border: "rgba(14,165,233,0.18)", text: "#0369a1", locked: true },
              ];
              return (
                <div className="space-y-4">
                  {/* Balance hero tile */}
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: 'rgba(254,215,219,0.45)',
                      border: '1px solid rgba(190,49,68,0.22)',
                    }}
                    data-testid="tile-rewards-balance"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#be3144' }}>
                      Your Balance
                    </p>
                    <p className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mt-1" data-testid="text-rewards-balance">
                      {balancePts.toLocaleString("en-GB")}<span className="text-lg ml-2 font-semibold text-gray-500">pts</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      ≈ £{redemptionValue} in redemption value
                    </p>
                  </div>

                  {/* Redeem section */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 px-1">
                      Redeem Points
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {redeemItems.map((item) => {
                        const canAfford = balancePts >= item.cost && !item.locked;
                        return (
                          <div
                            key={item.id}
                            className="rounded-2xl p-4 flex flex-col"
                            style={{
                              background: '#ffffff',
                              border: '1px solid rgba(190,49,68,0.25)',
                              opacity: item.locked ? 0.55 : 1,
                            }}
                            data-testid={`card-redeem-${item.id}`}
                          >
                            <div className="text-xl mb-1.5">{item.icon}</div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#be3144' }}>
                              {item.category}
                            </p>
                            <h3 className="font-heading font-bold text-sm text-gray-900 mt-0.5 leading-tight">{item.title}</h3>
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-gray-700 whitespace-nowrap leading-tight">
                                {item.cost.toLocaleString("en-GB")} pts
                              </p>
                              {item.value && (
                                <p className="text-[11px] text-gray-400 whitespace-nowrap leading-tight mt-0.5">
                                  {item.value}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={!canAfford || redeemGiftCardMutation.isPending}
                              onClick={() => !item.locked && redeemGiftCardMutation.mutate({ brandKey: item.id, pointsCost: item.cost })}
                              className="mt-3 w-full px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed hover:scale-[1.02]"
                              style={{
                                color: canAfford ? '#ffffff' : '#9ca3af',
                                background: canAfford ? '#be3144' : 'rgba(0,0,0,0.05)',
                                border: `1px solid ${canAfford ? 'rgba(190,49,68,0.4)' : 'rgba(0,0,0,0.08)'}`,
                              }}
                              data-testid={`button-redeem-${item.id}`}
                            >
                              {item.locked ? 'Locked' : redeemGiftCardMutation.isPending ? 'Redeeming…' : 'Redeem'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Refer a friend tile */}
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: 'rgba(68,186,132,0.10)',
                      border: '1px solid rgba(68,186,132,0.22)',
                    }}
                    data-testid="tile-refer-friend"
                  >
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#0f766e' }} />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-heading font-bold text-gray-900">
                          Refer a Friend — Earn 2,000 pts
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          When they close a mortgage with your broker, you both earn big.
                        </p>
                        <button
                          type="button"
                          onClick={handleShareReferralLink}
                          disabled={!referralCode}
                          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ background: '#44ba84', border: '1px solid rgba(68,186,132,0.35)' }}
                          data-testid="button-share-referral-link"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Share My Referral Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Marketplace tab content */}
        {activeNavTab === "marketplace" && (
          <div data-testid="marketplace-tab-section">
            <div className="flex items-end justify-between mb-3 px-1 gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-gray-900 truncate" data-testid="text-marketplace-tab-heading">
                  Marketplace
                </h3>
                <p className="text-sm text-gray-500/80" data-testid="text-marketplace-tab-subheading">
                  Earn cashback with our partners
                </p>
              </div>
              <button
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-[1.03]"
                style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.2)' }}
                onClick={() => setLocation("/client/marketplace")}
                data-testid="button-marketplace-tab-see-more"
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {(() => {
              const categories: Array<{ key: "homeware" | "leisure"; title: string }> = [
                { key: "homeware", title: "Household" },
                { key: "leisure", title: "Leisure & Travel" },
              ];
              return (
                <div className="space-y-4">
                  <div
                    className="flex flex-wrap gap-2"
                    role="tablist"
                    aria-label="Marketplace categories"
                  >
                    {categories.map((cat) => {
                      const active = marketplaceCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setMarketplaceCategory(cat.key)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-[1.03]"
                          style={{
                            color: active ? '#ffffff' : '#0f766e',
                            background: active ? '#44ba84' : 'rgba(68,186,132,0.08)',
                            border: `1px solid ${active ? 'rgba(68,186,132,0.4)' : 'rgba(68,186,132,0.2)'}`,
                          }}
                          data-testid={`pill-marketplace-category-${cat.key}`}
                        >
                          {cat.title}
                        </button>
                      );
                    })}
                  </div>
                  {categories.filter((c) => c.key === marketplaceCategory).map((section) => {
                    const stores = affiliateDeals.filter((d) => d.tab === section.key).slice(0, 5);
                    return (
                      <div key={section.key} data-testid={`marketplace-tab-section-${section.key}`}>
                        {stores.length === 0 ? (
                          <div
                            className="rounded-2xl p-6 text-center text-sm text-gray-500"
                            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}
                          >
                            No deals available right now.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stores.map((deal) => {
                              const Icon = iconFor(deal.iconKey);
                              const bg = deal.accentBg || "rgba(229,231,235,0.5)";
                              const text = deal.accentColor || "#374151";
                              const border = `${deal.accentColor || "#374151"}33`;
                              return (
                                <div
                                  key={deal.id}
                                  className="rounded-2xl p-5 flex flex-col"
                                  style={{ background: bg, border: `1px solid ${border}` }}
                                  data-testid={`card-marketplace-tab-store-${deal.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                      style={{ background: "#ffffff", border: `1px solid ${border}` }}
                                    >
                                      <Icon className="w-6 h-6" style={{ color: text }} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: text }}>
                                        {deal.category}
                                      </p>
                                      <h3 className="font-heading font-bold text-gray-900 truncate">{deal.storeName}</h3>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-3 flex-1">{deal.dealDescription}</p>
                                  <a
                                    href={trackingUrlFor(deal.id)}
                                    target="_blank"
                                    rel="noopener noreferrer sponsored"
                                    className="mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:brightness-110"
                                    style={{ background: "#44ba84", border: "1px solid rgba(68,186,132,0.25)" }}
                                    data-testid={`button-marketplace-tab-shop-${deal.id}`}
                                  >
                                    Shop Now <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <p className="text-[11px] text-gray-500 mt-3 leading-snug">
                                    Affiliate partner — Uprosper may earn a commission at no extra cost to you.
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
        </div>

        {/* Pension Planning Dialog */}
        <Dialog open={pensionOpen} onOpenChange={setPensionOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Pension Planning</DialogTitle>
              <DialogDescription>
                Secure your future with a pension plan tailored to your goals.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h4 className="font-semibold text-green-800 mb-2">What's included:</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Free consultation with a pension specialist
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Personalised retirement income projection
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Review of your existing pension arrangements
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Tax-efficient savings strategies
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Our trusted wealth partner will contact you within 48 hours to arrange your free consultation.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setPensionOpen(false)}
                data-testid="button-pension-cancel"
              >
                Maybe Later
              </Button>
              <Button 
                className="flex-1 bg-green-700 hover:bg-green-800"
                onClick={() => {
                  toast.success("Great choice! Our wealth partner will be in touch soon.");
                  setPensionOpen(false);
                }}
                data-testid="button-pension-submit"
              >
                I'm Interested
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Home Insurance Referral Dialog */}
        <Dialog open={homeInsuranceOpen} onOpenChange={setHomeInsuranceOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Explore Home Insurance 🏠</DialogTitle>
              <DialogDescription>
                Optional introduction to an FCA-regulated provider.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h4 className="font-semibold text-green-800 mb-2">What's included:</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Buildings and contents protection
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Accidental damage cover
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Personal possessions coverage
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Legal expenses protection
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Get a competitive quote from our trusted partner Direct Line.
              </p>
              <p className="text-xs text-gray-400 italic">
                The broker and/or platform may receive a referral fee.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  if (selectedHomeInsuranceNotificationId) {
                    dismissNotificationMutation.mutate(selectedHomeInsuranceNotificationId);
                  }
                  setHomeInsuranceOpen(false);
                  setSelectedHomeInsuranceNotificationId(null);
                }}
                data-testid="button-home-insurance-cancel"
              >
                Maybe Later
              </Button>
              <Button 
                className="flex-1 bg-green-700 hover:bg-green-800"
                onClick={() => {
                  window.open("https://www.directline.com/home/quote-policy/policy-holder", "_blank");
                  setHomeInsuranceOpen(false);
                }}
                data-testid="button-home-insurance-quote"
              >
                Get a Quote
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Life Insurance Dialog */}
        <Dialog open={lifeInsuranceOpen} onOpenChange={setLifeInsuranceOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Explore Life Insurance 🛡️</DialogTitle>
              <DialogDescription>
                Optional introduction to an FCA-regulated provider.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h4 className="font-semibold text-green-800 mb-2">What's included:</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Financial protection for your family
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Mortgage repayment protection
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Critical illness cover options
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Flexible payment terms
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Get a personalised quote from our trusted insurance partners.
              </p>
              <p className="text-xs text-gray-400 italic">
                The broker and/or platform may receive a referral fee.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  if (selectedLifeInsuranceNotificationId) {
                    dismissNotificationMutation.mutate(selectedLifeInsuranceNotificationId);
                  }
                  setLifeInsuranceOpen(false);
                  setSelectedLifeInsuranceNotificationId(null);
                }}
                data-testid="button-life-insurance-cancel"
              >
                Maybe Later
              </Button>
              <Button 
                className="flex-1 bg-green-700 hover:bg-green-800"
                onClick={() => {
                  window.open("https://www.vitality.co.uk/life-insurance/?utm_source=google&utm_medium=cpc&utm_campaign=%E2%80%98PPC+-+GGL+-+Search+-+Life+-+Life+Insurance+-+PG+-+Exact+-+VBB+-+Test&utm_term=life+insurance", "_blank");
                  setLifeInsuranceOpen(false);
                }}
                data-testid="button-life-insurance-quote"
              >
                Get a Quote
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fixed Rate Ending Dialog */}
        <Dialog open={fixedRateEndingOpen} onOpenChange={setFixedRateEndingOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Your fixed-rate mortgage ends in 3 months ⏰</DialogTitle>
              <DialogDescription>
                It's a good time to review your options and plan ahead.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h4 className="font-semibold text-orange-800 mb-2">What we can help with:</h4>
                <ul className="space-y-2 text-sm text-orange-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    Compare current market rates
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    Explore remortgage options
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    Understand your choices before your deal ends
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    Lock in a new rate early
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Speak to your broker to discuss your options.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  if (selectedFixedRateNotificationId) {
                    dismissNotificationMutation.mutate(selectedFixedRateNotificationId);
                  }
                  setFixedRateEndingOpen(false);
                  setSelectedFixedRateNotificationId(null);
                }}
                data-testid="button-fixed-rate-cancel"
              >
                Maybe Later
              </Button>
              <button 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                onClick={() => {
                  setContactOpen(true);
                  setFixedRateEndingOpen(false);
                }}
                data-testid="button-fixed-rate-contact"
              >
                Contact Broker
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Moving House Dialog */}
        <Dialog open={movingHouseOpen} onOpenChange={setMovingHouseOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Thinking of moving or upsizing? 🏡</DialogTitle>
              <DialogDescription>
                We can check affordability and options before you commit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h4 className="font-semibold text-orange-800 mb-2">What we can help with:</h4>
                <ul className="space-y-2 text-sm text-orange-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    Affordability assessment
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    Porting your existing mortgage
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    New mortgage options for your next home
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    Stamp duty and costs guidance
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Speak to your broker to discuss your moving plans.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  if (selectedMovingHouseNotificationId) {
                    dismissNotificationMutation.mutate(selectedMovingHouseNotificationId);
                  }
                  setMovingHouseOpen(false);
                  setSelectedMovingHouseNotificationId(null);
                }}
                data-testid="button-moving-house-cancel"
              >
                Maybe Later
              </Button>
              <button 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                onClick={() => {
                  setContactOpen(true);
                  setMovingHouseOpen(false);
                }}
                data-testid="button-moving-house-contact"
              >
                Contact Broker
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Celebratory Reward Claim Dialog */}
        <Dialog open={!!selectedRewardNotification} onOpenChange={(open) => !open && setSelectedRewardNotification(null)}>
          <DialogContent className="max-w-sm p-0 overflow-hidden border-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500" />
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.3, 0.7, 0.3],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  >
                    {i % 3 === 0 ? (
                      <Sparkles className="w-4 h-4 text-white/40" />
                    ) : i % 3 === 1 ? (
                      <Star className="w-3 h-3 text-yellow-200/50" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white/30" />
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="relative px-6 pt-6 pb-5">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="shrink-0"
                  >
                    <div className="bg-white/25 backdrop-blur-sm w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <PartyPopper className="w-7 h-7 text-white drop-shadow-md" />
                      </motion.div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-left"
                  >
                    <DialogHeader className="text-left space-y-1">
                      <DialogTitle className="text-xl font-heading text-white drop-shadow-sm text-left">
                        Congratulations
                      </DialogTitle>
                      <DialogDescription className="text-white/90 text-sm text-left">
                        Your reward is ready!
                      </DialogDescription>
                    </DialogHeader>
                  </motion.div>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2 bg-white">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-5"
              >
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <Gift className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="font-bold text-gray-900 text-lg">Your reward awaits</h3>
                  <p className="text-sm text-gray-600 mt-1">Head to Rewards & Offers to claim it</p>
                </div>
              </motion.div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1 border-gray-300"
                  onClick={() => {
                    if (selectedRewardNotification) {
                      dismissNotificationMutation.mutate(selectedRewardNotification.id);
                    }
                    setSelectedRewardNotification(null);
                  }}
                  data-testid="button-reward-dismiss"
                >
                  Dismiss
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md"
                  onClick={() => setSelectedRewardNotification(null)}
                  data-testid="button-reward-claimed"
                >
                  Awesome!
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Coffee QR Code Dialog */}
        <Dialog open={coffeeQrOpen} onOpenChange={setCoffeeQrOpen}>
          <DialogContent className="max-w-sm p-0 overflow-hidden border-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400" />
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -15, 0],
                      opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  >
                    <Coffee className="w-4 h-4 text-white/30" />
                  </motion.div>
                ))}
              </div>
              <div className="relative px-6 pt-8 pb-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="bg-white/25 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Coffee className="w-10 h-10 text-white drop-shadow-md" />
                </motion.div>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading text-white drop-shadow-sm">Free Coffee!</DialogTitle>
                  <DialogDescription className="text-white/90 text-base mt-1">
                    Show this QR code at your local cafe
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
            <div className="px-6 pb-6 pt-4 bg-white">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=UPROSPER-COFFEE-2024" 
                    alt="Coffee Reward QR Code"
                    className="w-48 h-48"
                    data-testid="img-coffee-qr"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Reward Code</p>
                  <p className="text-lg font-bold text-blue-600" data-testid="text-coffee-code">UPROSPER-COFFEE-2024</p>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Valid at participating cafes. Expires in 30 days.
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (discountsNotification) {
                      dismissNotificationMutation.mutate(discountsNotification.id);
                    }
                    setCoffeeQrOpen(false);
                  }}
                  data-testid="button-coffee-dismiss"
                >
                  Dismiss
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold shadow-md"
                  onClick={() => setCoffeeQrOpen(false)}
                  data-testid="button-coffee-done"
                >
                  Awesome!
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Meeting Dialog */}
        <Dialog open={scheduleMeetingOpen} onOpenChange={setScheduleMeetingOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Schedule a Meeting</DialogTitle>
              <DialogDescription>
                Let's discuss your mortgage options and find the best rate for you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-date">Preferred Date</Label>
                <Input type="date" id="meeting-date" data-testid="input-meeting-date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-time">Preferred Time</Label>
                <select 
                  id="meeting-time" 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  data-testid="select-meeting-time"
                >
                  <option value="">Select a time</option>
                  <option value="9:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-type">Meeting Type</Label>
                <select 
                  id="meeting-type" 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  data-testid="select-meeting-type"
                >
                  <option value="phone">Phone Call</option>
                  <option value="video">Video Call</option>
                  <option value="inperson">In Person</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-notes">Additional Notes (Optional)</Label>
                <Textarea 
                  id="meeting-notes" 
                  placeholder="Any specific questions or topics you'd like to discuss?"
                  data-testid="textarea-meeting-notes"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setScheduleMeetingOpen(false)}
                data-testid="button-meeting-cancel"
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-green-700 hover:bg-green-800"
                onClick={() => {
                  toast.success("Meeting request sent! Your broker will confirm shortly.");
                  setScheduleMeetingOpen(false);
                }}
                data-testid="button-meeting-submit"
              >
                Request Meeting
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Broker Chat Dialog */}
        <Dialog open={chatOpen} onOpenChange={(open) => { if (!open) { setChatOpen(false); setChatReplyText(""); setSelectedBrokerMessage(null); setBookingFlowStep("invite"); setBookedDate(""); setBookedTime(""); setAddReminder24h(true); if (bookingConfirmTimerRef.current) { clearTimeout(bookingConfirmTimerRef.current); bookingConfirmTimerRef.current = null; } } }}>
          <DialogContent className="sm:max-w-md bg-white">
            {selectedBrokerMessage?.messageType === "booking_link" && selectedBrokerMessage?.meetingLink ? (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#a78bfa' }}>
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <DialogTitle className="text-xl font-heading font-bold text-gray-900" data-testid="text-meeting-invite-title">
                        Schedule your consultation
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        From {brokerInfo?.companyName || 'your broker'} · {selectedBrokerMessage?.createdAt && formatDistance(new Date(selectedBrokerMessage.createdAt), new Date(), { addSuffix: true })}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                {bookingFlowStep === "invite" && (
                  <>
                    <div className="mt-4 p-4 rounded-2xl border border-emerald-100" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)' }}>
                      <p className="text-sm font-semibold text-gray-900">{selectedBrokerMessage?.subject || "Book a consultation"}</p>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{selectedBrokerMessage?.content}</p>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (selectedBrokerMessage) {
                            handleDismissMessage(selectedBrokerMessage.id);
                          }
                        }}
                        data-testid="button-dismiss-meeting-invite"
                      >
                        Not now
                      </Button>
                      <Button
                        asChild
                        className="flex-1 gap-2 text-white"
                        style={{ background: '#44ba84' }}
                      >
                        <a
                          href={selectedBrokerMessage.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (selectedBrokerMessage && !selectedBrokerMessage.read) {
                              markMessageReadMutation.mutate(selectedBrokerMessage.id);
                            }
                            if (bookingConfirmTimerRef.current) {
                              clearTimeout(bookingConfirmTimerRef.current);
                            }
                            bookingConfirmTimerRef.current = setTimeout(() => {
                              setBookingFlowStep("confirm");
                            }, 3000);
                          }}
                          data-testid="button-book-meeting"
                        >
                          <Calendar className="w-4 h-4" /> Book a Meeting
                        </a>
                      </Button>
                    </div>
                  </>
                )}

                {bookingFlowStep === "confirm" && (
                  <>
                    <div className="mt-4 p-4 rounded-2xl border border-purple-100" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)' }}>
                      <p className="text-sm font-semibold text-gray-900" data-testid="text-confirm-booking-question">Did you get it booked in?</p>
                      <p className="text-sm text-gray-600 mt-1">If so, we can save it to your Uprosper calendar and remind you 24 hours before.</p>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (selectedBrokerMessage) {
                            handleDismissMessage(selectedBrokerMessage.id);
                          }
                          setBookingFlowStep("invite");
                        }}
                        data-testid="button-confirm-not-yet"
                      >
                        Not yet
                      </Button>
                      <Button
                        className="flex-1 gap-2 text-white"
                        style={{ background: '#44ba84' }}
                        onClick={() => setBookingFlowStep("set-time")}
                        data-testid="button-confirm-yes"
                      >
                        Yes, I booked it
                      </Button>
                    </div>
                  </>
                )}

                {bookingFlowStep === "set-time" && (
                  <>
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label htmlFor="booked-date" className="text-sm font-medium text-gray-700">Meeting date</Label>
                        <Input
                          id="booked-date"
                          type="date"
                          value={bookedDate}
                          onChange={(e) => setBookedDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="mt-1"
                          data-testid="input-booked-date"
                        />
                      </div>
                      <div>
                        <Label htmlFor="booked-time" className="text-sm font-medium text-gray-700">Meeting time</Label>
                        <Input
                          id="booked-time"
                          type="time"
                          value={bookedTime}
                          onChange={(e) => setBookedTime(e.target.value)}
                          className="mt-1"
                          data-testid="input-booked-time"
                        />
                      </div>
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addReminder24h}
                          onChange={(e) => setAddReminder24h(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                          data-testid="checkbox-reminder-24h"
                        />
                        <span className="text-sm text-gray-700">Remind me 24 hours before</span>
                      </label>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setBookingFlowStep("confirm")}
                        data-testid="button-set-time-back"
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1 gap-2 text-white"
                        style={{ background: '#44ba84' }}
                        disabled={!bookedDate || !bookedTime || saveBookedAppointmentMutation.isPending}
                        onClick={() => {
                          if (selectedBrokerMessage && !selectedBrokerMessage.read) {
                            markMessageReadMutation.mutate(selectedBrokerMessage.id);
                          }
                          saveBookedAppointmentMutation.mutate({
                            meetingDate: bookedDate,
                            meetingTime: bookedTime,
                            addReminder: addReminder24h,
                          });
                        }}
                        data-testid="button-save-booked-appointment"
                      >
                        {saveBookedAppointmentMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </>
                )}

                {bookingFlowStep === "done" && (
                  <div className="mt-4 p-6 rounded-2xl border border-emerald-100 text-center" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)' }}>
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: '#44ba84' }}>
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-base font-semibold text-gray-900" data-testid="text-booking-saved">Saved to your Uprosper calendar</p>
                    {addReminder24h && (
                      <p className="text-sm text-gray-600 mt-1">We'll remind you 24 hours before.</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-heading font-bold text-gray-900">Message from {brokerInfo?.companyName || 'your broker'}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {selectedBrokerMessage?.createdAt && formatDistance(new Date(selectedBrokerMessage.createdAt), new Date(), { addSuffix: true })}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedBrokerMessage?.content}</p>
                </div>
                <div className="mt-4 space-y-3">
                  <Label htmlFor="chatReply" className="text-sm font-medium text-gray-700">Reply to your broker</Label>
                  <Textarea
                    id="chatReply"
                    placeholder="Type your reply..."
                    value={chatReplyText}
                    onChange={(e) => setChatReplyText(e.target.value)}
                    className="bg-gray-50 border-gray-200 min-h-[100px]"
                    data-testid="textarea-chat-reply"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (selectedBrokerMessage) {
                        handleDismissMessage(selectedBrokerMessage.id);
                      }
                    }}
                    data-testid="button-dismiss-chat"
                  >
                    Dismiss
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-green-700 hover:bg-green-800"
                    disabled={!chatReplyText.trim() || chatReplyMutation.isPending}
                    onClick={() => {
                      if (selectedBrokerMessage && chatReplyText.trim() && clientId && client?.brokerUserId) {
                        chatReplyMutation.mutate({
                          clientId: clientId,
                          brokerUserId: client.brokerUserId,
                          subject: "Re: Broker Message",
                          content: chatReplyText.trim(),
                          messageId: selectedBrokerMessage.id
                        });
                      }
                    }}
                    data-testid="button-send-chat-reply"
                  >
                    <Send className="w-4 h-4" /> {chatReplyMutation.isPending ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Main Journey Visualization */}
        <section id="financial-journey-section" className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <FinancialJourney key={`journey-${clientId}`} steps={journeySteps} clientId={clientId} brokerUserId={client?.brokerUserId} />
        </section>

        {/* Rewards & Deals */}
        <div id="rewards-offers-section" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: '#44ba84' }} />
              <h2 id="rewards-offers-heading" className="text-xl font-heading font-bold text-gray-900" data-testid="text-rewards-heading">Rewards</h2>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-[1.03]"
              style={{ color: '#44ba84', background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.2)' }}
              onClick={() => setLocation("/rewards")}
              data-testid="button-homeowner-deals"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> See More
            </button>
          </div>

          <RewardsSection notifications={notifications} clientId={clientId} />

        </div>

        {/* Deal QR Code Dialog */}
        <Dialog open={!!selectedDealQR} onOpenChange={(open) => !open && setSelectedDealQR(null)}>
          <DialogContent className="max-w-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(68,186,132,0.2)' }}>
            <DialogHeader>
              <DialogTitle className="text-lg font-heading text-gray-900 text-center">
                {selectedDealQR?.storeName} Deal
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 text-center">
                Scan this QR code to visit the store with your exclusive tracking link
              </DialogDescription>
            </DialogHeader>
            <div className="text-center py-4">
              <div className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm inline-block mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(selectedDealQR ? absoluteTrackingUrl(selectedDealQR.id) : '')}`}
                  alt={`${selectedDealQR?.storeName} QR Code`}
                  className="w-48 h-48"
                  data-testid="img-deal-qr"
                />
              </div>
              {selectedDealQR?.discountCode && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Use this code at checkout:</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(68,186,132,0.06)', border: '1px dashed rgba(68,186,132,0.35)' }}>
                    <span className="font-mono font-bold text-base tracking-wider" style={{ color: '#2d8a5e' }}>
                      {selectedDealQR.discountCode}
                    </span>
                  </div>
                </div>
              )}
              <a
                href={selectedDealQR ? trackingUrlFor(selectedDealQR.id) : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                data-testid="button-qr-shop-now"
              >
                Visit Store <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </DialogContent>
        </Dialog>

        {/* Active Policies */}
        <Card className="p-6 border-none shadow-md bg-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Active Policies</h3>
              <p className="text-sm text-muted-foreground">{brokerInfo?.companyName ? `with ${brokerInfo.companyName}` : 'via your broker'}</p>
            </div>
          </div>
          <div className="mt-4">
            {(() => {
              const policyMap: Record<string, string> = {
                "Mortgage Secured": "Mortgage Policy",
                "Home Insurance": "Home Insurance",
                "Life Insurance": "Life Insurance",
                "Wealth Review": "Wealth Review",
                "Will & Succession": "Will & Succession",
              };
              const activePolicies = (journeySteps ?? [])
                .filter((s: any) => s.status === "completed" && policyMap[s.stepTitle])
                .map((s: any) => policyMap[s.stepTitle]);
              
              if (activePolicies.length === 0) {
                return (
                  <div className="px-8 py-10 text-center text-muted-foreground border border-gray-200 rounded-lg" data-testid="policies-empty-state">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Your active policies will appear here</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-3" data-testid="policies-list">
                  {activePolicies.map((policy: string) => (
                    <div key={policy} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100" data-testid={`policy-${policy.toLowerCase().replace(/\s+/g, '-')}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="font-medium text-gray-700">{policy}</span>
                      </div>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </Card>

        {/* Referral Section */}
        <Card id="refer-a-friend" className="p-6 border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-600 rounded-xl text-white shadow-lg shadow-green-600/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Refer a Friend</h3>
                <p className="text-sm text-green-700">Share the prosperity</p>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-5">
              Know someone looking for mortgage advice? Refer them and you'll both receive a <span className="font-bold text-green-700">£25 reward</span> — it's that simple!
            </p>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-200 mb-4">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Your Referral Code</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-green-50 border-2 border-dashed border-green-300 rounded-lg px-4 py-3">
                  <span className="font-mono text-xl font-bold text-green-700 tracking-widest" data-testid="text-referral-code">
                    {referralCode || 'Loading...'}
                  </span>
                </div>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-12 w-12 border-green-300 text-green-700 hover:bg-green-100 hover:text-green-800"
                  onClick={handleCopyReferralCode}
                  disabled={!referralCode}
                  data-testid="button-copy-referral"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <button
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 4px 12px rgba(68,186,132,0.25)' }}
              onClick={handleShareReferral}
              disabled={!referralCode}
              data-testid="button-share-referral"
            >
              <Share2 className="w-4 h-4" />
              Share with Friends
            </button>
            
            <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-green-200/50">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700" data-testid="text-referral-count">{referralStats?.count || 0}</p>
                <p className="text-xs text-gray-500">Referrals Made</p>
              </div>
              <div className="w-px h-8 bg-green-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700" data-testid="text-referral-rewards">£{referralStats?.totalRewards || '0'}</p>
                <p className="text-xs text-gray-500">Rewards Earned</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Welcome to Uprosper Popup */}
      <Dialog open={welcomePopupOpen} onOpenChange={setWelcomePopupOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md p-0 overflow-hidden border-none rounded-2xl" style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.96) 100%)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.6) inset',
        }}>
          <div className="relative rounded-2xl mx-4 sm:mx-5 mt-4 sm:mt-5 overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(68,186,132,0.08) 0%, rgba(16,185,129,0.04) 100%)',
            border: '1px solid rgba(68,186,132,0.15)',
            boxShadow: '0 2px 12px rgba(68,186,132,0.06), 0 0 0 1px rgba(255,255,255,0.5) inset',
          }}>
            <div className="px-5 py-5 text-center">
              <div className="text-4xl mb-2">🏡</div>
              <DialogHeader className="text-center space-y-0.5">
                <DialogTitle className="text-lg font-heading font-bold text-gray-900 text-center">
                  Welcome to Uprosper
                </DialogTitle>
                <DialogDescription className="text-sm text-center" style={{ color: '#44ba84' }}>
                  Your homeowner journey starts here
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          <div className="px-5 sm:px-6 pb-6 pt-3 space-y-4 overflow-y-auto max-h-[70vh]">
            <p className="text-gray-700 text-[15px] leading-relaxed font-medium">
              Congratulations on your new home — this is where your journey really begins.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              We've set up your personal homeowner hub with:
            </p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(68,186,132,0.1)' }}>
                  <Gift className="w-3.5 h-3.5" style={{ color: '#44ba84' }} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">Exclusive perks to help you make your home your own</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(68,186,132,0.1)' }}>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: '#44ba84' }} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">Simple insights to help you make smarter financial decisions</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(68,186,132,0.1)' }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#44ba84' }} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">Ongoing support from your advisor when you need it</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed pt-1">
              Start by exploring your perks or checking this week's homeowner insight.
            </p>
            <div className="flex gap-3">
              <button
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                onClick={() => setWelcomePopupOpen(false)}
                data-testid="button-welcome-popup-close"
              >
                Let's Get Started
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gift card redemption modal */}
      <Dialog open={redeemModal.open} onOpenChange={(open) => !open && setRedeemModal({ open: false, card: null, error: null })}>
        <DialogContent className="max-w-sm overflow-hidden rounded-2xl" style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(190,49,68,0.2)' }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-heading text-gray-900 text-center">
              {redeemModal.error === "out_of_stock" ? "Out of Stock" : "Your Gift Card 🎉"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 text-center">
              {redeemModal.error === "out_of_stock"
                ? "This reward is currently out of stock. Please check back soon."
                : "Points deducted — use the code below at checkout."}
            </DialogDescription>
          </DialogHeader>
          {redeemModal.card && (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(254,215,219,0.3)', border: '1px solid rgba(190,49,68,0.15)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#be3144' }}>{redeemModal.card.brandLabel}</p>
                <p className="font-heading font-bold text-2xl text-gray-900">£{Number(redeemModal.card.faceValue).toFixed(2)}</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
                <p className="text-xs text-gray-500 mb-1">Gift Card Code</p>
                <p className="font-mono font-bold text-lg tracking-widest text-gray-900" data-testid="text-gift-card-code">{redeemModal.card.code}</p>
                {redeemModal.card.pin && (
                  <p className="text-xs text-gray-500 mt-1">PIN: <span className="font-mono font-semibold text-gray-700">{redeemModal.card.pin}</span></p>
                )}
              </div>
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <QRCodeSVG value={redeemModal.card.code} size={160} data-testid="qr-gift-card" />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 text-center">Visit your Rewards History page to view this again anytime.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </Shell>
    </>
  );
}
