import {
  BadgeCheckIcon,
  ChartColumnIcon,
  FileTextIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"

/** Sidebar order from PRD 9.1. Moderators see the first four. */
export const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboardIcon, admin: false, shortcut: "G O" },
  { href: "/moderation", label: "Moderation", icon: ShieldIcon, admin: false, shortcut: "G M" },
  { href: "/members", label: "Members", icon: UsersIcon, admin: false, shortcut: "G U" },
  { href: "/content", label: "Content", icon: FileTextIcon, admin: false, shortcut: "G C" },
  { href: "/experts", label: "Experts", icon: BadgeCheckIcon, admin: true, shortcut: "G E" },
  { href: "/spaces", label: "Spaces", icon: LayoutGridIcon, admin: true, shortcut: "G S" },
  { href: "/announcements", label: "Announcements", icon: MegaphoneIcon, admin: true, shortcut: "G N" },
  { href: "/analytics", label: "Analytics", icon: ChartColumnIcon, admin: true, shortcut: "G A" },
  { href: "/audit", label: "Audit log", icon: HistoryIcon, admin: true, shortcut: "G L" },
  { href: "/settings", label: "Settings", icon: SettingsIcon, admin: true, shortcut: "G T" },
] as const
