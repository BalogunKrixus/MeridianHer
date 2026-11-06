"use client"

import * as React from "react"
import { MegaphoneIcon, XIcon } from "lucide-react"
import { Alert, AlertAction, AlertDescription } from "@meridianher/ui/components/alert"
import { Button } from "@meridianher/ui/components/button"

const KEY = "meridianher:dismissed-banners"

function dismissed(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]")
  } catch {
    return []
  }
}

/** Admin banner (PRD 9.7). Dismissing hides it on this device only. */
export function SiteBanner({ id, body }: { id: string; body: string }) {
  const [hidden, setHidden] = React.useState(false)
  React.useEffect(() => setHidden(dismissed().includes(id)), [id])
  if (hidden) return null
  return (
    <Alert>
      <MegaphoneIcon aria-hidden />
      <AlertDescription className="text-foreground">{body}</AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss announcement"
          onClick={() => {
            setHidden(true)
            try {
              window.localStorage.setItem(KEY, JSON.stringify([...dismissed(), id].slice(-20)))
            } catch {}
          }}
        >
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  )
}
