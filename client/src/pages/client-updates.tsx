import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Bell, Calendar, Coffee, Home, MessageSquare, Gift, TrendingUp, ShieldCheck, Sparkles } from "lucide-react";
import { formatDistance } from "date-fns";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";

export default function ClientUpdates() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [homeInsuranceOpen, setHomeInsuranceOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [coffeeQrOpen, setCoffeeQrOpen] = useState(false);
  const [costaQrOpen, setCostaQrOpen] = useState(false);
  const [costaQrData, setCostaQrData] = useState<string | null>(null);
  const [costaLoading, setCostaLoading] = useState(false);

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

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', clientId],
    queryFn: () => api.notifications.getByClient(clientId!),
    enabled: !!clientId,
  });

  const { data: brokerMessages = [] } = useQuery({
    queryKey: ['client-broker-messages', clientId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/clients/${clientId}/messages`);
      return res.json();
    },
    enabled: !!clientId,
  });

  const allBrokerMessages = brokerMessages.filter((m: any) => m.senderType === 'broker');

  // Sort all notifications by date, newest first
  const sortedNotifications = [...notifications].sort((a: any, b: any) => {
    const rank = (n: any) => n.type === 'welcome' ? 0 : n.type === 'homeowner_discounts' ? 1 : n.type === 'free_coffee_reward' ? 1.5 : 2;
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <Bell className="w-5 h-5" />;
      case 'free_coffee_reward':
        return <Coffee className="w-5 h-5" />;
      case 'homeowner_discounts':
        return <Gift className="w-5 h-5" />;
      case 'home_insurance_referral':
        return <Home className="w-5 h-5" />;
      case 'reward':
        return <Gift className="w-5 h-5" />;
      case 'fixed_rate_ending':
        return <Bell className="w-5 h-5" />;
      case 'moving_house':
        return <Bell className="w-5 h-5" />;
      case 'mortgage_update':
        return <Bell className="w-5 h-5" />;
      case 'home_insurance':
        return <ShieldCheck className="w-5 h-5" />;
      case 'life_insurance':
        return <ShieldCheck className="w-5 h-5" />;
      case 'welcome_back':
        return <Sparkles className="w-5 h-5" />;
      case 'costa_reward':
        return <Coffee className="w-5 h-5" />;
      case 'wealth':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'welcome':
        return { bg: 'bg-primary/10', text: 'text-primary' };
      case 'welcome_back':
        return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
      case 'costa_reward':
        return { bg: 'bg-rose-50', text: 'text-[#6d0839]' };
      case 'free_coffee_reward':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'homeowner_discounts':
        return { bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'home_insurance_referral':
        return { bg: 'bg-green-100', text: 'text-green-600' };
      case 'reward':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'fixed_rate_ending':
        return { bg: 'bg-orange-100', text: 'text-orange-600' };
      case 'moving_house':
        return { bg: 'bg-orange-100', text: 'text-orange-600' };
      case 'mortgage_update':
        return { bg: 'bg-orange-100', text: 'text-orange-600' };
      case 'home_insurance':
        return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
      case 'life_insurance':
        return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
      case 'wealth':
        return { bg: 'bg-purple-100', text: 'text-purple-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (notification.type === 'welcome') {
      setWelcomeOpen(true);
    } else if (notification.type === 'homeowner_discounts') {
      setLocation('/marketplace');
    } else if (notification.type === 'free_coffee_reward') {
      setCoffeeQrOpen(true);
    } else if (notification.type === 'costa_reward') {
      setCostaQrOpen(true);
      setCostaLoading(true);
      try {
        const stepTitle = notification.message?.match(/completing "(.+?)"/)?.[1] || '';
        const res = await fetch(`/api/client/reward-qr/${client?.id}/${encodeURIComponent(stepTitle)}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCostaQrData(data.qrCodeData);
        }
      } catch {} finally {
        setCostaLoading(false);
      }
    } else if (notification.type === 'home_insurance_referral') {
      setHomeInsuranceOpen(true);
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/client")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">Updates and Rewards</h1>
            <p className="text-muted-foreground">Your notification history</p>
          </div>
        </div>

        <div className="grid gap-3">
          {/* Broker Messages */}
          {allBrokerMessages.map((message: any) => {
            const isBookingLink = message.messageType === 'booking_link' && message.meetingLink;
            const previewWords = message.content?.split(' ').slice(0, 8).join(' ') || '';
            const preview = previewWords + (message.content?.split(' ').length > 8 ? '...' : '');

            if (isBookingLink) {
              return (
                <Card
                  key={`msg-${message.id}`}
                  className={`p-4 border-none shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow ${message.read ? 'opacity-75' : ''}`}
                  data-testid={`card-booking-link-${message.id}`}
                  onClick={() => window.open(message.meetingLink, '_blank', 'noopener,noreferrer')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full text-white" style={{ background: '#a78bfa' }}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Schedule your consultation</h3>
                      <p className="text-sm text-muted-foreground">Tap to choose a time that works for you.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDistance(new Date(message.createdAt), new Date(), { addSuffix: true })}
                      </p>
                      {!message.read && (
                        <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: '#6d28d9', background: '#ede9fe' }}>
                          Book now
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            }

            return (
              <Card 
                key={`msg-${message.id}`}
                className={`p-4 border-none shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow ${message.read ? 'opacity-75' : ''}`}
                data-testid={`card-message-${message.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-900 text-white">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Message from your broker</h3>
                    <p className="text-sm text-muted-foreground">{preview}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatDistance(new Date(message.createdAt), new Date(), { addSuffix: true })}
                    </p>
                    {!message.read && (
                      <span className="inline-block mt-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {/* All Notifications from Database */}
          {sortedNotifications.map((notification: any) => {
            const style = getNotificationStyle(notification.type);
            return (
              <Card 
                key={`notif-${notification.id}`}
                className={`p-4 border-none shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow ${notification.read ? 'opacity-75' : ''}`}
                data-testid={`card-notification-${notification.id}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${style.bg} ${style.text}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatDistance(new Date(notification.createdAt), new Date(), { addSuffix: true })}
                    </p>
                    {!notification.read && (
                      <span className={`inline-block mt-1 text-xs font-medium ${style.text} ${style.bg} px-2 py-0.5 rounded-full`}>
                        New
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Empty State */}
          {sortedNotifications.length === 0 && allBrokerMessages.length === 0 && (
            <div className="px-8 py-12 text-center text-muted-foreground border border-gray-200 rounded-lg">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Home Insurance Dialog */}
      <Dialog open={homeInsuranceOpen} onOpenChange={setHomeInsuranceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Home Insurance</DialogTitle>
            <DialogDescription>
              Protect your home and belongings with comprehensive coverage.
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
              onClick={() => setHomeInsuranceOpen(false)}
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

      {/* Coffee QR Code Dialog */}
      <Dialog open={coffeeQrOpen} onOpenChange={setCoffeeQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-heading">Free Coffee Reward</DialogTitle>
            <DialogDescription className="text-center">
              Show this QR code at your local cafe to claim your free coffee.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=UPROSPER-COFFEE-2024" 
                alt="Coffee Reward QR Code"
                className="w-48 h-48"
                data-testid="img-coffee-qr"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">Valid at participating locations</p>
          </div>
          <Button 
            className="w-full"
            onClick={() => setCoffeeQrOpen(false)}
            data-testid="button-coffee-close"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={costaQrOpen} onOpenChange={(open) => { setCostaQrOpen(open); if (!open) setCostaQrData(null); }}>
        <DialogContent className="max-w-sm overflow-hidden p-0" style={{
          background: '#6d0839',
          border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: '0 25px 60px rgba(109,8,57,0.5)',
          borderRadius: '1.25rem',
        }}>
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
                    data-testid="img-costa-qr"
                  />
                </div>
              ) : (
                <div className="w-52 h-52 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <p className="text-sm text-white/50">QR code unavailable</p>
                </div>
              )}
              <p className="text-xs text-white/50 text-center">Scan at any Costa Coffee location</p>
            </div>

            <button 
              className="w-full mt-4 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
              onClick={() => { setCostaQrOpen(false); setCostaQrData(null); }}
              style={{ background: 'rgba(255,255,255,0.95)', color: '#6d0839' }}
              data-testid="button-costa-close"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Welcome to Uprosper Dialog */}
      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
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
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02]"
                style={{ background: 'rgba(68,186,132,0.1)', color: '#44ba84', border: '1px solid rgba(68,186,132,0.2)' }}
                onClick={() => {
                  setWelcomeOpen(false);
                  setLocation('/client');
                  setTimeout(() => window.dispatchEvent(new Event('start-tutorial')), 500);
                }}
                data-testid="button-welcome-tutorial"
              >
                Take a Tour
              </button>
              <button
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
                onClick={() => setWelcomeOpen(false)}
                data-testid="button-welcome-popup-close"
              >
                Let's Get Started
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </Shell>
  );
}
