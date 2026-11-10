"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@meridianher/ui/components/button"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@meridianher/ui/components/select"
import { toast } from "@meridianher/ui/components/sonner"
import { Switch } from "@meridianher/ui/components/switch"
import { Textarea } from "@meridianher/ui/components/textarea"
import { RichTextEditor, type JSONContent } from "@meridianher/ui/patterns/rich-text-editor"

import { endBanner, publishTeamPost, scheduleBanner } from "@/lib/admin-actions"
import { communityPost } from "@/lib/community"

type SpaceOption = { id: string; name: string }

function SpaceSelect({ id, spaces, value, onChange, everywhere }: { id: string; spaces: SpaceOption[]; value: string; onChange: (v: string) => void; everywhere?: boolean }) {
  const items = [...(everywhere ? [{ value: "all", label: "Every page" }] : []), ...spaces.map((s) => ({ value: s.id, label: s.name }))]
  return (
    <Select items={items} value={value || null} onValueChange={(v) => onChange((v as string) ?? "")}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Choose a space" />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function TeamPostForm({ spaces }: { spaces: SpaceOption[] }) {
  const router = useRouter()
  const [space, setSpace] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState<JSONContent>()
  const [pin, setPin] = React.useState(true)
  const [announcement, setAnnouncement] = React.useState(true)
  const [editorKey, setEditorKey] = React.useState(0)
  const [busy, setBusy] = React.useState(false)
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        const result = await publishTeamPost({ space, title, body, pin, announcement })
        setBusy(false)
        if (result.error || !result.id) return void toast.error(result.error ?? "Something went wrong.")
        toast.success("Published", { action: { label: "View", onClick: () => window.open(communityPost(result.id!), "_blank") } })
        setTitle("")
        setBody(undefined)
        setEditorKey((k) => k + 1)
        router.refresh()
      }}
    >
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="team-space">Space</FieldLabel>
          <SpaceSelect id="team-space" spaces={spaces} value={space} onChange={setSpace} />
        </Field>
        <Field>
          <FieldLabel htmlFor="team-title">Title</FieldLabel>
          <Input id="team-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
        </Field>
      </FieldGroup>
      <Field>
        <FieldLabel>Message</FieldLabel>
        <RichTextEditor key={editorKey} aria-label="Team post message" onChange={(v) => setBody(v.json)} maxLength={5000} />
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="team-pin">Pin to the top of the space</FieldLabel>
        </FieldContent>
        <Switch id="team-pin" checked={pin} onCheckedChange={setPin} />
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="team-announcement">Show as an announcement</FieldLabel>
          <FieldDescription>Announcements get their own style above the feed.</FieldDescription>
        </FieldContent>
        <Switch id="team-announcement" checked={announcement} onCheckedChange={setAnnouncement} />
      </Field>
      <Button type="submit" className="self-start" disabled={busy || !space || title.trim().length < 10}>
        Publish as MeridianHer Team
      </Button>
    </form>
  )
}

const localNow = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function BannerForm({ spaces }: { spaces: SpaceOption[] }) {
  const router = useRouter()
  const [space, setSpace] = React.useState("all")
  const [body, setBody] = React.useState("")
  const [starts, setStarts] = React.useState(localNow)
  const [ends, setEnds] = React.useState("")
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        const result = await scheduleBanner({
          body,
          space: space === "all" ? null : space,
          startsAt: new Date(starts).toISOString(),
          endsAt: ends ? new Date(ends).toISOString() : null,
        })
        if (result.error) return void toast.error(result.error)
        toast.success("Banner scheduled")
        setBody("")
        router.refresh()
      }}
    >
      <Field>
        <FieldLabel htmlFor="banner-body">Message</FieldLabel>
        <Textarea id="banner-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={280} rows={2} />
        <FieldDescription className="text-right tabular-nums">{body.length} / 280</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="banner-space">Where</FieldLabel>
        <SpaceSelect id="banner-space" spaces={spaces} value={space} onChange={setSpace} everywhere />
      </Field>
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="banner-start">Starts</FieldLabel>
          <Input id="banner-start" type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="banner-end">Ends (optional)</FieldLabel>
          <Input id="banner-end" type="datetime-local" value={ends} min={starts} onChange={(e) => setEnds(e.target.value)} />
        </Field>
      </FieldGroup>
      <Button type="submit" className="self-start" disabled={body.trim().length < 5}>
        Schedule banner
      </Button>
    </form>
  )
}

export function EndBannerButton({ id }: { id: string }) {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        const result = await endBanner(id)
        if (result.error) return void toast.error(result.error)
        toast("Banner ended")
        router.refresh()
      }}
    >
      End now
    </Button>
  )
}
