"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MonitorIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@meridianher/ui/components/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@meridianher/ui/components/command"
import { Kbd } from "@meridianher/ui/components/kbd"

import { NAV } from "./nav"

const QUICK = [
  { label: "Open urgent queue", href: "/moderation?tab=urgent" },
  { label: "Open reported queue", href: "/moderation?tab=reported" },
  { label: "Open held posts", href: "/moderation?tab=held" },
  { label: "Review appeals", href: "/moderation?tab=appeals" },
  { label: "Review expert applications", href: "/experts", admin: true },
  { label: "Invite an expert", href: "/experts?invite=1", admin: true },
  { label: "Write a team post or banner", href: "/announcements", admin: true },
  { label: "Edit blocked words and allowed links", href: "/settings", admin: true },
  { label: "Export the audit log", href: "/audit", admin: true },
]

/** Ctrl or Cmd plus K for every destination and action (PRD 9.1), plus G then a letter to jump. */
export function CommandPalette({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    let leader = 0
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.toLowerCase() === "g") {
        leader = Date.now()
        return
      }
      if (Date.now() - leader < 1000) {
        const target = NAV.find((n) => n.shortcut.endsWith(e.key.toUpperCase()) && (isAdmin || !n.admin))
        leader = 0
        if (target) router.push(target.href)
      }
      if (e.key === "/") {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isAdmin, router])

  const go = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <>
      <Button variant="outline" size="sm" className="w-full max-w-sm justify-start text-muted-foreground" onClick={() => setOpen(true)}>
        <SearchIcon data-icon="inline-start" aria-hidden />
        Search or jump to
        <Kbd className="ml-auto">⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Search members and posts, or jump anywhere">
        <Command>
          <CommandInput placeholder="Search members, posts and experts, or type a command" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>No matching command.</CommandEmpty>
            <CommandGroup heading="Go to">
              {NAV.filter((n) => isAdmin || !n.admin).map(({ href, label, icon: Icon, shortcut }) => (
                <CommandItem key={href} value={label} onSelect={() => go(href)}>
                  <Icon />
                  {label}
                  <CommandShortcut>{shortcut}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {QUICK.filter((q) => isAdmin || !q.admin).map((q) => (
                <CommandItem key={q.href} value={q.label} onSelect={() => go(q.href)}>
                  {q.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Appearance">
              {[
                { value: "light", label: "Light", icon: SunIcon },
                { value: "dark", label: "Dark", icon: MoonIcon },
                { value: "system", label: "Match my device", icon: MonitorIcon },
              ].map(({ value, label, icon: Icon }) => (
                <CommandItem
                  key={value}
                  value={`theme ${label}`}
                  onSelect={() => {
                    setTheme(value)
                    setOpen(false)
                  }}
                >
                  <Icon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
            {query.trim().length > 1 ? (
              <CommandGroup heading="Search">
                <CommandItem value={`search everywhere ${query}`} onSelect={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}>
                  <SearchIcon />
                  Search everywhere for “{query.trim()}”
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
