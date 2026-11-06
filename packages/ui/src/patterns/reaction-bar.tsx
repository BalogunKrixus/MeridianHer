"use client"

import * as React from "react"
import { HandHeartIcon, LightbulbIcon, UsersIcon } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "../components/toggle-group"

export type ReactionKind = "hug" | "same" | "helpful"

const REACTIONS: { kind: ReactionKind; label: string; hint: string; icon: React.ComponentType }[] = [
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
  /** Return false to undo the optimistic change, for example when she must sign in first */
  onReact?: (kind: ReactionKind, active: boolean) => void | boolean | Promise<void | boolean>
  size?: "sm" | "default"
  className?: string
}) {
  const [active, setActive] = React.useState<ReactionKind[]>(mine)
  const [local, setLocal] = React.useState(counts)

  async function change(next: ReactionKind[]) {
    const kind = REACTIONS.find((r) => next.includes(r.kind) !== active.includes(r.kind))?.kind
    if (!kind) return
    const on = next.includes(kind)
    const before = { active, local }
    setActive(next)
    setLocal((c) => ({ ...c, [kind]: Math.max(0, c[kind] + (on ? 1 : -1)) }))
    if ((await onReact?.(kind, on)) === false) {
      setActive(before.active)
      setLocal(before.local)
    }
  }

  return (
    <ToggleGroup
      multiple
      aria-label="Reactions"
      variant="reaction"
      size={size}
      spacing={1}
      value={active}
      onValueChange={(v) => change(v as ReactionKind[])}
      className={className}
    >
      {REACTIONS.map(({ kind, label, hint, icon: Icon }) => (
        <ToggleGroupItem key={kind} value={kind} title={hint}>
          <Icon aria-hidden />
          {label}
          <span className="tabular-nums">{local[kind] > 0 ? local[kind] : ""}</span>
          <span className="sr-only">{`, ${local[kind]} ${local[kind] === 1 ? "person" : "people"}`}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export { ReactionBar }
