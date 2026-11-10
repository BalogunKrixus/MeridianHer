"use client"

import { RefreshCwIcon } from "lucide-react"
import { Button, ButtonLink } from "@meridianher/ui/components/button"
import { EmptyState } from "@meridianher/ui/patterns/cards"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-16">
      <EmptyState
        icon={RefreshCwIcon}
        title="Something went wrong on our side"
        description="Nothing you did caused this. Please try again in a moment. If you were writing something, your draft is saved on this device."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink variant="outline" href="/">
              Go to the community
            </ButtonLink>
          </div>
        }
      />
    </main>
  )
}
