import { BellIcon, PenLineIcon, SearchIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { ButtonLink } from "@meridianher/ui/components/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@meridianher/ui/components/input-group"

import { getUnreadCount, getViewer } from "@/lib/data"
import { AccountMenu } from "./account-menu"

/** Desktop and tablet header. On phones the bottom bar carries Ask and alerts, so the header keeps only search and the account. */
export async function SiteHeader() {
  const viewer = await getViewer()
  const member = viewer?.onboarding_complete ? viewer : null
  const unread = member ? await getUnreadCount() : 0

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <a href="/" className="mr-auto shrink-0 text-lg font-semibold tracking-tight">
          MeridianHer
        </a>
        <form action="/search" role="search" className="hidden w-72 md:block">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput name="q" type="search" placeholder="Search questions and answers" aria-label="Search" />
          </InputGroup>
        </form>
        <ButtonLink variant="ghost" size="icon" href="/search" aria-label="Search" className="md:hidden">
          <SearchIcon />
        </ButtonLink>
        <ButtonLink size="sm" href="/ask" className="hidden md:inline-flex">
          <PenLineIcon data-icon="inline-start" aria-hidden />
          Ask a question
        </ButtonLink>
        {member ? (
          <>
            <ButtonLink
              variant="ghost"
              size="icon"
              href="/notifications"
              aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
              className="relative hidden md:inline-flex"
            >
              <BellIcon />
              {unread ? (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[0.625rem] tabular-nums">{unread > 9 ? "9+" : unread}</Badge>
              ) : null}
            </ButtonLink>
            <AccountMenu name={member.display_name!} isExpert={member.role === "expert"} />
          </>
        ) : (
          <ButtonLink size="sm" variant="outline" href="/sign-in">
            Sign in
          </ButtonLink>
        )}
      </nav>
    </header>
  )
}
