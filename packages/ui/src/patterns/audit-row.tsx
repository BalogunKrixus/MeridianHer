"use client"

import { cn } from "cn"
import { ChevronRightIcon } from "lucide-react"

import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/collapsible"

export type AuditEntry = {
  id: string
  at: string
  actor: string
  action: string
  target: string
  reason?: string
  ip?: string
  before?: unknown
  after?: unknown
}

const DESTRUCTIVE = /ban|hide|revoke|delete|suspend/i

/** One append only audit log entry (PRD 9.9). Before and after state expands inline. */
function AuditRow({ entry, className }: { entry: AuditEntry; className?: string }) {
  const hasDiff = entry.before !== undefined || entry.after !== undefined
  return (
    <Collapsible className={cn("border-b border-border last:border-0", className)}>
      <div className="grid grid-cols-[1.25rem_8.5rem_1fr] items-center gap-x-3 gap-y-1 px-3 py-2 text-small sm:grid-cols-[1.25rem_9rem_9rem_8rem_1fr_7rem]">
        {hasDiff ? (
          <CollapsibleTrigger
            aria-label="Show before and after"
            render={<Button variant="ghost" size="icon-xs" className="group/audit text-muted-foreground" />}
          >
            <ChevronRightIcon className="transition-transform group-data-panel-open/audit:rotate-90" aria-hidden />
          </CollapsibleTrigger>
        ) : null}
        <time className="col-start-2 font-mono text-xs text-muted-foreground tabular-nums">{entry.at}</time>
        <span className="truncate font-medium">{entry.actor}</span>
        <span>
          <Badge variant={DESTRUCTIVE.test(entry.action) ? "destructive" : "secondary"}>{entry.action}</Badge>
        </span>
        <span className="col-span-2 min-w-0 truncate text-muted-foreground sm:col-span-1">
          <span className="text-foreground">{entry.target}</span>
          {entry.reason ? <> · {entry.reason}</> : null}
        </span>
        <span className="hidden font-mono text-xs text-muted-foreground sm:block">{entry.ip}</span>
      </div>
      {hasDiff ? (
        <CollapsibleContent className="grid gap-2 px-3 pb-3 sm:grid-cols-2 sm:pl-11">
          {(["before", "after"] as const).map((k) => (
            <div key={k} className="min-w-0">
              <p className="mb-1 text-xs font-medium text-muted-foreground capitalize">{k}</p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-2 font-mono text-xs text-foreground">
                {JSON.stringify(entry[k] ?? null, null, 2)}
              </pre>
            </div>
          ))}
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}

export { AuditRow }
