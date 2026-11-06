"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DownloadIcon, ExternalLinkIcon, LogOutIcon } from "lucide-react"
import { Button, ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Checkbox } from "@meridianher/ui/components/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { toast } from "@meridianher/ui/components/sonner"
import { Switch } from "@meridianher/ui/components/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@meridianher/ui/components/table"
import { Textarea } from "@meridianher/ui/components/textarea"

import { ConfirmDelete } from "@/components/confirm-delete"
import {
  appealSanction,
  changeDisplayName,
  deleteAccount,
  setHideActivity,
  setNotificationPref,
  updateExpertProfile,
} from "@/lib/account-actions"
import { signOut } from "@/lib/auth-actions"
import { clearDrafts } from "@/lib/drafts"
import type { NotificationKind } from "@/lib/format"

type Email = "off" | "immediate" | "digest"
type Pref = { kind: NotificationKind; label: string; locked?: boolean; inApp: boolean; email: Email }

function NameSection({ current, nextChange }: { current: string; nextChange: string | null }) {
  const [name, setName] = React.useState(current)
  const [error, setError] = React.useState<string>()
  const [pending, setPending] = React.useState(false)
  const locked = !!nextChange
  return (
    <Card render={<section aria-labelledby="settings-name" />}>
      <CardHeader>
        <CardTitle render={<h2 />} id="settings-name" className="text-h3">
          Display name
        </CardTitle>
        <CardDescription>This is the only name anyone sees. Your email and Google name are never shown.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-start"
          onSubmit={async (e) => {
            e.preventDefault()
            setPending(true)
            const result = await changeDisplayName(name)
            setPending(false)
            if (result.error) return setError(result.error)
            setError(undefined)
            toast.success(`You are now ${name.trim()}`)
          }}
        >
          <Field data-invalid={!!error} className="flex-1">
            <FieldLabel htmlFor="display-name" className="sr-only">
              Display name
            </FieldLabel>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={locked}
              minLength={3}
              maxLength={40}
              aria-invalid={!!error}
              aria-describedby="display-name-help"
            />
            <FieldDescription id="display-name-help">
              {locked ? `You can change it again on ${nextChange}.` : "You can change it once every 30 days."}
            </FieldDescription>
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
          <Button type="submit" disabled={locked || pending || name.trim() === current}>
            Save name
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PrivacySection({ hideActivity }: { hideActivity: boolean }) {
  const [hidden, setHidden] = React.useState(hideActivity)
  return (
    <Card render={<section aria-labelledby="settings-privacy" />}>
      <CardHeader>
        <CardTitle render={<h2 />} id="settings-privacy" className="text-h3">
          Privacy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="hide-activity">Hide my activity</FieldLabel>
            <FieldDescription>Your posts stay in their spaces, but are not listed together on your profile.</FieldDescription>
          </FieldContent>
          <Switch
            id="hide-activity"
            checked={hidden}
            onCheckedChange={async (next) => {
              setHidden(next)
              const result = await setHideActivity(next)
              if (result.error) {
                setHidden(!next)
                toast.error(result.error)
              } else toast(next ? "Your profile no longer lists your posts" : "Your profile lists your posts again")
            }}
          />
        </Field>
      </CardContent>
    </Card>
  )
}

function NotificationsSection({ prefs }: { prefs: Pref[] }) {
  const [rows, setRows] = React.useState(prefs)
  async function update(kind: NotificationKind, change: Partial<Pick<Pref, "inApp">>) {
    const before = rows
    const next = rows.map((r) => (r.kind === kind ? { ...r, ...change } : r))
    setRows(next)
    const row = next.find((r) => r.kind === kind)!
    const result = await setNotificationPref({ kind, inApp: row.inApp, email: row.email })
    if (result.error) {
      setRows(before)
      toast.error(result.error)
    }
  }
  return (
    <Card render={<section id="notifications" aria-labelledby="settings-notifications" />} className="scroll-mt-20">
      <CardHeader>
        <CardTitle render={<h2 />} id="settings-notifications" className="text-h3">
          Notifications
        </CardTitle>
        <CardDescription>Choose what shows up in your notifications.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tell me when</TableHead>
              <TableHead className="w-20 text-center">Notify me</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.kind}>
                <TableCell className="whitespace-normal">{r.label}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    aria-label={r.label}
                    checked={r.inApp}
                    disabled={r.locked}
                    onCheckedChange={(inApp) => update(r.kind, { inApp })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ExpertSection({ expert }: { expert: { handle: string; bio: string; available: boolean; renewalDue: string } }) {
  const [bio, setBio] = React.useState(expert.bio)
  const [available, setAvailable] = React.useState(expert.available)
  const [pending, setPending] = React.useState(false)
  const renewal = new Date(expert.renewalDue).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
  return (
    <Card render={<section aria-labelledby="settings-expert" />}>
      <CardHeader>
        <CardTitle render={<h2 />} id="settings-expert" className="text-h3">
          Expert profile
        </CardTitle>
        <CardDescription>Your verification renews on {renewal}. We will remind you a month before.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="expert-available">Taking questions</FieldLabel>
            <FieldDescription>Switch off when you are away. Members see that you are away for now.</FieldDescription>
          </FieldContent>
          <Switch id="expert-available" checked={available} onCheckedChange={setAvailable} />
        </Field>
        <Field>
          <FieldLabel htmlFor="expert-bio">Short bio</FieldLabel>
          <Textarea id="expert-bio" value={bio} maxLength={300} onChange={(e) => setBio(e.target.value)} rows={3} />
          <FieldDescription className="text-right tabular-nums">{bio.length} / 300</FieldDescription>
        </Field>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          disabled={pending}
          onClick={async () => {
            setPending(true)
            const result = await updateExpertProfile({ bio, available })
            setPending(false)
            if (result.error) toast.error(result.error)
            else toast.success("Expert profile saved")
          }}
        >
          Save expert profile
        </Button>
        <ButtonLink variant="ghost" href={`/e/${expert.handle}`}>
          <ExternalLinkIcon data-icon="inline-start" aria-hidden />
          View public profile
        </ButtonLink>
      </CardFooter>
    </Card>
  )
}

function DataSection() {
  const [open, setOpen] = React.useState(false)
  const [removeContent, setRemoveContent] = React.useState(false)
  const [confirmation, setConfirmation] = React.useState("")
  const [error, setError] = React.useState<string>()
  return (
    <Card render={<section aria-labelledby="settings-data" />}>
      <CardHeader>
        <CardTitle render={<h2 />} id="settings-data" className="text-h3">
          Your data and account
        </CardTitle>
        <CardDescription>Your data is yours. Take a copy, or leave whenever you want.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <ButtonLink variant="outline" href="/settings/export" download>
          <DownloadIcon data-icon="inline-start" aria-hidden />
          Download my data
        </ButtonLink>
        <Button variant="outline" onClick={() => {
          clearDrafts()
          void signOut()
        }}>
          <LogOutIcon data-icon="inline-start" aria-hidden />
          Sign out
        </Button>
        <Button variant="ghost" className="text-destructive sm:ml-auto" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      </CardContent>
      <ConfirmDelete
        open={open}
        onOpenChange={setOpen}
        title="Delete your account?"
        description="Your account, saved list and settings are deleted straight away. This cannot be undone."
        confirmLabel="Delete my account"
        onConfirm={async () => {
          clearDrafts()
          const result = await deleteAccount(removeContent, confirmation)
          if (result?.error) setError(result.error)
        }}
      >
        <div className="flex flex-col gap-4">
          <Field orientation="horizontal">
            <Checkbox id="remove-content" checked={removeContent} onCheckedChange={(v) => setRemoveContent(!!v)} />
            <FieldContent>
              <FieldLabel htmlFor="remove-content">Also delete my posts and replies</FieldLabel>
              <FieldDescription>Otherwise they stay up as Former member, so answers that help others are not lost.</FieldDescription>
            </FieldContent>
          </Field>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="delete-confirm">Type delete to confirm</FieldLabel>
            <Input id="delete-confirm" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
        </div>
      </ConfirmDelete>
    </Card>
  )
}

type Sanction = { id: string; kind: "warn" | "mute" | "ban"; reason: string; until: string | null; appealStatus: string | null; at: string }

const SANCTION_LABEL = { warn: "Warning", mute: "Mute", ban: "Ban" } as const

/** Her moderation history, with one appeal per decision (PRD section 8). */
function StandingSection({ sanctions, status }: { sanctions: Sanction[]; status: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState("")
  const [error, setError] = React.useState<string>()
  const [pending, setPending] = React.useState(false)
  return (
    <Card render={<section id="standing" aria-labelledby="settings-standing" />} className="scroll-mt-20">
      <CardHeader>
        <CardTitle render={<h2 />} id="settings-standing" className="text-h3">
          Account standing
        </CardTitle>
        <CardDescription>
          {status === "active"
            ? "Your account is in good standing."
            : status === "muted"
              ? "Your account is muted for now. You can read everything, and posting comes back when the mute ends."
              : "Your account is banned."}{" "}
          If you think a decision was wrong, you can appeal it once and a different moderator will look at it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {sanctions.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 py-3 first:pt-0">
              <p className="text-small">
                <span className="font-medium">{SANCTION_LABEL[s.kind]}</span>
                <span className="text-muted-foreground"> · {s.at}</span>
              </p>
              <p className="text-body">{s.reason}</p>
              {s.appealStatus === "pending" ? (
                <p className="text-small text-muted-foreground">Appeal sent. We will let you know the outcome.</p>
              ) : s.appealStatus === "overturned" ? (
                <p className="text-small text-success">Appeal accepted. This decision was reversed.</p>
              ) : s.appealStatus === "upheld" ? (
                <p className="text-small text-muted-foreground">Appeal reviewed. The decision stands.</p>
              ) : open === s.id ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setPending(true)
                    const result = await appealSanction(s.id, message)
                    setPending(false)
                    if (result.error) return setError(result.error)
                    setOpen(null)
                    setMessage("")
                    toast.success("Appeal sent")
                    router.refresh()
                  }}
                >
                  <Field data-invalid={!!error}>
                    <FieldLabel htmlFor={`appeal-${s.id}`}>Why should we look again?</FieldLabel>
                    <Textarea id={`appeal-${s.id}`} rows={3} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />
                    {error ? <FieldError>{error}</FieldError> : null}
                  </Field>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={pending || message.trim().length < 10}>
                      Send appeal
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => {
                    setError(undefined)
                    setOpen(s.id)
                  }}
                >
                  Appeal this decision
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function SettingsForm({
  sanctions,
  status,
  displayName,
  nextNameChange,
  hideActivity,
  prefs,
  expert,
}: {
  displayName: string
  nextNameChange: string | null
  hideActivity: boolean
  prefs: Pref[]
  expert: { handle: string; bio: string; available: boolean; renewalDue: string } | null
  sanctions: Sanction[]
  status: string
}) {
  return (
    <>
      {sanctions.length || status !== "active" ? <StandingSection sanctions={sanctions} status={status} /> : null}
      <NameSection current={displayName} nextChange={nextNameChange} />
      {expert ? <ExpertSection expert={expert} /> : null}
      <PrivacySection hideActivity={hideActivity} />
      <NotificationsSection prefs={prefs} />
      <Card render={<section aria-labelledby="settings-spaces" />}>
        <CardHeader>
          <CardTitle render={<h2 />} id="settings-spaces" className="text-h3">
            Your spaces
          </CardTitle>
          <CardDescription>The spaces you follow shape your home feed.</CardDescription>
        </CardHeader>
        <CardFooter>
          <ButtonLink variant="outline" href="/spaces">
            Choose spaces
          </ButtonLink>
        </CardFooter>
      </Card>
      <DataSection />
    </>
  )
}
