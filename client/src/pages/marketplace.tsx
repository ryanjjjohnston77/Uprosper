import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Search, Sofa, Hammer, Flower2, Lamp, ShoppingBag, Sparkles, PaintBucket, Wrench,
  ShieldCheck, HeartPulse, Scale, Briefcase, ExternalLink, Info, Send, Check, Loader2,
  Plane, Hotel, Ship, Home as HomeIcon, Shield as ShieldIcon,
} from "lucide-react";
import { useAffiliateDeals, iconFor, type AffiliateDeal } from "@/lib/affiliate-deals";

const NOTE_MAX_LENGTH = 280;

type Pastel = { bg: string; border: string; text: string };

const pastels: Record<string, Pastel> = {
  emerald: { bg: "rgba(209,250,229,0.5)", border: "rgba(16,185,129,0.18)", text: "#047857" },
  blue:    { bg: "rgba(219,234,254,0.5)", border: "rgba(59,130,246,0.18)", text: "#1d4ed8" },
  amber:   { bg: "rgba(254,243,199,0.5)", border: "rgba(245,158,11,0.18)", text: "#b45309" },
  violet:  { bg: "rgba(237,233,254,0.5)", border: "rgba(139,92,246,0.18)", text: "#6d28d9" },
  rose:    { bg: "rgba(255,228,230,0.5)", border: "rgba(244,63,94,0.18)", text: "#be123c" },
  cyan:    { bg: "rgba(207,250,254,0.5)", border: "rgba(6,182,212,0.18)",  text: "#0e7490" },
  teal:    { bg: "rgba(204,251,241,0.5)", border: "rgba(20,184,166,0.18)", text: "#0f766e" },
  sky:     { bg: "rgba(224,242,254,0.5)", border: "rgba(14,165,233,0.18)", text: "#0369a1" },
};

type Store = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: typeof Sofa;
  bg: string;
  border: string;
  text: string;
};

function dealToStore(d: AffiliateDeal): Store {
  return {
    id: d.id,
    name: d.storeName,
    category: d.category,
    description: d.dealDescription,
    icon: iconFor(d.iconKey),
    bg: d.accentBg || "rgba(229,231,235,0.5)",
    border: `${d.accentColor || "#374151"}33`,
    text: d.accentColor || "#374151",
  };
}

type Partner = {
  name: string;
  category: string;
  description: string;
  icon: typeof ShieldCheck;
  pastel: keyof typeof pastels;
};

const protectionPartners: Partner[] = [
  { name: "Home Insurance Partner",  category: "Home Insurance",  description: "Buildings & contents cover from authorised providers.", icon: ShieldCheck, pastel: "emerald" },
  { name: "Life Cover Partner",      category: "Life Insurance",  description: "Term life and family protection from authorised insurers.", icon: HeartPulse, pastel: "rose" },
  { name: "Wealth Advice Partner",   category: "Wealth & Investments", description: "Independent advisers for long-term financial planning.", icon: Scale, pastel: "blue" },
  { name: "Estate Planning Partner", category: "Wills & Estate Planning", description: "Authorised legal professionals for wills and estate planning.", icon: Briefcase, pastel: "violet" },
];

