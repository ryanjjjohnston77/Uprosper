import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Star, PartyPopper, Clock, Coffee, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import type { Notification } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface RewardsSectionProps {
  notifications: Notification[];
  clientId: number;
}

const pastelStyles = [
  { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', iconBg: 'rgba(251,191,36,0.12)', accent: '#f59e0b', label: 'Reward' },
  { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', iconBg: 'rgba(59,130,246,0.12)', accent: '#3b82f6', label: 'Reward' },
  { bg: 'rgba(68,186,132,0.08)', border: 'rgba(68,186,132,0.2)', iconBg: 'rgba(68,186,132,0.12)', accent: '#44ba84', label: 'Reward' },
  { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)', iconBg: 'rgba(168,85,247,0.12)', accent: '#a855f7', label: 'Reward' },
  { bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', iconBg: 'rgba(244,63,94,0.12)', accent: '#f43f5e', label: 'Reward' },
];

const costaStyle = { bg: 'rgba(109,8,57,0.06)', border: 'rgba(109,8,57,0.2)', iconBg: 'rgba(109,8,57,0.1)', accent: '#6d0839', label: 'Costa Coffee' };

export function CostaFlipCard({ notif, clientId, onDismiss }: { notif: { id: number; message?: string | null; type: string }; clientId: number; onDismiss: (id: number) => void }) {
  const [flipped, setFlipped] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFlip = async () => {
    if (flipped) return;
    setFlipped(true);
    if (qrData) return;
    setLoading(true);
    try {
      const stepTitle = notif.message?.match(/completing "(.+?)"/)?.[1] || '';
      const res = await fetch(`/api/client/reward-qr/${clientId}/${encodeURIComponent(stepTitle)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setQrData(data.qrCodeData);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleClose = () => setFlipped(false);

  return (
    <>
      <div
        className="relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group overflow-hidden"
        style={{
          background: '#6d0839',
          boxShadow: '0 4px 20px rgba(109,8,57,0.3), 0 0 0 1px rgba(255,255,255,0.08) inset',
        }}
        data-testid={`reward-card-${notif.id}`}
        onClick={handleFlip}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Coffee className="w-5 h-5 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-heading font-black text-white tracking-tight mb-0.5">COSTA</h3>
        <h4 className="text-lg font-heading font-bold text-white/90 tracking-wide mb-3">COFFEE</h4>
        <p className="text-sm text-white/70 mb-4 line-clamp-2">
          {notif.message || 'Tap to view your gift card QR code'}
        </p>
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
            <Clock className="w-3 h-3" />
            Gift Card
          </div>
          <button
            className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 hover:brightness-110"
            style={{ background: 'rgba(255,255,255,0.95)', color: '#6d0839' }}
            onClick={(e) => { e.stopPropagation(); handleFlip(); }}
            data-testid={`button-claim-reward-card-${notif.id}`}
          >
            View
          </button>
        </div>
      </div>

      <AnimatePresence>
        {flipped && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
              onClick={handleClose}
            />
            <motion.div
              className="fixed z-50 flex items-center justify-center"
              style={{
                top: '50%',
                left: '50%',
                x: '-50%',
                y: '-50%',
                perspective: 1200,
              }}
              initial={{ opacity: 0, scale: 0.6, rotateX: -30, rotateY: 40, rotateZ: -8 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0, rotateZ: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotateX: 30, rotateY: -40, rotateZ: 8 }}
              transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
            >
              <motion.div
                initial={{ rotateX: -15, rotateY: 25 }}
                animate={{ rotateX: 0, rotateY: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
                className="w-[calc(100vw-3rem)] max-w-[400px] rounded-3xl overflow-hidden flex flex-col"
                style={{
                  background: 'linear-gradient(160deg, #8a0e4a 0%, #6d0839 30%, #520630 100%)',
                  boxShadow: '0 30px 80px rgba(109,8,57,0.6), 0 0 0 1px rgba(255,255,255,0.1) inset',
                  border: '2px solid rgba(255,255,255,0.12)',
                }}
              >
                <div className="pt-6 pb-2 px-6 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Coffee className="w-5 h-5 text-white/70" />
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.25em]">Gift Card</span>
                  </div>
                  <h3 className="text-4xl font-heading font-black text-white tracking-tight leading-none">COSTA</h3>
                  <h4 className="text-xl font-heading font-bold text-white/85 tracking-[0.15em] mb-1">COFFEE</h4>
                  <div className="w-16 h-[1px] rounded-full my-2" style={{ background: 'rgba(255,255,255,0.15)' }} />
                </div>

                <div className="flex-1 flex flex-col items-center px-6 pb-3">
                  {loading ? (
                    <div className="w-52 h-52 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'transparent' }} />
                    </div>
                  ) : qrData ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
                      className="bg-white rounded-2xl p-4 shadow-2xl"
                    >
                      <img
                        src={qrData}
                        alt="Costa Coffee QR Code"
                        className="w-48 h-48 object-contain"
                        data-testid={`img-costa-qr-flip-${notif.id}`}
                      />
                    </motion.div>
                  ) : (
                    <div className="w-52 h-52 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <p className="text-sm text-white/40">QR code unavailable</p>
                    </div>
                  )}
                  <p className="text-[11px] text-white/45 mt-3 text-center">Scan at any Costa Coffee location</p>
                </div>

                <div className="px-6 pb-6 pt-2 flex gap-3">
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
                    onClick={() => { onDismiss(notif.id); handleClose(); }}
                    data-testid={`button-dismiss-costa-${notif.id}`}
                  >
                    Dismiss
                  </button>
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(255,255,255,0.95)', color: '#6d0839' }}
                    onClick={handleClose}
                    data-testid={`button-done-costa-${notif.id}`}
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function RewardsSection({ notifications, clientId }: RewardsSectionProps) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedReward, setSelectedReward] = useState<Notification | null>(null);

  const rewardNotifications = (notifications || [])
    .filter(n => ['reward', 'referral_reward', 'free_coffee_reward', 'costa_reward'].includes(n.type) && !n.read)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

  return (
    <div className="space-y-6">
      <Dialog open={!!selectedReward} onOpenChange={(open) => { if (!open) setSelectedReward(null); }}>
        <DialogContent className="max-w-sm overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(68,186,132,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.6) inset',
        }}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-heading text-gray-900">
              🎉 Congratulations!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500">
              Your reward is ready to claim!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(68,186,132,0.04)', border: '1px solid rgba(68,186,132,0.12)' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=UPROSPER-REWARD-${selectedReward?.id}-${Date.now()}`}
                alt="Reward QR Code"
                className="w-48 h-48"
                data-testid="img-reward-qr"
              />
            </div>
            <p className="text-xs text-gray-400">Show this QR code to redeem your reward</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              style={{ borderColor: 'rgba(0,0,0,0.1)' }}
              onClick={() => {
                if (selectedReward) dismissMutation.mutate(selectedReward.id);
                setSelectedReward(null);
              }}
              data-testid="button-reward-dismiss"
            >
              Dismiss
            </Button>
            <Button
              className="flex-1 text-white font-semibold"
              style={{ background: '#44ba84' }}
              onClick={() => setSelectedReward(null)}
              data-testid="button-reward-claimed"
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {rewardNotifications.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(68,186,132,0.12)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03), 0 0 0 1px rgba(255,255,255,0.5) inset',
          }}
          data-testid="rewards-empty-state"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewardNotifications.map((notif, index) => {
            const isCosta = notif.type === 'costa_reward';
            const style = isCosta ? costaStyle : pastelStyles[index % pastelStyles.length];

            if (isCosta) {
              return (
                <motion.div
                  key={notif.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.08 }}
                >
                  <CostaFlipCard notif={notif} clientId={clientId} onDismiss={(id) => dismissMutation.mutate(id)} />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={notif.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.08 }}
              >
                <div
                  className="relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.85) 0%, ${style.bg} 100%)`,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${style.border}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.5) inset',
                  }}
                  data-testid={`reward-card-${notif.id}`}
                  onClick={() => setSelectedReward(notif)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: style.iconBg }}
                    >
                      {notif.type === 'referral_reward' ? (
                        <PartyPopper className="w-5 h-5" style={{ color: style.accent }} />
                      ) : (
                        <Gift className="w-5 h-5" style={{ color: style.accent }} />
                      )}
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: style.accent }}
                    >
                      {notif.type === 'referral_reward' ? 'Referral Reward' : style.label}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">Your reward is ready to claim! 🎉</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">Keep going on your prosperity journey!</p>
                  <div className="flex items-center justify-between">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                      style={{ background: style.iconBg, color: style.accent }}
                    >
                      <Clock className="w-3 h-3" />
                      Limited Time
                    </div>
                    <button
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:brightness-110"
                      style={{ background: style.accent }}
                      onClick={(e) => { e.stopPropagation(); setSelectedReward(notif); }}
                      data-testid={`button-claim-reward-card-${notif.id}`}
                    >
                      Claim
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
