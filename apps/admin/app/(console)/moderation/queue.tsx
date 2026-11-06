"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCheckIcon, CheckIcon, EyeOffIcon, PartyPopperIcon, ScaleIcon, XIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { Button, ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Checkbox } from "@meridianher/ui/components/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@meridianher/ui/components/dialog"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@meridianher/ui/components/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@meridianher/ui/components/select"
import { toast } from "@meridianher/ui/components/sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@meridianher/ui/components/table"
import { Textarea } from "@meridianher/ui/components/textarea"
import { ToggleGroup, ToggleGroupItem } from "@meridianher/ui/components/toggle-group"
import { EmptyState } from "@meridianher/ui/patterns/cards"
import { QUEUE_SHORTCUTS, QueueItem, type QueueAction, type QueueItemData } from "@meridianher/ui/patterns/queue-item"

import { ago, REASON_TEMPLATES } from "@/lib/format"
import { claim, decide, decideAppeal, escalate, sanction } from "@/lib/moderation-actions"
import type { QueueCounts } from "@/lib/staff"

export type QueueEntry = QueueItemData & {
  targetId: string
  authorId: string | null
  authorName: string
  claimedByMe: boolean
}
export type Appeal = {
  sanction_id: string
  kind: string
  reason: string | null
  appeal_text: string
  appealed_at: string
  until: string | null
  author: { id: string; name: string; joined: string }
}
export type Resolved = { id: string; action: string; target_type: string; target_id: string; reason: string | null; moderator: string; at: string }

const TAB_LABELS = [
  { value: "urgent", label: "Urgent", count: "urgent" },
  { value: "reported", label: "Reported", count: "reported" },
  { value: "held", label: "Held by automation", count: "held" },
  { value: "appeals", label: "Appeals", count: "appeals" },
  { value: "resolved", label: "Resolved" },
] as const

type Pending = { action: Exclude<QueueAction, "approve">; items: QueueEntry[] }

const MUTE_DAYS = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
]

const VERBS: Record<Pending["action"], string> = { hide: "Hide", warn: "Warn", mute: "Mute", ban: "Ban", escalate: "Escalate" }
const DONE: Record<Pending["action"], string> = { hide: "Hid", warn: "Warned", mute: "Muted", ban: "Banned", escalate: "Escalated" }

