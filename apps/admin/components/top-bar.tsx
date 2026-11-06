import { InboxIcon, SirenIcon, TimerIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Separator } from "@meridianher/ui/components/separator"
import { SidebarTrigger } from "@meridianher/ui/components/sidebar"

import type { QueueCounts } from "@/lib/staff"
import { AccountMenu } from "./account-menu"
import { CommandPalette } from "./command-palette"

/** Global search, live queue counters and the profile menu (PRD 9.1). */
export function TopBar({ name, role, isAdmin, counts }: { name: string; role: string; isAdmin: boolean; counts: QueueCounts }) {
  const counters = [
    { label: "Urgent", value: counts.urgent, href: "/moderation?tab=urgent", icon: SirenIcon, urgent: true },
    { label: "Reported", value: counts.reported, href: "/moderation?tab=reported", icon: InboxIcon },
    { label: "Held", value: counts.held, href: "/moderation?tab=held", icon: TimerIcon },
  ]
  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <CommandPalette isAdmin={isAdmin} />
      <nav aria-label="Queues" className="ml-auto hidden items-center gap-1 md:flex">
        {counters.map(({ label, value, href, icon: Icon, urgent }) => (
          <ButtonLink key={label} variant="ghost" size="sm" href={href} aria-label={`${label} queue, ${value} waiting`}>
            <Icon data-icon="inline-start" className={urgent && value ? "text-destructive" : undefined} aria-hidden />
            {label}
            <Badge variant={urgent && value ? "destructive" : "secondary"} className="tabular-nums">
              {value}
            </Badge>
          </ButtonLink>
        ))}
      </nav>
      <AccountMenu name={name} role={role} />
    </header>
  )
}
