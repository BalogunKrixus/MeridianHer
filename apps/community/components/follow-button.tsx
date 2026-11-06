"use client"

import * as React from "react"
import { CheckIcon, PlusIcon } from "lucide-react"
import { Button } from "@meridianher/ui/components/button"

import { useAccount } from "@/components/account-gate"
import { followSpace } from "@/lib/actions"

export function FollowButton({ spaceId, following }: { spaceId: string; following: boolean }) {
  const { requireAccount } = useAccount()
  const [on, setOn] = React.useState(following)
  const [pending, startTransition] = React.useTransition()
  return (
    <Button
      variant={on ? "secondary" : "outline"}
      aria-pressed={on}
      disabled={pending}
      onClick={() => {
        if (!requireAccount("follow this space")) return
        startTransition(async () => {
          if (!(await followSpace(spaceId, !on)).error) setOn(!on)
        })
      }}
    >
      {on ? <CheckIcon data-icon="inline-start" aria-hidden /> : <PlusIcon data-icon="inline-start" aria-hidden />}
      {on ? "Following" : "Follow"}
    </Button>
  )
}
