"use client"

import { RefreshCwIcon } from "lucide-react"
import { Button, ButtonLink } from "@meridianher/ui/components/button"
import { EmptyState } from "@meridianher/ui/patterns/cards"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-16">
      <EmptyState
        icon={RefreshCwIcon}
        title="Something went wrong"
        description={error.digest ? `Error reference ${error.digest}. Try again, and share the reference if it keeps happening.` : "Try again in a moment."}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink variant="outline" href="/">
              Back to the overview
            </ButtonLink>
          </div>
        }
      />
    </div>
  )
}
