"use client"

import * as React from "react"
import { DownloadIcon, ExternalLinkIcon, LogOutIcon } from "lucide-react"
import { Button, ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Checkbox } from "@meridianher/ui/components/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@meridianher/ui/components/select"
import { toast } from "@meridianher/ui/components/sonner"
import { Switch } from "@meridianher/ui/components/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@meridianher/ui/components/table"
import { Textarea } from "@meridianher/ui/components/textarea"

import { ConfirmDelete } from "@/components/confirm-delete"
import {
  changeDisplayName,
  deleteAccount,
  setHideActivity,
  setNotificationPref,
  updateExpertProfile,
} from "@/lib/account-actions"
import { signOut } from "@/lib/auth-actions"
import type { NotificationKind } from "@/lib/format"

type Email = "off" | "immediate" | "digest"
type Pref = { kind: NotificationKind; label: string; locked?: boolean; inApp: boolean; email: Email }

const EMAIL_OPTIONS: { value: Email; label: string }[] = [
  { value: "immediate", label: "Straight away" },
  { value: "digest", label: "Daily summary" },
  { value: "off", label: "Off" },
]

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
  async function update(kind: NotificationKind, change: Partial<Pick<Pref, "inApp" | "email">>) {
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
        <CardDescription>
          Emails never include what anyone wrote, only that something new is waiting for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tell me when</TableHead>
              <TableHead className="w-20 text-center">In app</TableHead>
              <TableHead className="w-40">Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.kind}>
                <TableCell className="whitespace-normal">{r.label}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    aria-label={`${r.label}, in app`}
                    checked={r.inApp}
                    disabled={r.locked}
                    onCheckedChange={(inApp) => update(r.kind, { inApp })}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    items={EMAIL_OPTIONS}
                    value={r.email}
                    onValueChange={(v) => v && update(r.kind, { email: v as Email })}
                  >
                    <SelectTrigger size="sm" className="w-full" aria-label={`${r.label}, email`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        <Button variant="outline" onClick={() => signOut()}>
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

export function SettingsForm({
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
}) {
  return (
    <>
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
