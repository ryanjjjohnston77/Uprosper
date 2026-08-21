import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Gift, Coffee, Tag, Sparkles, Star, PartyPopper, ExternalLink, QrCode, CheckCircle2, ShoppingBag, Clock, Users, Share2, TrendingUp, Ticket, Trophy, Heart, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { trackingUrlFor } from "@/lib/affiliate-deals";
import type { AffiliateDeal } from "@/lib/affiliate-deals";
import { CostaFlipCard } from "@/components/rewards-section";
import { toast } from "sonner";

const notifTypeConfig: Record<string, { icon: any; colorClass: string }> = {
  reward: { icon: Gift, colorClass: "bg-amber-100 text-amber-600" },
  referral_reward: { icon: Gift, colorClass: "bg-purple-100 text-purple-600" },
  free_coffee_reward: { icon: Coffee, colorClass: "bg-orange-100 text-orange-600" },
  costa_reward: { icon: Coffee, colorClass: "bg-rose-50 text-[#6d0839]" },
};

const statusStyles: Record<string, { label: string; classes: string }> = {
  claimed: { label: "Claimed", classes: "text-green-700 bg-green-100" },
  unclaimed: { label: "Unclaimed", classes: "text-amber-700 bg-amber-100" },
  active: { label: "Active", classes: "text-blue-700 bg-blue-100" },
};

