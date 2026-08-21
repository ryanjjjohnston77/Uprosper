import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag, Sparkles, Truck, Home, Sofa, Plane, Hotel, Ship,
  Hammer, Lamp, Wrench, Flower2, PaintBucket, Gift, Tag,
  type LucideIcon,
} from "lucide-react";

export type DealTab = "homeware" | "leisure";

export interface AffiliateDeal {
  id: string;
  storeName: string;
  category: string;
  tab: DealTab;
  iconKey: string;
  logoUrl: string;
  logoFallback: string;
  dealTitle: string;
  dealDescription: string;
  discountCode: string | null;
  cashbackRate: string;
  expiryDate: string;
  accentColor: string;
  accentBg: string;
  status?: string;
  sortOrder?: number;
  trackingUrl?: string;
  clicks7d?: number;
  clicks30d?: number;
}

export const DEAL_ICON_REGISTRY: Record<string, LucideIcon> = {
  ShoppingBag, Sparkles, Truck, Home, Sofa, Plane, Hotel, Ship,
  Hammer, Lamp, Wrench, Flower2, PaintBucket, Gift, Tag,
};

export const DEAL_ICON_KEYS = Object.keys(DEAL_ICON_REGISTRY);

export function iconFor(key: string | undefined | null): LucideIcon {
  if (key && DEAL_ICON_REGISTRY[key]) return DEAL_ICON_REGISTRY[key];
  return ShoppingBag;
}

export function trackingUrlFor(dealId: string): string {
  return `/api/marketplace/click/${encodeURIComponent(dealId)}`;
}

export function useAffiliateDeals() {
  return useQuery<AffiliateDeal[]>({
    queryKey: ["affiliate-deals"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/deals", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60_000,
  });
}
