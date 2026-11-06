"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BanIcon, EyeIcon, TimerIcon, TriangleAlertIcon, UndoIcon, UserXIcon } from "lucide-react"
import { Button } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Checkbox } from "@meridianher/ui/components/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@meridianher/ui/components/dialog"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@meridianher/ui/components/select"
import { Separator } from "@meridianher/ui/components/separator"
import { toast } from "@meridianher/ui/components/sonner"
import { Textarea } from "@meridianher/ui/components/textarea"

import { REASON_TEMPLATES } from "@/lib/format"
import { addNote, deleteMember, revealPii, setRole } from "@/lib/member-actions"
import { sanction } from "@/lib/moderation-actions"

type Member = { id: string; name: string; role: string; status: string }
type Sanction = "warn" | "mute" | "ban"

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "expert", label: "Expert" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super admin" },
]

export function NoteForm({ member }: { member: string }) {
  const [note, setNote] = React.useState("")
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        const result = await addNote(member, note)
        if (result.error) return void toast.error(result.error)
        setNote("")
        toast("Note saved")
      }}
    >
      <Textarea aria-label="New note" placeholder="Add context for the team" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" size="sm" variant="outline" className="self-end" disabled={!note.trim()}>
        Add note
      </Button>
    </form>
  )
}

export function MemberActions({ member, isAdmin, isSuperAdmin, isMe }: { member: Member; isAdmin: boolean; isSuperAdmin: boolean; isMe: boolean }) {
  const router = useRouter()
  const [dialog, setDialog] = React.useState<Sanction | "reveal" | "delete" | null>(null)
  const [reason, setReason] = React.useState("")
  const [days, setDays] = React.useState("1")
  const [field, setField] = React.useState<"email" | "google_name">("email")
  const [revealed, setRevealed] = React.useState<Record<string, string | null>>({})
  const [removeContent, setRemoveContent] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const staffTarget = ["moderator", "admin", "super_admin"].includes(member.role)
  const canSanction = !isMe && (!staffTarget || isSuperAdmin)

  const open = (d: typeof dialog) => {
    setReason("")
    setDialog(d)
  }

  async function run(fn: () => Promise<{ error?: string }>, done: string) {
    setBusy(true)
    const result = await fn()
    setBusy(false)
    if (result.error) return void toast.error(result.error)
    toast.success(done)
    setDialog(null)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Actions</CardTitle>
        {!canSanction ? <CardDescription>{isMe ? "This is your own account." : "Only a super admin can sanction team members."}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {member.status !== "banned" ? (
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" disabled={!canSanction} onClick={() => open("warn")}>
              <TriangleAlertIcon data-icon="inline-start" aria-hidden />
              Warn
            </Button>
            <Button variant="outline" size="sm" disabled={!canSanction} onClick={() => open("mute")}>
              <TimerIcon data-icon="inline-start" aria-hidden />
              {member.status === "muted" ? "Mute again" : "Mute"}
            </Button>
            <Button variant="destructive" size="sm" disabled={!canSanction} onClick={() => open("ban")}>
              <BanIcon data-icon="inline-start" aria-hidden />
              Ban
            </Button>
          </div>
        ) : null}
        {member.status !== "active" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={!canSanction || busy}
            onClick={() =>
              run(
                () => sanction({ member: member.id, kind: member.status === "muted" ? "unmute" : "unban" }),
                member.status === "muted" ? "Mute lifted" : "Ban lifted"
              )
            }
          >
            <UndoIcon data-icon="inline-start" aria-hidden />
            {member.status === "muted" ? "Lift mute" : "Lift ban"}
          </Button>
        ) : null}

        {isAdmin ? (
          <>
            <Separator className="my-2" />
            <Field>
              <FieldLabel htmlFor="member-role">Role</FieldLabel>
              <Select
                items={ROLE_OPTIONS.filter((r) => isSuperAdmin || !["admin", "super_admin"].includes(r.value) || r.value === member.role)}
                value={member.role}
                onValueChange={(v) => v && v !== member.role && run(() => setRole(member.id, v as never), "Role updated")}
              >
                <SelectTrigger id="member-role" className="w-full" disabled={isMe}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.filter((r) => isSuperAdmin || !["admin", "super_admin"].includes(r.value) || r.value === member.role).map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Experts are made through the expert review, so their badge has a verified licence.</FieldDescription>
            </Field>
            <Separator className="my-2" />
            {Object.entries(revealed).map(([k, v]) => (
              <p key={k} className="text-small">
                <span className="text-muted-foreground">{k === "email" ? "Email" : "Google name"}:</span>{" "}
                <span className="font-mono">{v ?? "not set"}</span>
              </p>
            ))}
            <Button variant="ghost" size="sm" className="justify-start" onClick={() => open("reveal")}>
              <EyeIcon data-icon="inline-start" aria-hidden />
              Reveal email or Google name
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-destructive" disabled={isMe || staffTarget} onClick={() => open("delete")}>
              <UserXIcon data-icon="inline-start" aria-hidden />
              Delete account on request
            </Button>
          </>
        ) : null}
      </CardContent>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog === "reveal"
                ? "Reveal private details"
                : dialog === "delete"
                  ? `Delete ${member.name}'s account`
                  : `${dialog === "warn" ? "Warn" : dialog === "mute" ? "Mute" : "Ban"} ${member.name}`}
            </DialogTitle>
            <DialogDescription>
              {dialog === "reveal"
                ? "Only reveal what you need. Your name, the reason and the time are logged."
                : dialog === "delete"
                  ? "Use this only when the member asked. It cannot be undone."
                  : "The member sees this reason."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {dialog === "reveal" ? (
              <Field>
                <FieldLabel htmlFor="pii-field">What to reveal</FieldLabel>
                <Select
                  items={[
                    { value: "email", label: "Email address" },
                    { value: "google_name", label: "Google name" },
                  ]}
                  value={field}
                  onValueChange={(v) => setField((v as typeof field) ?? "email")}
                >
                  <SelectTrigger id="pii-field" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email address</SelectItem>
                    <SelectItem value="google_name">Google name</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
            {dialog === "warn" || dialog === "mute" || dialog === "ban" ? (
              <div className="flex flex-wrap gap-1.5">
                {REASON_TEMPLATES.map((t) => (
                  <Button key={t.code} type="button" variant="outline" size="xs" onClick={() => setReason(t.text)}>
                    {t.label}
                  </Button>
                ))}
              </div>
            ) : null}
            <Field>
              <FieldLabel htmlFor="action-reason">Reason</FieldLabel>
              {dialog === "reveal" || dialog === "delete" ? (
                <Input id="action-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={dialog === "reveal" ? "Member asked for a data export" : "Member emailed to ask"} />
              ) : (
                <Textarea id="action-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              )}
            </Field>
            {dialog === "mute" ? (
              <Field>
                <FieldLabel htmlFor="mute-length">Mute for</FieldLabel>
                <Input id="mute-length" type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} className="w-28" />
              </Field>
            ) : null}
            {dialog === "delete" ? (
              <Field orientation="horizontal">
                <Checkbox id="remove-posts" checked={removeContent} onCheckedChange={(v) => setRemoveContent(!!v)} />
                <FieldContent>
                  <FieldLabel htmlFor="remove-posts">Also delete their posts and replies</FieldLabel>
                  <FieldDescription>Otherwise they stay up as Former member.</FieldDescription>
                </FieldContent>
              </Field>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={dialog === "ban" || dialog === "delete" ? "destructive" : "default"}
              disabled={busy || reason.trim().length < 3}
              onClick={async () => {
                if (dialog === "reveal") {
                  setBusy(true)
                  const result = await revealPii(member.id, field, reason)
                  setBusy(false)
                  if (result.error) return void toast.error(result.error)
                  setRevealed({ ...revealed, [field]: result.value ?? null })
                  setDialog(null)
                } else if (dialog === "delete") {
                  await run(() => deleteMember(member.id, removeContent, reason), "Account deleted")
                  router.push("/members")
                } else if (dialog) {
                  await run(
                    () => sanction({ member: member.id, kind: dialog, reason, days: dialog === "mute" ? Number(days) || 1 : undefined }),
                    dialog === "warn" ? "Warning sent" : dialog === "mute" ? "Member muted" : "Member banned"
                  )
                }
              }}
            >
              {dialog === "reveal" ? "Reveal" : dialog === "delete" ? "Delete account" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
