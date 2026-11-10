"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArchiveIcon, ArchiveRestoreIcon, ArrowDownIcon, ArrowUpIcon, HeartIcon, PencilIcon, PlusIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { Button } from "@meridianher/ui/components/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@meridianher/ui/components/dialog"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@meridianher/ui/components/select"
import { toast } from "@meridianher/ui/components/sonner"
import { Switch } from "@meridianher/ui/components/switch"
import { Textarea } from "@meridianher/ui/components/textarea"
import { LAUNCH_SPACES, SPACE_ICONS, spaceToneStyle, type SpaceTone } from "@meridianher/ui/lib/spaces"

import { archiveSpace, reorderSpaces, saveSpace, type SpaceInput } from "@/lib/admin-actions"

type Space = {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  accent_color: SpaceTone
  rules: string[]
  tags: string[]
  min_age: number | null
  ask_expert_enabled: boolean
  show_crisis_card: boolean
  archived: boolean
  followers: number
}

// Each accent belongs to one launch space; reuse its name so the choice is recognisable
const TONES = LAUNCH_SPACES.map((s) => ({ value: s.tone, label: `${s.name} colour` }))
const ICONS = Object.keys(SPACE_ICONS).map((k) => ({ value: k, label: k }))
const AGES = [
  { value: "none", label: "Everyone 16 and over" },
  { value: "18", label: "18 and over only" },
]

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean)
const list = (s: string) => s.split(",").map((l) => l.trim()).filter(Boolean)

