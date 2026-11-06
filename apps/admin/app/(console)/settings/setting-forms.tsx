"use client"

import * as React from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@meridianher/ui/components/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { toast } from "@meridianher/ui/components/sonner"
import { Textarea } from "@meridianher/ui/components/textarea"
import type { CrisisCountry } from "@meridianher/ui/patterns/cards"

import { saveSetting } from "@/lib/admin-actions"

async function save(key: Parameters<typeof saveSetting>[0], value: unknown, done = "Saved") {
  const result = await saveSetting(key, value)
  if (result.error) toast.error(result.error)
  else toast.success(done)
  return !result.error
}

export function ListSetting({
  setting,
  title,
  description,
  initial,
}: {
  setting: "blocked_words" | "allowed_link_domains" | "crisis_keywords"
  title: string
  description: string
  initial: string[]
}) {
  const [text, setText] = React.useState(initial.join("\n"))
  const items = [...new Set(text.split("\n").map((l) => l.trim()).filter(Boolean))]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea aria-label={title} rows={8} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-xs" />
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-small text-muted-foreground tabular-nums">{items.length} entries</span>
        <Button size="sm" onClick={() => save(setting, items, `${title} saved`)}>
          Save
        </Button>
      </CardFooter>
    </Card>
  )
}

export function CrisisEditor({ initial }: { initial: CrisisCountry[] }) {
  const [countries, setCountries] = React.useState(initial)
  const update = (ci: number, fn: (c: CrisisCountry) => CrisisCountry) => setCountries(countries.map((c, i) => (i === ci ? fn(c) : c)))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Crisis resources</CardTitle>
        <CardDescription>Shown on the help page, in Mental health and Postpartum, and after a post with crisis words. Check every number before launch.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setCountries([...countries, { country: "", resources: [{ name: "" }] }])}>
            <PlusIcon data-icon="inline-start" aria-hidden />
            Add country
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {countries.map((c, ci) => (
          <Card key={ci} variant="flat" size="sm">
            <CardHeader>
              <Field>
                <FieldLabel htmlFor={`country-${ci}`}>Country</FieldLabel>
                <Input id={`country-${ci}`} value={c.country} onChange={(e) => update(ci, (x) => ({ ...x, country: e.target.value }))} />
              </Field>
              <CardAction>
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${c.country || "country"}`} onClick={() => setCountries(countries.filter((_, i) => i !== ci))}>
                  <Trash2Icon />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {c.resources.map((r, ri) => {
                const set = (patch: Partial<typeof r>) => update(ci, (x) => ({ ...x, resources: x.resources.map((y, j) => (j === ri ? { ...y, ...patch } : y)) }))
                return (
                  <FieldGroup key={ri} className="grid grid-cols-[1fr_1fr_8rem_auto] items-end gap-2">
                    <Field>
                      <FieldLabel htmlFor={`r-${ci}-${ri}-name`} className="text-xs">Name</FieldLabel>
                      <Input id={`r-${ci}-${ri}-name`} value={r.name} onChange={(e) => set({ name: e.target.value })} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`r-${ci}-${ri}-detail`} className="text-xs">Detail</FieldLabel>
                      <Input id={`r-${ci}-${ri}-detail`} value={r.detail ?? ""} onChange={(e) => set({ detail: e.target.value || undefined })} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`r-${ci}-${ri}-phone`} className="text-xs">Phone</FieldLabel>
                      <Input id={`r-${ci}-${ri}-phone`} value={r.phone ?? ""} inputMode="tel" onChange={(e) => set({ phone: e.target.value || undefined })} />
                    </Field>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${r.name || "line"}`}
                      onClick={() => update(ci, (x) => ({ ...x, resources: x.resources.filter((_, j) => j !== ri) }))}
                    >
                      <Trash2Icon />
                    </Button>
                  </FieldGroup>
                )
              })}
              <Button variant="ghost" size="sm" className="self-start" onClick={() => update(ci, (x) => ({ ...x, resources: [...x.resources, { name: "" }] }))}>
                <PlusIcon data-icon="inline-start" aria-hidden />
                Add a line
              </Button>
            </CardContent>
          </Card>
        ))}
      </CardContent>
      <CardFooter>
        <Button
          onClick={() =>
            save(
              "crisis_resources",
              countries
                .filter((c) => c.country.trim())
                .map((c) => ({ ...c, resources: c.resources.filter((r) => r.name.trim()) })),
              "Crisis resources saved"
            )
          }
        >
          Save crisis resources
        </Button>
      </CardFooter>
    </Card>
  )
}

export function RulesSetting({
  hold,
  limits,
  threshold,
}: {
  hold: { hours: number; items: number }
  limits: { posts_per_hour: number; replies_per_hour: number }
  threshold: number
}) {
  const [values, setValues] = React.useState({ ...hold, ...limits, threshold })
  const num = (k: keyof typeof values) => ({
    value: values[k],
    type: "number" as const,
    inputMode: "numeric" as const,
    min: 0,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [k]: Number(e.target.value) }),
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Posting rules</CardTitle>
        <CardDescription>New account checks, rate limits and when reports hide content automatically.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field>
            <FieldLabel htmlFor="hold-hours">New account window (hours)</FieldLabel>
            <Input id="hold-hours" {...num("hours")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="hold-items">Posts held in that window</FieldLabel>
            <Input id="hold-items" {...num("items")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="posts-hour">Posts per hour</FieldLabel>
            <Input id="posts-hour" {...num("posts_per_hour")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="replies-hour">Replies per hour</FieldLabel>
            <Input id="replies-hour" {...num("replies_per_hour")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="threshold">Reports to auto hide</FieldLabel>
            <Input id="threshold" {...num("threshold")} />
            <FieldDescription>From different members</FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button
          onClick={async () => {
            for (const [key, value] of [
              ["new_account_hold", { hours: values.hours, items: values.items }],
              ["rate_limits", { posts_per_hour: values.posts_per_hour, replies_per_hour: values.replies_per_hour }],
              ["report_auto_hide_threshold", values.threshold],
            ] as const) {
              const result = await saveSetting(key, value)
              if (result.error) return void toast.error(result.error)
            }
            toast.success("Posting rules saved")
          }}
        >
          Save posting rules
        </Button>
      </CardFooter>
    </Card>
  )
}
