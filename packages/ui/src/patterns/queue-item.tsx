"use client"

import * as React from "react"
import { cn } from "cn"
import {
  ArrowUpRightIcon,
  BanIcon,
  CheckIcon,
  EyeOffIcon,
  FlagIcon,
  HandIcon,
  SirenIcon,
  TimerIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { Checkbox } from "../components/checkbox"
import { Kbd } from "../components/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip"

export type QueueAction = "approve" | "hide" | "warn" | "mute" | "ban" | "escalate"

/** Keyboard shortcuts from PRD 9.3 */
export const QUEUE_SHORTCUTS: Record<QueueAction, string> = {
  approve: "A",
  hide: "H",
  warn: "W",
  mute: "M",
  ban: "B",
  escalate: "E",
}

const ACTIONS: { action: QueueAction; label: string; icon: React.ComponentType; variant: "outline" | "destructive" | "ghost" }[] = [
  { action: "approve", label: "Approve", icon: CheckIcon, variant: "outline" },
  { action: "hide", label: "Hide", icon: EyeOffIcon, variant: "outline" },
  { action: "warn", label: "Warn", icon: TriangleAlertIcon, variant: "outline" },
  { action: "mute", label: "Mute", icon: TimerIcon, variant: "outline" },
  { action: "ban", label: "Ban", icon: BanIcon, variant: "destructive" },
  { action: "escalate", label: "Escalate", icon: ArrowUpRightIcon, variant: "ghost" },
]

export type QueueItemData = {
  id: string
  priority: "urgent" | "normal"
  source: "reported" | "held" | "appeal"
  targetType: "post" | "reply" | "profile"
  context?: string
  content: string
  author: { displayName: string; accountAge: string; pastWarnings: number }
  reports?: { reason: string; count: number }[]
  scores?: { label: string; value: number }[]
  receivedAgo: string
  claimedBy?: string
}

/**
 * One moderation queue item (PRD 9.3): content in context, author history,
 * report reasons, automated scores, claim, one click actions with shortcuts.
 */
function QueueItem({
  item,
  selected,
  onSelectedChange,
  onAction,
  onClaim,
  focused,
  className,
}: {
  item: QueueItemData
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  onAction?: (action: QueueAction) => void
  onClaim?: () => void
  /** Shortcut keys act on the focused item */
  focused?: boolean
  className?: string
}) {
  const totalReports = item.reports?.reduce((n, r) => n + r.count, 0) ?? 0

  return (
    <article
      aria-label={`${item.priority === "urgent" ? "Urgent " : ""}${item.targetType} by ${item.author.displayName}`}
      data-focused={focused || undefined}
      className={cn(
        "grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 rounded-xl bg-card p-4 shadow-soft data-focused:ring-2 data-focused:ring-ring",
        item.priority === "urgent" && "border-l-4 border-destructive",
        className
      )}
    >
      <Checkbox
        checked={!!selected}
        onCheckedChange={(v) => onSelectedChange?.(!!v)}
        aria-label="Select for bulk action"
        className="mt-0.5"
      />
      <div className="min-w-0 space-y-3">
        <header className="flex flex-wrap items-center gap-2 text-small">
          {item.priority === "urgent" ? (
            <Badge variant="destructive">
              <SirenIcon data-icon="inline-start" aria-hidden />
              Urgent
            </Badge>
          ) : null}
          <Badge variant={item.source === "held" ? "warning" : "secondary"}>
            {{ held: "Held by automation", reported: "Reported", appeal: "Appeal" }[item.source]}
          </Badge>
          <span className="text-muted-foreground capitalize">{item.targetType}</span>
          <span className="text-muted-foreground">· {item.receivedAgo}</span>
          <span className="ml-auto">
            {item.claimedBy ? (
              <span className="text-muted-foreground">Claimed by {item.claimedBy}</span>
            ) : (
              <Button variant="secondary" size="xs" onClick={onClaim}>
                <HandIcon data-icon="inline-start" aria-hidden />
                Claim
              </Button>
            )}
          </span>
        </header>

        {item.context ? (
          <p className="truncate border-l-2 border-border pl-3 text-small text-muted-foreground">In reply to: {item.context}</p>
        ) : null}
        <p className="rounded-lg bg-muted/60 p-3 text-body text-foreground">{item.content}</p>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-small sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Author</dt>
            <dd className="font-medium">{item.author.displayName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Account age</dt>
            <dd>{item.author.accountAge}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Past warnings</dt>
            <dd className={cn(item.author.pastWarnings > 0 && "font-medium text-warning")}>{item.author.pastWarnings}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Reports</dt>
            <dd className="flex items-center gap-1">
              <FlagIcon className="size-3.5" aria-hidden />
              {totalReports}
            </dd>
          </div>
        </dl>

        {item.reports?.length || item.scores?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {item.reports?.map((r) => (
              <Badge key={r.reason} variant="outline">
                {r.reason} × {r.count}
              </Badge>
            ))}
            {item.scores?.map((s) => (
              <Badge key={s.label} variant={s.value >= 0.8 ? "destructive" : "outline"} className="font-mono">
                {s.label} {s.value.toFixed(2)}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {ACTIONS.map(({ action, label, icon: Icon, variant }) => (
            <Tooltip key={action}>
              <TooltipTrigger
                render={<Button variant={variant} size="sm" onClick={() => onAction?.(action)} aria-keyshortcuts={QUEUE_SHORTCUTS[action]} />}
              >
                <Icon />
                {label}
              </TooltipTrigger>
              <TooltipContent>
                {label} <Kbd>{QUEUE_SHORTCUTS[action]}</Kbd>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </article>
  )
}

export { QueueItem }
