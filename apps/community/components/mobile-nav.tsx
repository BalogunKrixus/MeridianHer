"use client"

import { usePathname } from "next/navigation"
import { BellIcon, HomeIcon, LayoutGridIcon, PlusIcon, UserIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { ButtonLink } from "@meridianher/ui/components/button"

/** Phone navigation: Home, Spaces, Ask (centre), Alerts, You (PRD 6.1). */
export function MobileNav({ unread, profileHref }: { unread: number; profileHref: string }) {
  const path = usePathname()
  const items = [
    { href: "/", label: "Home", icon: HomeIcon, active: path === "/" },
    { href: "/spaces", label: "Spaces", icon: LayoutGridIcon, active: path.startsWith("/spaces") || path.startsWith("/s/") },
    { href: "/ask", label: "Ask", icon: PlusIcon, active: path === "/ask", primary: true },
    { href: "/notifications", label: "Alerts", icon: BellIcon, active: path === "/notifications", count: unread },
    { href: profileHref, label: "You", icon: UserIcon, active: path.startsWith("/m/") || path === "/settings" || path === "/saved" },
  ]
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ href, label, icon: Icon, active, primary, count }) => (
          <li key={label} className="flex justify-center">
            <ButtonLink
              href={href}
              variant={primary ? "default" : "ghost"}
              aria-current={active ? "page" : undefined}
              className={
                primary
                  ? "my-1.5 size-12 touch:size-12 flex-col rounded-full p-0"
                  : "relative h-14 touch:h-14 w-full flex-col gap-0.5 rounded-none text-[0.6875rem] text-muted-foreground aria-[current=page]:text-primary"
              }
            >
              <Icon className={primary ? "size-6" : "size-5"} aria-hidden />
              <span className={primary ? "sr-only" : undefined}>{label}</span>
              {count ? (
                <Badge className="absolute top-1.5 left-1/2 ml-1 h-4 min-w-4 px-1 text-[0.625rem] tabular-nums">{count > 9 ? "9+" : count}</Badge>
              ) : null}
            </ButtonLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
