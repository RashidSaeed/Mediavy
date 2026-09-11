import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, MapPin, Users, HeartPulse, Network } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/regions", label: "Plan vs Actual — Region", shortLabel: "Region", icon: MapPin },
  { href: "/field-force", label: "Plan vs Actual — Field Force", shortLabel: "FF", icon: Users },
  { href: "/engagement", label: "HCP Engagement", shortLabel: "Engage", icon: HeartPulse },
  { href: "/mapping", label: "HCP / SKU / Chemist Mapping", shortLabel: "Mapping", icon: Network },
];
