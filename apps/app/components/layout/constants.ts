import {
  ListOrdered,
  Link,
  Plug,
  Settings,
  Book,
  FileText,
  Home,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  labelKey: string; // i18n translation key
  to: string;
}

export interface NavSection {
  titleKey: string; // i18n translation key
  items: NavItem[];
}

export const sidebarSections: NavSection[] = [
  {
    titleKey: "nav.bridgeIntegration",
    items: [
      { icon: Home, labelKey: "nav.dashboard", to: "/" },
      { icon: ListOrdered, labelKey: "nav.liveOrders", to: "/live-orders" },
      { icon: Link, labelKey: "nav.menuMapping", to: "/menu-mapping" },
      { icon: Plug, labelKey: "nav.syncLogs", to: "/sync-logs" },
    ],
  },
  {
    titleKey: "nav.management",
    items: [
      { icon: Utensils, labelKey: "nav.menu", to: "/menu" },
      { icon: Book, labelKey: "nav.inventory", to: "/inventory" },
      { icon: FileText, labelKey: "nav.reports", to: "/reports" },
      { icon: Settings, labelKey: "nav.settings", to: "/settings" },
    ],
  },
];
