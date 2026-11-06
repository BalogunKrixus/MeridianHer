"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CopyIcon, MoreHorizontalIcon, UserPlusIcon } from "lucide-react"
import { Button } from "@meridianher/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@meridianher/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@meridianher/ui/components/dropdown-menu"
import { Field, FieldDescription, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@meridianher/ui/components/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@meridianher/ui/components/select"
import { toast } from "@meridianher/ui/components/sonner"

import { inviteExpert, setExpertStatus } from "@/lib/expert-actions"
import { EXPERT_CATEGORY_LABELS } from "@/lib/format"

const CATEGORIES = Object.entries(EXPERT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))

export function InviteButton({ openOnLoad }: { openOnLoad: boolean }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(openOnLoad)
  const [category, setCategory] = React.useState("")
  const [link, setLink] = React.useState<string>()
  const [error, setError] = React.useState<string>()
  const [busy, setBusy] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlusIcon data-icon="inline-start" aria-hidden />
        Invite an expert
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) {
            setLink(undefined)
            setError(undefined)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{link ? "Invite ready" : "Invite an expert"}</DialogTitle>
            <DialogDescription>
              {link
                ? "Send this link to them. It works once and expires in 14 days."
                : "They get a shortened form with these details filled in. Their licence is still checked."}
            </DialogDescription>
          </DialogHeader>
          {link ? (
            <InputGroup>
              <InputGroupInput readOnly value={link} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  aria-label="Copy link"
                  size="icon-xs"
                  onClick={() => navigator.clipboard.writeText(link).then(() => toast("Link copied"))}
                >
                  <CopyIcon />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          ) : (
            <form
              id="invite-form"
              className="flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const form = new FormData(e.currentTarget)
                setBusy(true)
                const result = await inviteExpert({ name: String(form.get("name")), email: String(form.get("email")), category: category as never })
                setBusy(false)
                if (result.error) return setError(result.error)
                setLink(result.link)
                router.refresh()
              }}
            >
              <Field>
                <FieldLabel htmlFor="invite-name">Name</FieldLabel>
                <Input id="invite-name" name="name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                <Input id="invite-email" name="email" type="email" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-category">Category</FieldLabel>
                <Select items={CATEGORIES} value={category || null} onValueChange={(v) => setCategory((v as string) ?? "")}>
                  <SelectTrigger id="invite-category" className="w-full">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error ? <FieldDescription className="text-destructive">{error}</FieldDescription> : null}
              </Field>
            </form>
          )}
          <DialogFooter>
            {link ? (
              <Button onClick={() => setOpen(false)}>Done</Button>
            ) : (
              <Button type="submit" form="invite-form" disabled={busy || !category}>
                Create invite
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ExpertStatusMenu({ expert }: { expert: { id: string; name: string; status: "active" | "suspended" | "revoked" } }) {
  const router = useRouter()
  const [next, setNext] = React.useState<"active" | "suspended" | "revoked" | null>(null)
  const [reason, setReason] = React.useState("")
  const options = (
    [
      { status: "suspended", label: "Suspend badge" },
      { status: "revoked", label: "Revoke badge" },
      { status: "active", label: "Restore badge" },
    ] as const
  ).filter((o) => o.status !== expert.status)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${expert.name}`} />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {options.map((o) => (
            <DropdownMenuItem
              key={o.status}
              variant={o.status === "active" ? "default" : "destructive"}
              onClick={() => {
                setReason("")
                setNext(o.status)
              }}
            >
              {o.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={!!next} onOpenChange={(o) => !o && setNext(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {next === "active" ? "Restore" : next === "suspended" ? "Suspend" : "Revoke"} {expert.name}&apos;s badge
            </DialogTitle>
            <DialogDescription>
              {next === "active"
                ? "Their answers show the expert badge again."
                : "Past answers stay up but lose the badge and show Expert status ended. This takes effect straight away."}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="status-reason">Reason</FieldLabel>
            <Input id="status-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNext(null)}>
              Cancel
            </Button>
            <Button
              variant={next === "active" ? "default" : "destructive"}
              disabled={reason.trim().length < 5}
              onClick={async () => {
                if (!next) return
                const result = await setExpertStatus(expert.id, next, reason)
                if (result.error) return void toast.error(result.error)
                toast.success("Expert status updated")
                setNext(null)
                router.refresh()
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
