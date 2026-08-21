import { useState } from "react";
import { Copy, ExternalLink, QrCode, CheckCircle2, Percent, Clock } from "lucide-react";
import { toast } from "sonner";
import type { AffiliateDeal } from "@/lib/affiliate-deals";
import { trackingUrlFor } from "@/lib/affiliate-deals";

type DealCardProps = {
  deal: AffiliateDeal;
  clientId?: number;
  onShowQR: (deal: AffiliateDeal) => void;
  variant?: "full" | "compact";
};

export function DealCard({ deal, clientId: _clientId, onShowQR, variant = "full" }: DealCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const trackingUrl = trackingUrlFor(deal.id);

  const handleCopyCode = async () => {
    if (!deal.discountCode) return;
    try {
      await navigator.clipboard.writeText(deal.discountCode);
      setCopied(true);
      toast.success("Discount code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const daysUntilExpiry = Math.ceil((new Date(deal.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (variant === "compact") {
    return (
      <div
        className="rounded-2xl p-5 flex flex-col transition-all duration-300 hover:translate-y-[-2px]"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(68,186,132,0.18)",
        }}
        data-testid={`card-deal-${deal.id}`}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: "#ffffff", border: "1px solid rgba(68,186,132,0.18)" }}
          >
            {!imgError ? (
              <img
                src={deal.logoUrl}
                alt={deal.storeName}
                className="w-8 h-8 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-2xl">{deal.logoFallback}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#0f766e" }} data-testid={`text-deal-category-${deal.id}`}>
              {deal.category}
            </p>
            <h3 className="font-heading font-bold text-gray-900 truncate" data-testid={`text-deal-store-${deal.id}`}>
              {deal.storeName}
            </h3>
          </div>
          <span
            className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ background: "rgba(68,186,132,0.12)", color: "#0f766e", border: "1px solid rgba(68,186,132,0.25)" }}
            data-testid={`pill-cashback-${deal.id}`}
          >
            {deal.cashbackRate}
          </span>
        </div>

        <p className="text-sm text-gray-700 mt-3 font-semibold" data-testid={`text-deal-title-${deal.id}`}>
          {deal.dealTitle}
        </p>
        <p className="text-sm text-gray-600 mt-1 flex-1 line-clamp-2">{deal.dealDescription}</p>

        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:brightness-110"
          style={{ background: "#44ba84", border: "1px solid rgba(68,186,132,0.25)" }}
          data-testid={`button-shop-now-${deal.id}`}
        >
          Shop Now <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <p className="text-[11px] text-gray-500 mt-3 leading-snug">
          Affiliate partner — Uprosper may earn a commission at no extra cost to you.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(68,186,132,0.15)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.6) inset',
      }}
      data-testid={`card-deal-${deal.id}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: deal.accentBg, border: `1px solid ${deal.accentColor}20` }}
          >
            {!imgError ? (
              <img
                src={deal.logoUrl}
                alt={deal.storeName}
                className="w-8 h-8 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-2xl">{deal.logoFallback}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm" data-testid={`text-deal-store-${deal.id}`}>{deal.storeName}</h3>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: deal.accentBg, color: deal.accentColor }}
              >
                {deal.category}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(68,186,132,0.12)", color: "#0f766e", border: "1px solid rgba(68,186,132,0.25)" }}
                data-testid={`pill-cashback-${deal.id}`}
              >
                {deal.cashbackRate}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800" data-testid={`text-deal-title-${deal.id}`}>{deal.dealTitle}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3 leading-relaxed">{deal.dealDescription}</p>

        {deal.discountCode && (
          <div className="mb-3">
            <button
              onClick={handleCopyCode}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'rgba(68,186,132,0.06)',
                border: '1px dashed rgba(68,186,132,0.35)',
              }}
              data-testid={`button-copy-code-${deal.id}`}
            >
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-mono font-bold text-sm tracking-wider" style={{ color: '#2d8a5e' }}>
                  {deal.discountCode}
                </span>
              </div>
              {copied ? (
                <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#44ba84' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Copied
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </span>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 8px rgba(68,186,132,0.25)' }}
            data-testid={`button-shop-now-${deal.id}`}
          >
            Shop Now <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => onShowQR(deal)}
            className="p-2.5 rounded-xl transition-all duration-200 hover:scale-[1.05]"
            style={{
              background: 'rgba(68,186,132,0.08)',
              border: '1px solid rgba(68,186,132,0.2)',
            }}
            data-testid={`button-qr-${deal.id}`}
          >
            <QrCode className="w-4 h-4" style={{ color: '#44ba84' }} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-3">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-[11px] text-gray-400">
            {daysUntilExpiry > 0 ? `Expires in ${daysUntilExpiry} days` : 'Expired'}
          </span>
        </div>
      </div>
    </div>
  );
}