export default function RewardsHistory() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [redeemModal, setRedeemModal] = useState<{ open: boolean; card: any | null; error: string | null }>({ open: false, card: null, error: null });
  const [selectedDealQR, setSelectedDealQR] = useState<AffiliateDeal | null>(null);
  const [costaQrData, setCostaQrData] = useState<string | null>(null);
  const [costaLoading, setCostaLoading] = useState(false);

  // Prize draw modal state
  const [drawModal, setDrawModal] = useState<{ open: boolean; numEntries: number }>({ open: false, numEntries: 1 });
  // Charity modal state
  const [charityModal, setCharityModal] = useState<{ open: boolean; selectedId: number | null; pointsToSpend: string }>({ open: false, selectedId: null, pointsToSpend: '100' });

  const { data: client } = useQuery<any>({
    queryKey: ["client-me"],
    queryFn: async () => {
      const res = await fetch("/api/client/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const clientId = client?.id;

  const { data: pointsData } = useQuery<{ totalPoints: number }>({
    queryKey: ['client-points'],
    queryFn: async () => {
      const res = await fetch('/api/client/points', { credentials: 'include' });
      if (!res.ok) return { totalPoints: 0 };
      return res.json();
    },
    enabled: !!clientId,
  });

  const balancePts = pointsData?.totalPoints ?? 0;
  const redemptionValue = (balancePts * 0.01).toFixed(2);
  const pointsEarnedTotal = balancePts;

  const { data: activeDraw } = useQuery<any>({
    queryKey: ['client-active-draw'],
    queryFn: async () => {
      const res = await fetch('/api/client/prize-draws/active', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!clientId,
  });

  const { data: charitiesList = [] } = useQuery<any[]>({
    queryKey: ['client-charities'],
    queryFn: async () => {
      const res = await fetch('/api/client/charities', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientId,
  });

  const { data: myDonations = [] } = useQuery<any[]>({
    queryKey: ['client-my-donations'],
    queryFn: async () => {
      const res = await fetch('/api/client/my-donations', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientId,
  });

  const { data: brokerRewards = [] } = useQuery<any[]>({
    queryKey: ['client-broker-rewards'],
    queryFn: async () => {
      const res = await fetch('/api/client/broker-rewards', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientId,
    refetchInterval: 30000,
  });

  const BROKER_REWARD_BRAND_LABELS: Record<string, { label: string; icon: string }> = {
    amazon: { label: 'Amazon', icon: '📦' },
    starbucks: { label: 'Starbucks', icon: '☕' },
    'marks-and-spencer': { label: 'M&S', icon: '🛍️' },
  };

  const enterDrawMutation = useMutation({
    mutationFn: async ({ drawId, numEntries }: { drawId: number; numEntries: number }) => {
      const res = await fetch(`/api/client/prize-draws/${drawId}/enter`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numEntries }),
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.error || 'Failed'), { code: data.error });
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`You've entered ${data.numEntries} time${data.numEntries !== 1 ? 's' : ''}! Good luck! 🎟️`);
      queryClient.invalidateQueries({ queryKey: ['client-points'] });
      queryClient.invalidateQueries({ queryKey: ['client-active-draw'] });
      setDrawModal({ open: false, numEntries: 1 });
    },
    onError: (err: any) => {
      const code = err.code || err.message;
      if (code === 'INSUFFICIENT_POINTS') toast.error("Not enough points for this many entries.");
      else if (code === 'MAX_ENTRIES_EXCEEDED') toast.error("You've reached the maximum entries for this draw.");
      else if (code === 'DRAW_NOT_ACTIVE') toast.error("This draw is no longer accepting entries.");
      else toast.error("Failed to enter draw. Please try again.");
    },
  });

  const donateCharityMutation = useMutation({
    mutationFn: async ({ charityId, pointsDonated }: { charityId: number; pointsDonated: number }) => {
      const res = await fetch(`/api/client/charities/${charityId}/donate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsDonated }),
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.error || 'Failed'), { code: data.error });
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`Donated ${data.pointsDonated.toLocaleString('en-GB')} pts (≈ £${Number(data.poundValue).toFixed(2)}) to ${data.charityName}! ❤️`);
      queryClient.invalidateQueries({ queryKey: ['client-points'] });
      queryClient.invalidateQueries({ queryKey: ['client-my-donations'] });
      setCharityModal({ open: false, selectedId: null, pointsToSpend: '100' });
    },
    onError: (err: any) => {
      const code = err.code || err.message;
      if (code === 'INSUFFICIENT_POINTS') toast.error("Not enough points for this donation.");
      else if (code === 'CHARITY_UNAVAILABLE') toast.error("This charity is not currently accepting donations.");
      else toast.error("Donation failed. Please try again.");
    },
  });

  const redeemCatalogue: Array<{
    id: string; icon: string; category: string; title: string; value?: string; cost: number; locked?: boolean;
  }> = [
    { id: "starbucks",  icon: "☕", category: "Coffee",    title: "Starbucks Coffee",  value: "£5 gift card",  cost: 500 },
    { id: "amazon-10",  icon: "📦", category: "Shopping",  title: "Amazon",            value: "£10 gift card", cost: 1000 },
    { id: "deliveroo",  icon: "🍕", category: "Food",      title: "Deliveroo",         value: "£15 gift card", cost: 1500 },
    { id: "amazon-25",  icon: "📦", category: "Shopping",  title: "Amazon",            value: "£25 gift card", cost: 2500 },
    { id: "prize-draw", icon: "🎟️", category: "Draws",     title: "Prize Draw Entry",  value: "1 entry",       cost: 300 },
    { id: "charity",    icon: "❤️", category: "Give Back", title: "Charity Donation",  value: "£10 donated",   cost: 1000 },
    { id: "cinema",     icon: "🎬", category: "Leisure",   title: "Cinema Ticket",     value: "~£15 ticket",   cost: 1500 },
    { id: "spotify",    icon: "🎧", category: "Streaming", title: "Spotify Premium",   value: "1 month",       cost: 1000 },
    { id: "thermostat", icon: "🌡️", category: "Home Tech", title: "Smart Thermostat",  value: "£225 value",    cost: 22500, locked: true },
    { id: "ipad",       icon: "📱", category: "Tech",      title: "iPad Mini",         value: "£500 value",    cost: 50000, locked: true },
  ];

  const { data: brokerInfo } = useQuery<any>({
    queryKey: ['broker-info', clientId],
    queryFn: async () => {
      const res = await fetch('/api/client/broker-info', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!clientId,
  });

  const { data: generatedReferral } = useQuery<any>({
    queryKey: ['referral-code', clientId],
    queryFn: async () => {
      const res = await fetch('/api/client/referral-code', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!clientId && !client?.referralCode,
  });

  const referralCode = client?.referralCode || generatedReferral?.referralCode;
  const referralSignupLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}${brokerInfo?.brokerCode ? `&broker=${brokerInfo.brokerCode}` : ''}`
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

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["notifications", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/notifications`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientId,
  });

  const { data: offers = [] } = useQuery<any[]>({
    queryKey: ["offers", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/offers`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientId,
  });

  const dismissMutation = useMutation({
    mutationFn: async (notifId: number) => {
      const res = await fetch(`/api/notifications/${notifId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to dismiss');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', clientId] });
    },
  });

  const { data: redeemedCards = [] } = useQuery<any[]>({
    queryKey: ['redeemed-cards'],
    queryFn: async () => {
      const res = await fetch('/api/client/redeemed-cards', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientId,
  });

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
      queryClient.invalidateQueries({ queryKey: ['redeemed-cards'] });
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

  const rewardTypes = ['reward', 'referral_reward', 'free_coffee_reward', 'costa_reward'];

  const rewardItems = notifications
    .filter((n: any) => rewardTypes.includes(n.type))
    .map((n: any) => {
      const config = notifTypeConfig[n.type] || notifTypeConfig.reward;
      const status = n.read ? "claimed" : "unclaimed";
      return {
        id: `notif-${n.id}`,
        rawId: n.id,
        title: n.title,
        description: n.message,
        icon: config.icon,
        colorClass: config.colorClass,
        statusStyle: statusStyles[status],
        status,
        date: n.createdAt,
        isReward: true,
        notification: n,
        type: n.type,
      };
    });

  const costaRewards = rewardItems.filter(r => r.type === 'costa_reward' && r.status === 'unclaimed');

  const offerItems = offers.map((o: any) => {
    const status = o.status || "active";
    return {
      id: `offer-${o.id}`,
      rawId: o.id,
      title: o.title,
      description: o.description,
      icon: Tag,
      colorClass: "bg-blue-100 text-blue-600",
      statusStyle: statusStyles[status] || statusStyles.active,
      status,
      date: o.createdAt,
      isReward: false,
      notification: null,
      type: 'offer',
    };
  });

  const allItems = [...rewardItems, ...offerItems].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  const claimedCount = rewardItems.filter(r => r.status === "claimed").length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleRewardClick = async (item: any) => {
    setSelectedReward(item);
    if (item.type === 'costa_reward') {
      setCostaLoading(true);
      setCostaQrData(null);
      try {
        const stepTitle = item.notification?.message?.match(/completing "(.+?)"/)?.[1] || '';
        const res = await fetch(`/api/client/reward-qr/${clientId}/${encodeURIComponent(stepTitle)}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCostaQrData(data.qrCodeData);
        }
      } catch {} finally {
        setCostaLoading(false);
      }
    }
  };

  const qrTrackingUrl = selectedDealQR
    ? (typeof window !== "undefined" ? `${window.location.origin}${trackingUrlFor(selectedDealQR.id)}` : trackingUrlFor(selectedDealQR.id))
    : '';
  const isCosta = selectedReward?.type === 'costa_reward';

  return (
    <Shell>
      <div className="space-y-8 w-full max-w-full overflow-hidden box-border pb-12">
        <div className="flex items-center gap-3">
          <button
            className="shrink-0 p-2 rounded-xl transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(68,186,132,0.08)', border: '1px solid rgba(68,186,132,0.15)' }}
            onClick={() => setLocation("/client")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-heading font-bold text-gray-900" data-testid="text-page-title">Rewards & Points</h1>
            <p className="text-sm text-gray-500">Earn, redeem, and track your prosperity rewards</p>
          </div>
        </div>

        {rewardItems.filter(r => r.status === 'unclaimed').length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(68,186,132,0.12)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.03), 0 0 0 1px rgba(255,255,255,0.5) inset',
            }}
            data-testid="rewards-empty-state-top"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(68,186,132,0.1)' }}>
                <Gift className="w-7 h-7" style={{ color: '#44ba84' }} />
              </div>
              <h3 className="text-lg font-heading font-bold text-gray-700">Your rewards will appear here</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                As you progress through your prosperity journey, your broker will send you exclusive rewards and offers. Happy redeeming!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rewardItems.filter(r => r.status === 'unclaimed').map((item, index) => {
                const isCosta = item.type === 'costa_reward';
                return (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.08 }}
                  >
                    {isCosta ? (
                      <CostaFlipCard
                        notif={{ id: item.rawId, message: item.description, type: item.type }}
                        clientId={clientId}
                        onDismiss={(id) => dismissMutation.mutate(id)}
                      />
                    ) : (
                      <div
                        className="relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(68,186,132,0.06) 100%)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: '1px solid rgba(68,186,132,0.15)',
                          boxShadow: '0 2px 12px rgba(68,186,132,0.06), 0 0 0 1px rgba(255,255,255,0.5) inset',
                        }}
                        data-testid={`reward-card-top-${item.rawId}`}
                        onClick={() => handleRewardClick(item)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(68,186,132,0.1)' }}>
                            <Gift className="w-5 h-5" style={{ color: '#44ba84' }} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#44ba84' }}>
                            {item.type === 'referral_reward' ? 'Referral Reward' : 'Reward'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1.5">Your reward is ready to claim! 🎉</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {item.description || 'Keep going on your prosperity journey!'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(68,186,132,0.08)', color: '#44ba84' }}>
                            <Clock className="w-3 h-3" />
                            Limited Time
                          </div>
                          <button
                            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:brightness-110"
                            style={{ background: '#44ba84' }}
                            onClick={(e) => { e.stopPropagation(); handleRewardClick(item); }}
                            data-testid={`button-claim-top-${item.rawId}`}
                          >
                            Claim
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Points balance hero */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(254,215,219,0.45)',
            border: '1px solid rgba(190,49,68,0.22)',
          }}
          data-testid="tile-points-balance"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#be3144' }}>
                Your Balance
              </p>
              <p className="font-heading font-bold text-4xl md:text-5xl text-gray-900 mt-1" data-testid="text-points-balance">
                {balancePts.toLocaleString("en-GB")}<span className="text-xl ml-2 font-semibold text-gray-500">pts</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                ≈ £{redemptionValue} in redemption value
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(190,49,68,0.1)' }}>
              <Sparkles className="w-6 h-6" style={{ color: '#be3144' }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Points Earned", value: pointsEarnedTotal.toLocaleString("en-GB"), icon: TrendingUp },
            { label: "Rewards Claimed", value: claimedCount.toString(), icon: CheckCircle2 },
            { label: "Active Rewards", value: rewardItems.filter(r => r.status === 'unclaimed').length.toString(), icon: Gift },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-3 sm:p-4 text-center transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(68,186,132,0.15)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03), 0 0 0 1px rgba(255,255,255,0.6) inset',
              }}
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(68,186,132,0.1)' }}>
                <stat.icon className="w-4 h-4" style={{ color: '#44ba84' }} />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Redeem catalogue */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full" style={{ background: '#be3144' }} />
            <h2 className="text-lg font-heading font-bold text-gray-900" data-testid="text-redeem-heading">Redeem Points</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 ml-3">Spend your prosperity points on vouchers, perks, and big-ticket rewards</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {redeemCatalogue.map((item) => {
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
                    disabled={item.id === 'prize-draw' ? (!activeDraw || balancePts < (activeDraw?.pointsPerEntry ?? 300)) : item.id === 'charity' ? (charitiesList.length === 0 || balancePts < 100) : (!canAfford || redeemGiftCardMutation.isPending)}
                    onClick={() => {
                      if (item.locked) return;
                      if (item.id === 'prize-draw') {
                        if (activeDraw) setDrawModal({ open: true, numEntries: 1 });
                        else toast.error("No active prize draw right now. Check back soon!");
                        return;
                      }
                      if (item.id === 'charity') {
                        if (charitiesList.length > 0) setCharityModal({ open: true, selectedId: charitiesList[0].id, pointsToSpend: '100' });
                        else toast.error("No charity partners available right now.");
                        return;
                      }
                      redeemGiftCardMutation.mutate({ brandKey: item.id, pointsCost: item.cost });
                    }}
                    className="mt-3 w-full px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed hover:scale-[1.02]"
                    style={{
                      color: canAfford ? '#ffffff' : '#9ca3af',
                      background: canAfford ? '#be3144' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${canAfford ? 'rgba(190,49,68,0.4)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                    data-testid={`button-redeem-${item.id}`}
                  >
                    {item.locked ? 'Locked' : item.id === 'prize-draw' ? (activeDraw ? 'Enter Draw' : 'No Active Draw') : item.id === 'charity' ? (charitiesList.length > 0 ? 'Donate' : 'Coming Soon') : redeemGiftCardMutation.isPending ? 'Redeeming…' : 'Redeem'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Refer a friend */}
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

        {/* My Redeemed Gift Cards */}
        {redeemedCards.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 rounded-full" style={{ background: '#be3144' }} />
              <h2 className="text-lg font-heading font-bold text-gray-900" data-testid="text-redeemed-cards-heading">My Gift Cards</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4 ml-3">Your redeemed gift cards — codes are saved here permanently</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {redeemedCards.map((card: any) => (
                <div
                  key={card.id}
                  className="rounded-2xl p-4"
                  style={{ background: '#ffffff', border: '1px solid rgba(190,49,68,0.2)' }}
                  data-testid={`card-redeemed-${card.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#be3144' }}>Gift Card</p>
                      <h3 className="font-heading font-bold text-sm text-gray-900">{card.brandLabel}</h3>
                    </div>
                    <span className="font-heading font-bold text-lg text-gray-900">£{Number(card.faceValue).toFixed(2)}</span>
                  </div>
                  <div className="rounded-lg p-2.5 mb-3 text-center" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
                    <p className="text-[10px] text-gray-400 mb-0.5">Code</p>
                    <p className="font-mono font-bold text-sm tracking-widest text-gray-900" data-testid={`text-redeemed-code-${card.id}`}>{card.code}</p>
                    {card.pin && <p className="text-[10px] text-gray-400 mt-0.5">PIN: <span className="font-mono font-semibold text-gray-700">{card.pin}</span></p>}
                  </div>
                  <div className="flex justify-center">
                    <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <QRCodeSVG value={card.code} size={100} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-2">Redeemed {card.pointsSpent?.toLocaleString("en-GB")} pts · {card.redeemedAt ? new Date(card.redeemedAt).toLocaleDateString("en-GB") : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: '#44ba84' }} />
            <h2 className="text-lg font-heading font-bold text-gray-900" data-testid="text-rewards-heading">Rewards History</h2>
          </div>

          {allItems.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(68,186,132,0.15)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
              data-testid="rewards-empty-state"
            >
              <Gift className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(68,186,132,0.3)' }} />
              <p className="text-gray-500 font-medium">No rewards yet</p>
              <p className="text-sm text-gray-400 mt-1">Complete journey steps to earn rewards!</p>
            </div>
          ) : (
            <div className="grid gap-2.5 w-full">
              {allItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl p-3 sm:p-4 overflow-hidden w-full transition-all duration-200 ${item.isReward ? 'cursor-pointer hover:translate-y-[-1px]' : ''}`}
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      border: '1px solid rgba(68,186,132,0.12)',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
                    }}
                    data-testid={`card-history-${item.id}`}
                    onClick={() => item.isReward ? handleRewardClick(item) : undefined}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 w-full">
                      <div className={`p-2 sm:p-2.5 rounded-xl ${item.colorClass} shrink-0`}>
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">{item.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(item.date)}</p>
                        <span className={`inline-block mt-1 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${item.statusStyle.classes}`}>
                          {item.statusStyle.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Dialog open={!!selectedReward} onOpenChange={(open) => { if (!open) { setSelectedReward(null); setCostaQrData(null); } }}>
          <DialogContent className="max-w-sm overflow-hidden p-0" style={{
            background: isCosta ? '#6d0839' : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
            backdropFilter: isCosta ? 'none' : 'blur(40px)',
            WebkitBackdropFilter: isCosta ? 'none' : 'blur(40px)',
            border: isCosta ? '2px solid rgba(255,255,255,0.15)' : '1px solid rgba(68,186,132,0.2)',
            boxShadow: isCosta ? '0 25px 60px rgba(109,8,57,0.5)' : '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.6) inset',
            borderRadius: '1.25rem',
          }}>
            {isCosta ? (
              <div className="p-6 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <Coffee className="w-5 h-5 text-white/80" />
                  <span className="text-xs font-bold text-white/60 uppercase tracking-[0.2em]">Gift Card</span>
                </div>
                <DialogHeader className="text-center space-y-0 mb-5">
                  <DialogTitle className="text-3xl font-heading font-black text-white tracking-tight">COSTA</DialogTitle>
                  <DialogDescription className="text-lg font-heading font-bold text-white/80 tracking-wide">COFFEE</DialogDescription>
                </DialogHeader>

                <div className="w-full flex flex-col items-center gap-4">
                  {costaLoading ? (
                    <div className="w-52 h-52 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.5)', borderTopColor: 'transparent' }} />
                    </div>
                  ) : costaQrData ? (
                    <div className="bg-white rounded-2xl p-4 shadow-lg">
                      <img
                        src={costaQrData}
                        alt="Costa Coffee Gift Card QR Code"
                        className="w-44 h-44 object-contain"
                        data-testid="img-costa-qr-history"
                      />
                    </div>
                  ) : (
                    <div className="w-52 h-52 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <p className="text-sm text-white/50">QR code unavailable</p>
                    </div>
                  )}
                  <p className="text-xs text-white/50 text-center">Scan at any Costa Coffee location</p>
                </div>

                <div className="flex gap-3 w-full mt-4">
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' }}
                    onClick={() => {
                      if (selectedReward && !selectedReward.notification?.read) dismissMutation.mutate(selectedReward.rawId);
                      setSelectedReward(null);
                      setCostaQrData(null);
                    }}
                    data-testid="button-reward-dismiss"
                  >
                    Dismiss
                  </button>
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                    style={{ background: 'rgba(255,255,255,0.95)', color: '#6d0839' }}
                    onClick={() => { setSelectedReward(null); setCostaQrData(null); }}
                    data-testid="button-reward-claimed"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #44ba84, #2d8a5e)', borderRadius: '0.75rem' }} />
                  <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '0.75rem' }}>
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
                          <Star className="w-3 h-3 text-white/30" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-white/25" />
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

                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="p-4 rounded-2xl" style={{ background: 'rgba(68,186,132,0.04)', border: '1px solid rgba(68,186,132,0.12)' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=UPROSPER-REWARD-${selectedReward?.rawId}-${Date.now()}`}
                      alt="Reward QR Code"
                      className="w-48 h-48"
                      data-testid="img-reward-qr-history"
                    />
                  </div>
                  <p className="text-xs text-gray-400">Show this QR code to redeem your reward</p>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      color: '#1a7a5c',
                      border: '1px solid rgba(68,186,132,0.3)',
                      background: 'rgba(68,186,132,0.04)',
                    }}
                    onClick={() => {
                      if (selectedReward && !selectedReward.notification?.read) dismissMutation.mutate(selectedReward.rawId);
                      setSelectedReward(null);
                      setCostaQrData(null);
                    }}
                    data-testid="button-reward-dismiss"
                  >
                    Dismiss
                  </button>
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                    style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                    onClick={() => { setSelectedReward(null); setCostaQrData(null); }}
                    data-testid="button-reward-claimed"
                  >
                    Awesome!
                  </button>
                </div>
              </div>
            )}
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
                  <p className="font-mono font-bold text-lg tracking-widest text-gray-900" data-testid="text-gift-card-code-modal">{redeemModal.card.code}</p>
                  {redeemModal.card.pin && (
                    <p className="text-xs text-gray-500 mt-1">PIN: <span className="font-mono font-semibold text-gray-700">{redeemModal.card.pin}</span></p>
                  )}
                </div>
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <QRCodeSVG value={redeemModal.card.code} size={160} />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 text-center">Your code is saved below in My Gift Cards.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrTrackingUrl)}`}
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
                href={qrTrackingUrl}
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

        {/* ── Prize Draw Modal ── */}
        <Dialog open={drawModal.open} onOpenChange={(open) => !open && setDrawModal({ open: false, numEntries: 1 })}>
          <DialogContent className="max-w-sm rounded-2xl" style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-gray-900 text-center flex items-center justify-center gap-2">
                <Ticket className="w-5 h-5 text-violet-600" /> Enter Prize Draw
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 text-center">
                {activeDraw ? activeDraw.prize : ''}
              </DialogDescription>
            </DialogHeader>
            {activeDraw && (
              <div className="space-y-4 pt-2">
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 mb-1">Prize</p>
                  <p className="font-bold text-gray-900">{activeDraw.prize}</p>
                  {activeDraw.drawDate && (
                    <p className="text-xs text-muted-foreground mt-1">Draw: {new Date(activeDraw.drawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  )}
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <p className="text-xs text-gray-500 mb-2 text-center">{Number(activeDraw.pointsPerEntry).toLocaleString('en-GB')} pts per entry</p>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={() => setDrawModal(m => ({ ...m, numEntries: Math.max(1, m.numEntries - 1) }))}
                      disabled={drawModal.numEntries <= 1}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold transition-all disabled:opacity-40"
                      style={{ background: 'rgba(139,92,246,0.1)', color: '#7c3aed' }}
                      data-testid="button-draw-entries-minus"
                    >−</button>
                    <span className="font-heading font-bold text-2xl text-gray-900 w-10 text-center" data-testid="text-draw-entries">{drawModal.numEntries}</span>
                    <button
                      onClick={() => setDrawModal(m => ({ ...m, numEntries: m.numEntries + 1 }))}
                      disabled={activeDraw.maxEntriesPerClient ? drawModal.numEntries >= activeDraw.maxEntriesPerClient : false}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold transition-all disabled:opacity-40"
                      style={{ background: 'rgba(139,92,246,0.1)', color: '#7c3aed' }}
                      data-testid="button-draw-entries-plus"
                    >+</button>
                  </div>
                  <p className="text-center mt-2 text-sm font-semibold text-gray-700">
                    Total: <span style={{ color: '#7c3aed' }}>{(drawModal.numEntries * Number(activeDraw.pointsPerEntry)).toLocaleString('en-GB')} pts</span>
                  </p>
                  {(drawModal.numEntries * Number(activeDraw.pointsPerEntry)) > balancePts && (
                    <p className="text-center text-xs text-red-500 mt-1">Not enough points</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDrawModal({ open: false, numEntries: 1 })}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{ background: 'rgba(0,0,0,0.04)', color: '#6b7280' }}
                    data-testid="button-draw-cancel-modal"
                  >Cancel</button>
                  <button
                    onClick={() => enterDrawMutation.mutate({ drawId: activeDraw.id, numEntries: drawModal.numEntries })}
                    disabled={enterDrawMutation.isPending || (drawModal.numEntries * Number(activeDraw.pointsPerEntry)) > balancePts}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                    style={{ background: '#7c3aed' }}
                    data-testid="button-draw-confirm"
                  >
                    {enterDrawMutation.isPending ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" />Entering…</span> : '🎟️ Enter Draw'}
                  </button>
                </div>
                {activeDraw.myEntries > 0 && (
                  <p className="text-center text-xs text-violet-600">You already have {activeDraw.myEntries} entr{activeDraw.myEntries !== 1 ? 'ies' : 'y'} in this draw</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Charity Donation Modal ── */}
        <Dialog open={charityModal.open} onOpenChange={(open) => !open && setCharityModal({ open: false, selectedId: null, pointsToSpend: '100' })}>
          <DialogContent className="max-w-sm rounded-2xl" style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-gray-900 text-center flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 text-red-500" /> Donate to Charity
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 text-center">
                Turn your points into a real charitable donation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {charitiesList.length > 1 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Choose a charity</p>
                  <div className="space-y-1.5">
                    {charitiesList.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => setCharityModal(m => ({ ...m, selectedId: c.id }))}
                        className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all"
                        style={{ background: charityModal.selectedId === c.id ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.025)', border: `1px solid ${charityModal.selectedId === c.id ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.06)'}` }}
                        data-testid={`button-charity-pick-${c.id}`}
                      >
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.name} className="w-7 h-7 rounded-lg object-contain shrink-0" />
                        ) : (
                          <Heart className="w-5 h-5 text-red-400 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">{c.pointsPerPound} pts = £1</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(() => {
                const selected = charitiesList.find((c: any) => c.id === charityModal.selectedId);
                const pts = Math.max(0, Number(charityModal.pointsToSpend) || 0);
                const poundValue = selected ? (pts / Number(selected.pointsPerPound)).toFixed(2) : '0.00';
                return (
                  <>
                    <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Points to donate</p>
                      <input
                        type="number"
                        min="1"
                        step="50"
                        value={charityModal.pointsToSpend}
                        onChange={e => setCharityModal(m => ({ ...m, pointsToSpend: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2 text-sm font-semibold border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                        data-testid="input-charity-points"
                      />
                      <div className="flex justify-between items-center mt-1.5 text-xs text-gray-500">
                        <span>Balance: {balancePts.toLocaleString('en-GB')} pts</span>
                        <span className="font-semibold" style={{ color: '#ef4444' }}>≈ £{poundValue}</span>
                      </div>
                      {pts > balancePts && <p className="text-xs text-red-500 mt-1">Exceeds your balance</p>}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCharityModal({ open: false, selectedId: null, pointsToSpend: '100' })}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium"
                        style={{ background: 'rgba(0,0,0,0.04)', color: '#6b7280' }}
                        data-testid="button-charity-cancel"
                      >Cancel</button>
                      <button
                        onClick={() => { if (charityModal.selectedId && pts > 0 && pts <= balancePts) donateCharityMutation.mutate({ charityId: charityModal.selectedId, pointsDonated: pts }); }}
                        disabled={donateCharityMutation.isPending || !charityModal.selectedId || pts <= 0 || pts > balancePts}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                        style={{ background: '#ef4444' }}
                        data-testid="button-charity-confirm"
                      >
                        {donateCharityMutation.isPending ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" />Donating…</span> : '❤️ Donate'}
                      </button>
                    </div>
                  </>
                );
              })()}
              {myDonations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">My previous donations</p>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {myDonations.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(0,0,0,0.03)' }} data-testid={`row-my-donation-${d.id}`}>
                        <span className="text-gray-700 font-medium">{d.charityName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{Number(d.pointsDonated).toLocaleString('en-GB')} pts</span>
                          <span className={`px-1.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${d.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{d.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Broker Gift Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(68,186,132,0.12)' }}
          data-testid="section-broker-rewards"
        >
          <div className="px-5 py-4 border-b border-gray-100/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(68,186,132,0.12)' }}>
                <Gift className="h-4 w-4" style={{ color: '#44ba84' }} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-gray-900">Gift Cards from Your Broker</h3>
                <p className="text-xs text-muted-foreground">
                  {brokerRewards.length > 0
                    ? `${brokerRewards.length} gift card${brokerRewards.length !== 1 ? 's' : ''} sent to you`
                    : 'Gift cards your broker sends you will appear here'}
                </p>
              </div>
            </div>
          </div>
          {brokerRewards.length === 0 ? (
            <div className="py-10 text-center" data-testid="empty-broker-rewards">
              <Gift className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm text-muted-foreground">No gift cards yet</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Your broker can send Amazon, Starbucks or M&S gift cards as a goodwill gesture</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100/60">
              {brokerRewards.map((r: any) => {
                const brand = BROKER_REWARD_BRAND_LABELS[r.brand] || { label: r.brand, icon: '🎁' };
                return (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-4" data-testid={`row-broker-reward-${r.id}`}>
                    <span className="text-2xl">{brand.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{brand.label} Gift Card</p>
                      <p className="text-xs text-muted-foreground">
                        £{Number(r.valueGbp).toFixed(2)} · {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${r.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' : r.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                      data-testid={`status-broker-reward-${r.id}`}
                    >
                      {r.status === 'fulfilled' ? '✓ Delivered' : r.status === 'sent' ? 'On its way' : 'Processing'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

      </div>
    </Shell>
  );
}
