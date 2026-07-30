import {
  Utensils,
  ShoppingBag,
  Car,
  Fuel,
  Wrench,
  Shield,
  FileCheck,
  Home,
  Zap,
  Phone,
  Smartphone,
  Wifi,
  HeartPulse,
  Film,
  Plane,
  Gift,
  Briefcase,
  GraduationCap,
  HelpCircle,
  PiggyBank,
  Tag,
  Coffee,
  Smile,
  Tv,
  Droplets,
  Flame,
  Cylinder,
  CreditCard,
  User,
  Users,
  Receipt,
  Building,
} from "lucide-react";

export const AVAILABLE_ICONS: { [key: string]: any } = {
  Utensils,
  ShoppingBag,
  Car,
  Fuel,
  Wrench,
  Shield,
  FileCheck,
  Home,
  Zap,
  Phone,
  Smartphone,
  Wifi,
  HeartPulse,
  Film,
  Plane,
  Gift,
  Briefcase,
  GraduationCap,
  HelpCircle,
  PiggyBank,
  Tag,
  Coffee,
  Smile,
  Tv,
  Droplets,
  Flame,
  Cylinder,
  CreditCard,
  User,
  Users,
  Receipt,
  Building,
};

export const CATEGORY_ICON_MAP: { keywords: string[]; icon: any }[] = [
  { keywords: ["mobile recharge", "recharge", "jio", "airtel", "sim"], icon: Smartphone },
  { keywords: ["wifi", "internet", "broadband", "router", "fiber"], icon: Wifi },
  { keywords: ["subscriptions", "subscription", "ott", "dth", "tv", "netflix", "hotstar", "prime", "sonyliv"], icon: Tv },
  { keywords: ["water", "pani"], icon: Droplets },
  { keywords: ["gas cylinder refill", "gas cylinder", "cylinder", "lpg", "gas", "refill", "gas refill", "tank", "cylinder gas", "hp gas", "indane", "bharat gas"], icon: Cylinder },
  { keywords: ["flame", "fire", "stove"], icon: Flame },
  { keywords: ["emi", "loan"], icon: CreditCard },
  { keywords: ["light bill", "electricity", "power"], icon: Zap },
  { keywords: ["rent", "ghar bhada", "ghar patti", "property tax"], icon: Home },
  { keywords: ["nashta", "dinner", "food", "khana", "hotel", "restaurant", "dining", "snack", "tea", "coffee"], icon: Utensils },
  { keywords: ["bhaji", "mandai", "vegetables", "sabzi", "grocery", "kirana", "dudh", "milk", "nonveg", "chicken", "mutton", "eggs", "fish"], icon: ShoppingBag },
  { keywords: ["petrol", "fuel", "diesel"], icon: Fuel },
  { keywords: ["vehicle", "car", "bike", "servicing", "service", "repair", "maintenance", "alto"], icon: Wrench },
  { keywords: ["insurance", "policy", "premium"], icon: Shield },
  { keywords: ["puc", "tax", "rto", "document"], icon: FileCheck },
  { keywords: ["misc", "personal", "home money", "ghar kharch"], icon: User },
  { keywords: ["medical", "doctor", "medicine", "health", "hospital"], icon: HeartPulse },
  { keywords: ["movie", "entertainment", "cinema", "outing", "weekend plan"], icon: Film },
  { keywords: ["travel", "bus", "train", "flight", "taxi", "cab"], icon: Plane },
  { keywords: ["gift", "present"], icon: Gift },
  { keywords: ["work", "office"], icon: Briefcase },
  { keywords: ["education", "school", "college", "fees", "book"], icon: GraduationCap },
];

export const FALLBACK_ICON = Tag;

export function getCategoryIcon(name: string, keywords: string[] = [], iconOverride?: string | null) {
  if (iconOverride && AVAILABLE_ICONS[iconOverride]) {
    return AVAILABLE_ICONS[iconOverride];
  }

  const normalizedName = name.toLowerCase();
  const allTerms = [normalizedName, ...keywords.map((k) => k.toLowerCase())];

  for (const entry of CATEGORY_ICON_MAP) {
    for (const kw of entry.keywords) {
      if (allTerms.some((term) => term.includes(kw))) {
        return entry.icon;
      }
    }
  }
  return FALLBACK_ICON;
}

export const FIXED_COLOR_PALETTE = [
  "#2f7d76", // Teal
  "#a5572a", // Copper
  "#3b82f6", // Royal Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
];

export function getNextLocationColor(existingColors: string[]) {
  const unused = FIXED_COLOR_PALETTE.find((c) => !existingColors.map(e => e.toLowerCase()).includes(c.toLowerCase()));
  return unused || FIXED_COLOR_PALETTE[existingColors.length % FIXED_COLOR_PALETTE.length];
}

export function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
