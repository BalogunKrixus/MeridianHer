"use client"

import * as React from "react"
import { cn } from "cn"
import { HandHeartIcon, LightbulbIcon, UsersIcon } from "lucide-react"

export type ReactionKind = "hug" | "same" | "helpful"

const REACTIONS: { kind: ReactionKind; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: "hug", label: "Hug", hint: "Send support", icon: HandHeartIcon },
  { kind: "same", label: "Same", hint: "Me too", icon: UsersIcon },
  { kind: "helpful", label: "Helpful", hint: "This helped", icon: LightbulbIcon },
]

/**
 * Hug, Same, Helpful. Labelled, never emoji only (PRD 6.6). Counts are public,
 * reactors are not. Toggling is optimistic; `onReact` persists it.
 */
function ReactionBar({
  counts,
  mine = [],
  onReact,
  size = "default",
  className,
}: {
  counts: Record<ReactionKind, number>
  mine?: ReactionKind[]
  onReact?: (kind: ReactionKind, active: boolean) => void
  size?: "sm" | "default"
  className?: string
}) {
  const [active, setActive] = React.useState<Set<ReactionKind>>(() => new Set(mine))
  const [local, setLocal] = React.useState(counts)

  function toggle(kind: ReactionKind) {
    const next = new Set(active)
    const on = !next.has(kind)
    if (on) next.add(kind)
    else next.delete(kind)
    setActive(next)
    setLocal((c) => ({ ...c, [kind]: Math.max(0, c[kind] + (on ? 1 : -1)) }))
    onReact?.(kind, on)
  }

  return (
    <div role="group" aria-label="Reactions" className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {REACTIONS.map(({ kind, label, hint, icon: Icon }) => {
        const pressed = active.has(kind)
        return (
          <button
            key={kind}
            type="button"
            aria-pressed={pressed}
            title={hint}
            onClick={() => toggle(kind)}
            className={cn(
              "relative tap-target inline-flex items-center gap-1.5 rounded-full font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
              size === "default" ? "h-8 px-3 text-sm touch:h-11 touch:px-4" : "h-7 px-2.5 text-xs",
              pressed
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className={cn("shrink-0", size === "default" ? "size-4" : "size-3.5")} aria-hidden />
            <span>{label}</span>
            <span className="tabular-nums">{local[kind] > 0 ? local[kind] : ""}</span>
            <span className="sr-only">{`, ${local[kind]} ${local[kind] === 1 ? "person" : "people"}`}</span>
          </button>
        )
      })}
    </div>
  )
}

export { ReactionBar }
