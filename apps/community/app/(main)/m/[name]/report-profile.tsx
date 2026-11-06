"use client"

import * as React from "react"
import { FlagIcon } from "lucide-react"
import { Button } from "@meridianher/ui/components/button"
import { ReportSheet } from "@meridianher/ui/patterns/report-sheet"

import { useAccount } from "@/components/account-gate"
import { report } from "@/lib/actions"

export function ReportProfile({ userId }: { userId: string }) {
  const { requireAccount } = useAccount()
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button variant="ghost" size="icon" aria-label="Report this profile" onClick={() => requireAccount("report this profile") && setOpen(true)}>
        <FlagIcon />
      </Button>
      <ReportSheet open={open} onOpenChange={setOpen} target="profile" onSubmit={(reason, note) => report({ type: "profile", id: userId, reason, note })} />
    </>
  )
}