function SpaceDialog({ space, onClose }: { space: Space | "new" | null; onClose: () => void }) {
  const router = useRouter()
  const editing = space && space !== "new" ? space : null
  const [tone, setTone] = React.useState<SpaceTone>(editing?.accent_color ?? "periods")
  const [icon, setIcon] = React.useState(editing?.icon ?? "heart")
  const [age, setAge] = React.useState(editing?.min_age === 18 ? "18" : "none")
  const [askExpert, setAskExpert] = React.useState(editing?.ask_expert_enabled ?? true)
  const [crisis, setCrisis] = React.useState(editing?.show_crisis_card ?? false)
  const [error, setError] = React.useState<string>()
  if (!space) return null

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.name}` : "New space"}</DialogTitle>
        </DialogHeader>
        <form
          id="space-form"
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            const input: SpaceInput = {
              id: editing?.id,
              name: String(f.get("name")),
              slug: String(f.get("slug")),
              description: String(f.get("description")),
              icon,
              accent_color: tone,
              rules: lines(String(f.get("rules"))),
              tags: list(String(f.get("tags"))),
              min_age: age === "18" ? 18 : null,
              ask_expert_enabled: askExpert,
              show_crisis_card: crisis,
            }
            const result = await saveSpace(input)
            if (result.error) return setError(result.error)
            toast.success(editing ? "Space saved" : "Space created")
            onClose()
            router.refresh()
          }}
        >
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="space-name">Name</FieldLabel>
              <Input id="space-name" name="name" defaultValue={editing?.name} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="space-slug">Address</FieldLabel>
              <Input id="space-slug" name="slug" defaultValue={editing?.slug} required />
              <FieldDescription>/s/{editing?.slug ?? "address"}</FieldDescription>
            </Field>
          </FieldGroup>
          <Field>
            <FieldLabel htmlFor="space-description">Description</FieldLabel>
            <Textarea id="space-description" name="description" defaultValue={editing?.description} rows={2} required />
          </Field>
          <FieldGroup className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="space-tone">Accent colour</FieldLabel>
              <Select items={TONES} value={tone} onValueChange={(v) => v && setTone(v as SpaceTone)}>
                <SelectTrigger id="space-tone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span style={spaceToneStyle(t.value)} className="size-3 rounded-full bg-(--tone-ink)" aria-hidden />
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="space-icon">Icon</FieldLabel>
              <Select items={ICONS} value={icon} onValueChange={(v) => v && setIcon(v as string)}>
                <SelectTrigger id="space-icon" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((i) => {
                    const Icon = SPACE_ICONS[i.value]
                    return (
                      <SelectItem key={i.value} value={i.value}>
                        <Icon aria-hidden />
                        {i.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="space-age">Who can see it</FieldLabel>
              <Select items={AGES} value={age} onValueChange={(v) => v && setAge(v as string)}>
                <SelectTrigger id="space-age" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <Field>
            <FieldLabel htmlFor="space-rules">Extra rules, one per line (up to five)</FieldLabel>
            <Textarea id="space-rules" name="rules" defaultValue={editing?.rules.join("\n")} rows={3} />
          </Field>
          <Field>
            <FieldLabel htmlFor="space-tags">Tags, separated by commas</FieldLabel>
            <Input id="space-tags" name="tags" defaultValue={editing?.tags.join(", ")} />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="space-expert">Ask an expert</FieldLabel>
              <FieldDescription>Members can send questions here to the expert inbox.</FieldDescription>
            </FieldContent>
            <Switch id="space-expert" checked={askExpert} onCheckedChange={setAskExpert} />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="space-crisis">Always show crisis help</FieldLabel>
              <FieldDescription>For spaces like Mental health and Postpartum.</FieldDescription>
            </FieldContent>
            <Switch id="space-crisis" checked={crisis} onCheckedChange={setCrisis} />
          </Field>
          {error ? <p className="text-small text-destructive">{error}</p> : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="space-form">
            {editing ? "Save space" : "Create space"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SpacesManager({ spaces, header }: { spaces: Space[]; header: React.ReactNode }) {
  const router = useRouter()
  const [order, setOrder] = React.useState(spaces)
  const [editing, setEditing] = React.useState<Space | "new" | null>(null)
  React.useEffect(() => setOrder(spaces), [spaces])

  async function move(index: number, by: -1 | 1) {
    const next = [...order]
    const [item] = next.splice(index, 1)
    next.splice(index + by, 0, item)
    setOrder(next)
    const result = await reorderSpaces(next.map((s) => s.id))
    if (result.error) {
      toast.error(result.error)
      setOrder(order)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        {header}
        <Button onClick={() => setEditing("new")}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          New space
        </Button>
      </div>
      <ol className="flex flex-col gap-2">
        {order.map((s, i) => {
          const Icon = SPACE_ICONS[s.icon] ?? HeartIcon
          return (
            <li key={s.id}>
              <Card size="sm" style={spaceToneStyle(s.accent_color)} className={s.archived ? "opacity-60" : undefined}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                    <Icon className="size-4 text-(--tone-ink)" aria-hidden />
                    {s.name}
                    <span className="font-normal text-muted-foreground">/s/{s.slug}</span>
                    {s.archived ? <Badge variant="outline">Archived</Badge> : null}
                    {s.min_age ? <Badge variant="secondary">{s.min_age}+</Badge> : null}
                    {s.show_crisis_card ? <Badge variant="soft">Crisis help</Badge> : null}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {s.followers} following · {s.tags.length} tags · {s.rules.length} extra rules
                  </CardDescription>
                  <CardAction className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUpIcon />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Move ${s.name} down`} disabled={i === order.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDownIcon />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}>
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={s.archived ? `Restore ${s.name}` : `Archive ${s.name}`}
                      onClick={async () => {
                        const result = await archiveSpace(s.id, !s.archived)
                        if (result.error) return void toast.error(result.error)
                        toast(s.archived ? "Space restored" : "Space archived. Members no longer see it.")
                        router.refresh()
                      }}
                    >
                      {s.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                    </Button>
                  </CardAction>
                </CardHeader>
              </Card>
            </li>
          )
        })}
      </ol>
      <SpaceDialog key={editing === "new" ? "new" : (editing?.id ?? "none")} space={editing} onClose={() => setEditing(null)} />
    </>
  )
}
