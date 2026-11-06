"use client"

import { BookmarkIcon, InboxIcon, LogOutIcon, MonitorIcon, MoonIcon, SettingsIcon, SunIcon, UserIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@meridianher/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@meridianher/ui/components/dropdown-menu"
import { InitialAvatar } from "@meridianher/ui/patterns/chips"

import { signOut } from "@/lib/auth-actions"
import { clearDrafts } from "@/lib/drafts"

export function AccountMenu({ name, isExpert }: { name: string; isExpert: boolean }) {
  const { theme, setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Account menu for ${name}`} className="rounded-full" />}>
        <InitialAvatar name={name} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{name}</DropdownMenuLabel>
          <DropdownMenuItem render={<a href={`/m/${encodeURIComponent(name)}`} />}>
            <UserIcon /> Your profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href="/saved" />}>
            <BookmarkIcon /> Saved
          </DropdownMenuItem>
          {isExpert ? (
            <DropdownMenuItem render={<a href="/experts/inbox" />}>
              <InboxIcon /> Expert inbox
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem render={<a href="/settings" />}>
            <SettingsIcon /> Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={(v) => setTheme(String(v))}>
            <DropdownMenuRadioItem value="light">
              <SunIcon /> Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <MoonIcon /> Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <MonitorIcon /> Match my device
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {
          clearDrafts()
          void signOut()
        }}>
          <LogOutIcon /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