/** The reason step for hide, warn, mute, ban and escalate. Templates map to the five guidelines (PRD 9.3). */
function ReasonDialog({ pending, onClose, onDone }: { pending: Pending | null; onClose: () => void; onDone: (ids: string[]) => void }) {
  const [template, setTemplate] = React.useState<string>("")
  const [text, setText] = React.useState("")
  const [days, setDays] = React.useState("1")
  const [hideToo, setHideToo] = React.useState(true)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    setTemplate("")
    setText("")
    setDays("1")
    setHideToo(true)
  }, [pending])

  if (!pending) return null
  const { action, items } = pending
  const first = items[0]
  const sanctioning = action === "warn" || action === "mute" || action === "ban"
  const who = items.length > 1 ? `${items.length} items` : sanctioning ? first.authorName : `this ${first.targetType}`
  const canHide = sanctioning && first.targetType !== "profile"

  async function submit() {
    if (!text.trim()) return
    setBusy(true)
    let error: string | undefined
    if (action === "hide") {
      error = (await decide(items.map((i) => ({ type: i.targetType, id: i.targetId })), "hide", { code: template || undefined, text })).error
    } else if (action === "escalate") {
      error = (await escalate(first.targetType, first.targetId, text)).error
    } else {
      for (const i of items) {
        if (!i.authorId) continue
        const result = await sanction({
          member: i.authorId,
          kind: action,
          days: action === "mute" ? Number(days) : undefined,
          reason: text,
          hide: hideToo && i.targetType !== "profile" ? { type: i.targetType, id: i.targetId } : undefined,
        })
        if (result.error) {
          error = result.error
          break
        }
      }
    }
    setBusy(false)
    if (error) return void toast.error(error)
    toast.success(action === "escalate" ? "Escalated to an admin" : `${DONE[action]} ${who}`)
    onDone(items.map((i) => i.id))
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {VERBS[action]} {who}
          </DialogTitle>
          <DialogDescription>
            {action === "escalate"
              ? "Tell the admin what you need from them. It goes to the top of the urgent tab."
              : "The member sees this reason, so write it kindly and name the rule."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {action !== "escalate" ? (
            <Field>
              <FieldLabel>Rule</FieldLabel>
              <ToggleGroup
                variant="chip"
                spacing={1}
                className="flex-wrap"
                value={template ? [template] : []}
                onValueChange={(v) => {
                  const code = (v as string[])[0] ?? ""
                  setTemplate(code)
                  const t = REASON_TEMPLATES.find((r) => r.code === code)
                  if (t) setText(t.text)
                }}
              >
                {REASON_TEMPLATES.map((r) => (
                  <ToggleGroupItem key={r.code} value={r.code}>
                    {r.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          ) : null}
          <Field>
            <FieldLabel htmlFor="reason-text">{action === "escalate" ? "Note for the admin" : "Reason"}</FieldLabel>
            <Textarea id="reason-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500} autoFocus />
          </Field>
          {action === "mute" ? (
            <Field>
              <FieldLabel htmlFor="mute-days">Mute for</FieldLabel>
              <Select items={MUTE_DAYS} value={days} onValueChange={(v) => setDays((v as string) ?? "1")}>
                <SelectTrigger id="mute-days" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUTE_DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          {canHide ? (
            <Field orientation="horizontal">
              <Checkbox id="hide-too" checked={hideToo} onCheckedChange={(v) => setHideToo(!!v)} />
              <FieldContent>
                <FieldLabel htmlFor="hide-too">Also hide the {first.targetType}</FieldLabel>
                <FieldDescription>Leave unticked to keep it up and only {action} the member.</FieldDescription>
              </FieldContent>
            </Field>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={action === "ban" ? "destructive" : "default"} disabled={!text.trim() || busy} onClick={submit}>
            {VERBS[action]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Appeals({ appeals }: { appeals: Appeal[] }) {
  const router = useRouter()
  const [notes, setNotes] = React.useState<Record<string, string>>({})
  if (!appeals.length) {
    return <EmptyState icon={ScaleIcon} title="No appeals waiting" description="When a member appeals a warning, mute or ban, it shows up here." />
  }
  return (
    <ul className="flex flex-col gap-3">
      {appeals.map((a) => (
        <li key={a.sanction_id}>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-h3">
                {a.author.name}
                <Badge variant="secondary" className="capitalize">
                  {a.kind}
                </Badge>
                <span className="text-small font-normal text-muted-foreground">appealed {ago(a.appealed_at)}</span>
              </CardTitle>
              <CardDescription>Original reason: {a.reason ?? "none given"}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <blockquote className="rounded-lg bg-muted p-3 text-body">{a.appeal_text}</blockquote>
              <Field>
                <FieldLabel htmlFor={`note-${a.sanction_id}`}>Note to the member (optional)</FieldLabel>
                <Textarea
                  id={`note-${a.sanction_id}`}
                  rows={2}
                  value={notes[a.sanction_id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [a.sanction_id]: e.target.value })}
                />
              </Field>
            </CardContent>
            <CardFooter className="gap-2">
              {[
                { overturn: true, label: "Overturn", icon: CheckIcon, done: "Appeal accepted. Restrictions lifted." },
                { overturn: false, label: "Uphold", icon: XIcon, done: "Decision upheld" },
              ].map(({ overturn, label, icon: Icon, done }) => (
                <Button
                  key={label}
                  variant={overturn ? "default" : "outline"}
                  onClick={async () => {
                    const result = await decideAppeal(a.sanction_id, overturn, notes[a.sanction_id] ?? "")
                    if (result.error) return void toast.error(result.error)
                    toast.success(done)
                    router.refresh()
                  }}
                >
                  <Icon data-icon="inline-start" aria-hidden />
                  {label}
                </Button>
              ))}
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  )
}

function ResolvedTable({ rows }: { rows: Resolved[] }) {
  if (!rows.length) return <EmptyState icon={CheckCheckIcon} title="No decisions yet" description="Every action taken in the queue is listed here and in the audit log." />
  return (
    <Card className="py-0">
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Moderator</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-muted-foreground tabular-nums">{ago(r.at)}</TableCell>
              <TableCell className="font-medium">{r.moderator}</TableCell>
              <TableCell>
                <Badge variant={r.action === "hide" ? "destructive" : "secondary"}>{r.action.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell className="capitalize">{r.target_type}</TableCell>
              <TableCell className="max-w-md truncate text-muted-foreground">{r.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

export function ModerationQueue({
  tab,
  counts,
  items,
  appeals,
  resolved,
}: {
  tab: string
  counts: QueueCounts
  items: QueueEntry[]
  appeals: Appeal[]
  resolved: Resolved[]
}) {
  const router = useRouter()
  const [gone, setGone] = React.useState<Set<string>>(new Set())
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [focus, setFocus] = React.useState(0)
  const [pending, setPending] = React.useState<Pending | null>(null)
  const visible = items.filter((i) => !gone.has(i.id))
  const listRef = React.useRef<HTMLUListElement>(null)

  const finish = React.useCallback(
    (ids: string[]) => {
      setGone((g) => new Set([...g, ...ids]))
      setSelected(new Set())
      setPending(null)
      router.refresh()
    },
    [router]
  )

  const act = React.useCallback(
    async (action: QueueAction, targets: QueueEntry[]) => {
      if (!targets.length) return
      if (action === "approve") {
        const result = await decide(
          targets.map((i) => ({ type: i.targetType, id: i.targetId })),
          "approve"
        )
        if (result.error) return void toast.error(result.error)
        toast.success(targets.length > 1 ? `Approved ${targets.length} items` : "Approved. Reports closed.")
        finish(targets.map((t) => t.id))
        return
      }
      if (action === "escalate" && targets.length > 1) return void toast("Escalate one item at a time, with a note.")
      setPending({ action, items: targets })
    },
    [finish]
  )

  // J and K move, X selects, A H W M B E act on the focused item (PRD 9.3)
  React.useEffect(() => {
    const keys = Object.fromEntries(Object.entries(QUEUE_SHORTCUTS).map(([action, key]) => [key.toLowerCase(), action as QueueAction]))
    const onKey = (e: KeyboardEvent) => {
      if (pending || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLElement && (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) return
      const key = e.key.toLowerCase()
      const current = visible[focus]
      if (key === "j" || key === "arrowdown") {
        e.preventDefault()
        setFocus((f) => Math.min(f + 1, visible.length - 1))
      } else if (key === "k" || key === "arrowup") {
        e.preventDefault()
        setFocus((f) => Math.max(f - 1, 0))
      } else if (key === "x" && current) {
        setSelected((s) => {
          const next = new Set(s)
          if (next.has(current.id)) next.delete(current.id)
          else next.add(current.id)
          return next
        })
      } else if (keys[key] && current) {
        e.preventDefault()
        void act(keys[key], [current])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [visible, focus, pending, act])

  React.useEffect(() => {
    listRef.current?.children[focus]?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [focus])

  const bulk = visible.filter((i) => selected.has(i.id))

  return (
    <>
      <nav aria-label="Queue" className="flex flex-wrap gap-1 border-b pb-2">
        {TAB_LABELS.map((t) => {
          const count = "count" in t ? counts[t.count] : undefined
          return (
            <ButtonLink
              key={t.value}
              size="sm"
              variant={tab === t.value ? "secondary" : "ghost"}
              aria-current={tab === t.value ? "page" : undefined}
              href={`/moderation?tab=${t.value}`}
            >
              {t.label}
              {count ? (
                <Badge variant={t.value === "urgent" ? "destructive" : "outline"} className="tabular-nums">
                  {count}
                </Badge>
              ) : null}
            </ButtonLink>
          )
        })}
      </nav>

      {tab === "appeals" ? (
        <Appeals appeals={appeals} />
      ) : tab === "resolved" ? (
        <ResolvedTable rows={resolved} />
      ) : visible.length ? (
        <>
          {bulk.length ? (
            <div role="toolbar" aria-label="Bulk actions" className="sticky top-14 z-10 flex items-center gap-2 rounded-lg border bg-background p-2 shadow-soft">
              <span className="px-2 text-small font-medium">{bulk.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => act("approve", bulk)}>
                <CheckIcon data-icon="inline-start" aria-hidden />
                Approve all
              </Button>
              <Button size="sm" variant="outline" onClick={() => act("hide", bulk)}>
                <EyeOffIcon data-icon="inline-start" aria-hidden />
                Hide all
              </Button>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(visible.map((i) => i.id)))}>
                Select all {visible.length}
              </Button>
            </div>
          )}
          <ul ref={listRef} className="flex flex-col gap-3">
            {visible.map((item, index) => (
              <li key={item.id} onFocusCapture={() => setFocus(index)} onMouseDown={() => setFocus(index)}>
                <QueueItem
                  item={{ ...item, claimedBy: item.claimedBy && !item.claimedByMe ? item.claimedBy : item.claimedByMe ? "you" : undefined }}
                  focused={index === focus}
                  selected={selected.has(item.id)}
                  onSelectedChange={(on) =>
                    setSelected((s) => {
                      const next = new Set(s)
                      if (on) next.add(item.id)
                      else next.delete(item.id)
                      return next
                    })
                  }
                  onClaim={async () => {
                    const result = await claim(item.targetType, item.targetId)
                    if (result.error) toast.error(result.error)
                    else toast("Claimed. Other moderators will see it is yours.")
                  }}
                  onAction={(action) => act(action, [item])}
                />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          icon={PartyPopperIcon}
          title="Queue clear"
          description={tab === "urgent" ? "No urgent items. Check the reported tab next." : "Nothing waiting here. Thank you for keeping the community safe."}
        />
      )}

      <ReasonDialog pending={pending} onClose={() => setPending(null)} onDone={finish} />
    </>
  )
}