export default function Marketplace() {
  const [tab, setTab] = useState<"homeware" | "financial" | "leisure">("homeware");
  const [query, setQuery] = useState("");
  const [sentProductTypes, setSentProductTypes] = useState<Set<string>>(new Set());
  const [pendingProductType, setPendingProductType] = useState<string | null>(null);
  const [noteDialogProductType, setNoteDialogProductType] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const { user } = useAuth();

  const { data: client } = useQuery<{ id: number; brokerUserId: string | null } | null>({
    queryKey: ["client-me"],
    queryFn: async () => {
      const res = await fetch("/api/client/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user && user.role === "client",
  });

  const enquiryMutation = useMutation({
    mutationFn: async ({ productType, note }: { productType: string; note: string }) => {
      if (!client?.id) throw new Error("missing-client");
      const res = await apiRequest("POST", "/api/enquiries", {
        clientId: client.id,
        productType,
        note: note.trim() ? note.trim() : undefined,
      });
      return res.json();
    },
    onMutate: ({ productType }) => {
      setPendingProductType(productType);
    },
    onSuccess: (_data, { productType }) => {
      setSentProductTypes((prev) => {
        const next = new Set(prev);
        next.add(productType);
        return next;
      });
      toast.success("Your broker has received your enquiry and will be in touch.");
      setNoteDialogProductType(null);
      setNoteDraft("");
    },
    onError: () => {
      toast.error("Failed to send enquiry. Please try again.");
    },
    onSettled: () => {
      setPendingProductType(null);
    },
  });

  const handleContactBroker = (productType: string) => {
    if (!user) {
      toast.error("Please sign in to contact your broker.");
      return;
    }
    if (user.role !== "client") {
      toast.error("Only client accounts can send broker enquiries.");
      return;
    }
    if (!client) {
      toast.error("Loading your profile — please try again in a moment.");
      return;
    }
    if (!client.brokerUserId) {
      toast.error("No broker is assigned to your profile yet.");
      return;
    }
    if (sentProductTypes.has(productType) || pendingProductType === productType) return;
    setNoteDraft("");
    setNoteDialogProductType(productType);
  };

  const handleSendEnquiry = () => {
    if (!noteDialogProductType) return;
    if (noteDraft.length > NOTE_MAX_LENGTH) return;
    enquiryMutation.mutate({ productType: noteDialogProductType, note: noteDraft });
  };

  const isSendingNote =
    !!noteDialogProductType && pendingProductType === noteDialogProductType;

  const filterStores = (list: Store[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
    );
  };

  const { data: deals = [] } = useAffiliateDeals();
  const homewareStores = useMemo(() => deals.filter(d => d.tab === "homeware").map(dealToStore), [deals]);
  const leisureStores  = useMemo(() => deals.filter(d => d.tab === "leisure").map(dealToStore),  [deals]);
  const filteredHomeware = useMemo(() => filterStores(homewareStores), [query, homewareStores]);
  const filteredLeisure  = useMemo(() => filterStores(leisureStores),  [query, leisureStores]);

  const filteredPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return protectionPartners;
    return protectionPartners.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }, [query]);

  const renderStoreGrid = (stores: Store[], emptyTestId: string) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stores.map((store) => {
          const p = { bg: store.bg, border: store.border, text: store.text };
          const Icon = store.icon;
          const slug = store.id;
          return (
            <div
              key={store.id}
              className="rounded-2xl p-5 flex flex-col"
              style={{ background: p.bg, border: `1px solid ${p.border}` }}
              data-testid={`card-store-${slug}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#ffffff", border: `1px solid ${p.border}` }}
                >
                  <Icon className="w-6 h-6" style={{ color: p.text }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: p.text }}>{store.category}</p>
                  <h3 className="font-heading font-bold text-gray-900 truncate">{store.name}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 flex-1">{store.description}</p>
              <a
                href={`/api/marketplace/click/${store.id}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:brightness-110"
                style={{ background: "#44ba84", border: "1px solid rgba(68,186,132,0.25)" }}
                data-testid={`button-shop-${slug}`}
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
      {stores.length === 0 && (
        <div
          className="rounded-2xl p-6 text-center text-sm text-gray-500"
          style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}
          data-testid={emptyTestId}
        >
          No stores match your search.
        </div>
      )}
    </>
  );

  const tabs = [
    { id: "homeware" as const,  shortLabel: "Home",      fullLabel: "Home & Lifestyle",     icon: HomeIcon,    activeBg: "rgba(68,186,132,0.12)", activeColor: "#0f766e", activeBorder: "rgba(68,186,132,0.2)" },
    { id: "financial" as const, shortLabel: "Protect",   fullLabel: "Finance & Protection", icon: ShieldIcon,  activeBg: "rgba(59,130,246,0.1)",  activeColor: "#1d4ed8", activeBorder: "rgba(59,130,246,0.2)" },
    { id: "leisure" as const,   shortLabel: "Travel",    fullLabel: "Leisure & Travel",     icon: Plane,       activeBg: "rgba(14,165,233,0.1)",  activeColor: "#0369a1", activeBorder: "rgba(14,165,233,0.2)" },
  ];

  return (
    <Shell>
      <div className="space-y-6 pb-12" data-testid="page-marketplace">
        {/* Hero */}
        <div
          className="rounded-2xl p-6 md:p-8"
          style={{ background: "rgba(209,250,229,0.45)", border: "1px solid rgba(68,186,132,0.18)" }}
          data-testid="marketplace-hero"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(68,186,132,0.12)", border: "1px solid rgba(68,186,132,0.18)" }}
            >
              <ShoppingBag className="w-6 h-6" style={{ color: "#44ba84" }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900" data-testid="text-marketplace-title">
                Marketplace — Save on Your Home
              </h1>
              <p className="text-sm md:text-base mt-1" style={{ color: "#0f766e" }}>
                Discover ways to save on your home and protect what matters.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores or categories..."
              className="w-full pl-10 pr-4 h-11 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-200"
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}
              data-testid="input-marketplace-search"
            />
          </div>
        </div>

        {/* Tabs — mobile: horizontal-scroll snap with icon + short label; desktop: full labels */}
        <div
          className="flex p-1 rounded-2xl overflow-x-auto snap-x snap-mandatory gap-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ background: "#ffffff", border: "1px solid rgba(68,186,132,0.18)" }}
          role="tablist"
          data-testid="marketplace-tabs"
        >
          {tabs.map((t) => {
            const TabIcon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className="flex-1 min-w-[7.5rem] sm:min-w-0 snap-start px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                style={
                  active
                    ? { background: t.activeBg, color: t.activeColor, border: `1px solid ${t.activeBorder}` }
                    : { background: "transparent", color: "#6b7280", border: "1px solid transparent" }
                }
                data-testid={`tab-${t.id}`}
              >
                <TabIcon className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">{t.shortLabel}</span>
                <span className="hidden sm:inline">{t.fullLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Homeware Section */}
        {tab === "homeware" && (
          <section className="space-y-4" data-testid="section-homeware">
            <div>
              <h2 className="text-lg font-heading font-bold text-gray-900">Everyday Home & Lifestyle</h2>
              <p className="text-sm text-gray-600 mt-1">
                Curated deals on home improvement, furniture, garden and everyday essentials.
              </p>
            </div>
            {renderStoreGrid(filteredHomeware, "empty-homeware")}
          </section>
        )}

        {/* Leisure & Travel Section */}
        {tab === "leisure" && (
          <section className="space-y-4" data-testid="section-leisure">
            <div>
              <h2 className="text-lg font-heading font-bold text-gray-900">Leisure & Travel</h2>
              <p className="text-sm text-gray-600 mt-1">
                Cashback on flights, hotels, package holidays and weekend getaways from trusted travel partners.
              </p>
            </div>
            {renderStoreGrid(filteredLeisure, "empty-leisure")}
          </section>
        )}

        {/* Financial / Protection Section */}
        {tab === "financial" && (
          <section className="space-y-4" data-testid="section-financial">
            <div>
              <h2 className="text-lg font-heading font-bold text-gray-900">Finance & protection options from your broker</h2>
              <p className="text-sm text-gray-600 mt-1">
                Regulated services are provided by your authorised broker, not Uprosper.
              </p>
            </div>

            {/* Disclosure block */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(254,243,199,0.45)", border: "1px solid rgba(245,158,11,0.22)" }}
              data-testid="protection-disclosure"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.22)" }}
                >
                  <Info className="w-5 h-5" style={{ color: "#b45309" }} />
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-gray-900">Your broker can make introductions to FCA regulated providers</span>{" "}
                    for home insurance, life insurance, and wealth advice.
                  </p>
                  <p>Uprosper provides software tools only. No advice, arranging, or dealing is provided by Uprosper.</p>
                  <p>All decisions and regulated advice are the responsibility of your authorised broker.</p>
                </div>
              </div>
            </div>

            {/* Partner cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPartners.map((partner) => {
                const p = pastels[partner.pastel];
                const Icon = partner.icon;
                return (
                  <div
                    key={partner.name}
                    className="rounded-2xl p-5 flex flex-col"
                    style={{ background: p.bg, border: `1px solid ${p.border}` }}
                    data-testid={`card-partner-${partner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#ffffff", border: `1px solid ${p.border}` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: p.text }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: p.text }}>{partner.category}</p>
                        <h3 className="font-heading font-bold text-gray-900 truncate">{partner.name}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 flex-1">{partner.description}</p>
                    {(() => {
                      const isSent = sentProductTypes.has(partner.category);
                      const isPending = pendingProductType === partner.category;
                      const isDisabled = isSent || isPending;
                      const slug = partner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return (
                        <button
                          type="button"
                          onClick={() => handleContactBroker(partner.category)}
                          disabled={isDisabled}
                          className="mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:brightness-110 disabled:opacity-80 disabled:hover:scale-100 disabled:hover:brightness-100 disabled:cursor-default"
                          style={{
                            background: isSent ? "#16a34a" : "#3b82f6",
                            border: isSent
                              ? "1px solid rgba(22,163,74,0.25)"
                              : "1px solid rgba(59,130,246,0.25)",
                          }}
                          data-testid={`button-contact-broker-${slug}`}
                          aria-label={
                            isSent
                              ? `Enquiry sent for ${partner.category}`
                              : `Contact broker about ${partner.category}`
                          }
                        >
                          {isSent ? (
                            <>Enquiry Sent <Check className="w-3.5 h-3.5" /></>
                          ) : isPending ? (
                            <>Sending… <Loader2 className="w-3.5 h-3.5 animate-spin" /></>
                          ) : (
                            <>Contact Broker <Send className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      );
                    })()}
                    <p className="text-[11px] text-gray-500 mt-3 leading-snug">
                      Provided by your authorised broker. Uprosper does not give advice.
                    </p>
                  </div>
                );
              })}
            </div>

            {filteredPartners.length === 0 && (
              <div
                className="rounded-2xl p-6 text-center text-sm text-gray-500"
                style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}
                data-testid="empty-partners"
              >
                No partners match your search.
              </div>
            )}

            <p className="text-xs text-gray-500 leading-relaxed">
              All commercial arrangements are disclosed in our Terms &amp; Conditions and Privacy Policy.
              Communications are designed to be fair, clear and not misleading.
            </p>
          </section>
        )}

        {/* Contact Broker Note Dialog */}
        <Dialog
          open={!!noteDialogProductType}
          onOpenChange={(open) => {
            if (!open && !isSendingNote) {
              setNoteDialogProductType(null);
              setNoteDraft("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md bg-white" data-testid="dialog-contact-broker-note">
            <DialogHeader>
              <DialogTitle className="text-lg font-heading font-bold text-gray-900">
                Contact your broker about {noteDialogProductType}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a short note to give your broker some context — for example, "we're moving in August" or "renewal due next month". This is optional.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-2">
              <Label htmlFor="enquiry-note" className="text-sm font-medium text-gray-700">
                Note (optional)
              </Label>
              <Textarea
                id="enquiry-note"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value.slice(0, NOTE_MAX_LENGTH))}
                placeholder="Anything your broker should know? (optional)"
                maxLength={NOTE_MAX_LENGTH}
                rows={4}
                className="bg-gray-50 border-gray-200"
                data-testid="textarea-enquiry-note"
              />
              <div className="flex justify-end">
                <span
                  className={`text-xs ${noteDraft.length >= NOTE_MAX_LENGTH ? "text-rose-600" : "text-gray-500"}`}
                  data-testid="text-note-char-count"
                >
                  {noteDraft.length}/{NOTE_MAX_LENGTH}
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={isSendingNote}
                onClick={() => {
                  setNoteDialogProductType(null);
                  setNoteDraft("");
                }}
                data-testid="button-cancel-enquiry"
              >
                Cancel
              </Button>
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:brightness-110 disabled:opacity-70 disabled:hover:scale-100 disabled:hover:brightness-100 disabled:cursor-not-allowed"
                style={{ background: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}
                disabled={isSendingNote}
                onClick={handleSendEnquiry}
                data-testid="button-send-enquiry"
              >
                {isSendingNote ? (
                  <>Sending… <Loader2 className="w-4 h-4 animate-spin" /></>
                ) : (
                  <>Send Enquiry <Send className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footer disclaimer */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}
          data-testid="marketplace-footer-disclaimer"
        >
          <p className="text-xs text-gray-500 leading-relaxed">
            Uprosper is not authorised to provide regulated financial advice. For regulated products,
            please speak to your mortgage broker or an authorised adviser. We support Consumer Duty by
            delivering fair value and good customer outcomes.
          </p>
        </div>
      </div>
    </Shell>
  );
}
