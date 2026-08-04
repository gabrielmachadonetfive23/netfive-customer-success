import type { NpsCategory } from "@/lib/types";

const CATEGORY_BADGE_TONE: Record<NpsCategory, string> = {
  Promotor: "bg-emerald-500/15 text-emerald-400",
  Neutro: "bg-amber-500/15 text-amber-400",
  Detrator: "bg-netfive-red/15 text-netfive-red",
};

export function npsCategoryBadgeTone(category: NpsCategory | null): string {
  return category ? CATEGORY_BADGE_TONE[category] : "bg-netfive-overlay/[0.06] text-netfive-gray-500";
}
