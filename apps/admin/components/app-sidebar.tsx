"use client"

import { usePathname } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@meridianher/ui/components/sidebar"

import { COMMUNITY_URL } from "@/lib/community"
import type { QueueCounts } from "@/lib/staff"
import { NAV } from "./nav"

export function AppSidebar({ isAdmin, counts }: { isAdmin: boolean; counts: QueueCounts }) {
  const path = usePathname()
  const badges: Record<string, number> = {
    "/moderation": counts.urgent + counts.reported + counts.held + counts.appeals,
    "/experts": counts.applications,
  }
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/" />} tooltip="MeridianHer admin">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground">
                M
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-semibold">MeridianHer</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.filter((n) => isAdmin || !n.admin).map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? path === "/" : path.startsWith(href)
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton isActive={active} tooltip={label} render={<a href={href} aria-current={active ? "page" : undefined} />}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                    {badges[href] ? <SidebarMenuBadge className="tabular-nums">{badges[href]}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Open the community"
              render={<a href={COMMUNITY_URL} target="_blank" rel="noreferrer" />}
              className="text-muted-foreground"
            >
              <ExternalLinkIcon />
              <span>Open the community</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
