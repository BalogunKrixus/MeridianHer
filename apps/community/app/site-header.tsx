import { PenLineIcon } from "lucide-react"
import { Button, ButtonLink } from "@meridianher/ui/components/button"
import { InitialAvatar } from "@meridianher/ui/patterns/chips"

import { getViewer } from "../lib/data"
import { signOut } from "./auth/actions"

export async function SiteHeader() {
  const viewer = await getViewer()
  const name = viewer?.onboarding_complete ? viewer.display_name : null

  return (
    <header className="border-b bg-background">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <a href="/" className="mr-auto text-lg font-semibold tracking-tight">
          MeridianHer
        </a>
        <ButtonLink size="sm" href="/ask">
          <PenLineIcon data-icon="inline-start" aria-hidden />
          Ask a question
        </ButtonLink>
        {name ? (
          <>
            <InitialAvatar name={name} size="sm" className="ml-2 hidden sm:flex" />
            <span className="hidden text-sm font-medium sm:inline">{name}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
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
