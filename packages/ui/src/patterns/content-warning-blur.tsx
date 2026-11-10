"use client"

import * as React from "react"
import { cn } from "../lib/utils"
import { EyeIcon, TriangleAlertIcon } from "lucide-react"

import { Button } from "../components/button"

export type ContentWarningType = "pregnancy-loss" | "graphic" | "mental-health"

const LABELS: Record<ContentWarningType, string> = {
  "pregnancy-loss": "Pregnancy loss",
  graphic: "Graphic description",
  "mental-health": "Mental health",
}

/**
 * Blurs content behind a warning until she chooses to see it. Hidden content
 * is inert and removed from the accessibility tree; the warning itself is
 * announced (PRD section 13).
 */
function ContentWarningBlur({
  type,
  children,
  className,
}: {
  type: ContentWarningType
  children: React.ReactNode
  className?: string
}) {
  const [revealed, setRevealed] = React.useState(false)
  const id = React.useId()

  if (revealed) return <div className={className}>{children}</div>

  return (
    <div className={cn("relative min-h-28 overflow-hidden rounded-lg", className)}>
      <div aria-hidden inert className="pointer-events-none blur-md select-none">
        {children}
      </div>
      <div
        role="note"
        aria-labelledby={id}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/70 p-4 text-center"
      >
        <p id={id} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <TriangleAlertIcon className="size-4 text-warning" aria-hidden />
          Content warning: {LABELS[type]}
        </p>
        <Button variant="outline" size="sm" onClick={() => setRevealed(true)}>
          <EyeIcon data-icon="inline-start" aria-hidden />
          Show post
        </Button>
      </div>
    </div>
  )
}

export { ContentWarningBlur, LABELS as CONTENT_WARNING_LABELS }
