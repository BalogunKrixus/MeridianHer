"use client"

import * as React from "react"
import { cn } from "../lib/utils"
import { SearchIcon, SparklesIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "../components/alert"
import { Button } from "../components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../components/field"
import { Input } from "../components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select"
import { Spinner } from "../components/spinner"
import { Switch } from "../components/switch"
import { ToggleGroup, ToggleGroupItem } from "../components/toggle-group"
import type { SpaceTone } from "../lib/spaces"
import { CONTENT_WARNING_LABELS, type ContentWarningType } from "./content-warning-blur"
import { RichTextEditor, type JSONContent } from "./rich-text-editor"

export type ComposerSpace = {
  slug: string
  name: string
  tone: SpaceTone
  tags: string[]
  askExpertEnabled: boolean
}

export type ComposerValues = {
  type: "question" | "discussion"
  space: string
  title: string
  body?: JSONContent
  tags: string[]
  contentWarning: ContentWarningType | null
  askExpert: boolean
  anonymous: boolean
}

const TITLE_MIN = 10
const TITLE_MAX = 150

/**
 * Post composer (PRD 6.5). Full page at /ask, or inside a Sheet on mobile.
 * Validates locally for instant feedback; the server action validates again with Zod.
 */
function Composer({
  spaces,
  defaultSpace,
  similar,
  submitting,
  onSubmit,
  className,
}: {
  spaces: ComposerSpace[]
  defaultSpace?: string
  /** "Others asked this" results for the current title */
  similar?: React.ReactNode
  submitting?: boolean
  onSubmit?: (values: ComposerValues) => void
  className?: string
}) {
  const [type, setType] = React.useState<ComposerValues["type"]>("question")
  const [space, setSpace] = React.useState(defaultSpace ?? "")
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState<{ json: JSONContent; text: string }>()
  const [tags, setTags] = React.useState<string[]>([])
  const [warn, setWarn] = React.useState(false)
  const [warnType, setWarnType] = React.useState<ContentWarningType>("pregnancy-loss")
  const [askExpert, setAskExpert] = React.useState(false)
  const [anonymous, setAnonymous] = React.useState(false)
  const [touched, setTouched] = React.useState(false)

  const current = spaces.find((s) => s.slug === space)
  const titleLen = title.trim().length
  const errors = {
    space: !space ? "Choose a space for your post." : null,
    title:
      titleLen < TITLE_MIN
        ? `Your title needs at least ${TITLE_MIN} characters.`
        : titleLen > TITLE_MAX
          ? `Keep your title under ${TITLE_MAX} characters.`
          : null,
    body: (body?.text.length ?? 0) > 5000 ? "Keep your post under 5,000 characters." : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const expertEligible = type === "question" && !!current?.askExpertEnabled

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (hasErrors) return
    onSubmit?.({
      type,
      space,
      title: title.trim(),
      body: body?.json,
      tags,
      contentWarning: warn ? warnType : null,
      askExpert: expertEligible && askExpert,
      anonymous,
    })
  }

  return (
    <form onSubmit={submit} noValidate className={cn("flex flex-col gap-6", className)}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">What kind of post is this?</FieldLegend>
          <ToggleGroup
            value={[type]}
            onValueChange={(v) => v[0] && setType(v[0] as ComposerValues["type"])}
            variant="outline"
            spacing={0}
            className="w-full sm:w-auto"
          >
            <ToggleGroupItem value="question" className="flex-1 sm:flex-none">
              Question
            </ToggleGroupItem>
            <ToggleGroupItem value="discussion" className="flex-1 sm:flex-none">
              Discussion
            </ToggleGroupItem>
          </ToggleGroup>
          <FieldDescription>
            {type === "question"
              ? "Ask something and get answers from members and verified experts."
              : "Share an experience. No answer expected."}
          </FieldDescription>
        </FieldSet>

        <Field data-invalid={touched && !!errors.space}>
          <FieldLabel htmlFor="composer-space">Space</FieldLabel>
          <Select
            items={spaces.map((s) => ({ label: s.name, value: s.slug }))}
            value={space || null}
            onValueChange={(v) => {
              setSpace((v as string) ?? "")
              setTags([])
            }}
          >
            <SelectTrigger id="composer-space" className="w-full" aria-invalid={touched && !!errors.space}>
              <SelectValue placeholder="Choose a space" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched && errors.space ? <FieldError>{errors.space}</FieldError> : null}
        </Field>

        <Field data-invalid={touched && !!errors.title}>
          <FieldLabel htmlFor="composer-title">Title</FieldLabel>
          <Input
            id="composer-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "question" ? "Is it normal to bleed between periods?" : "What helped me through my first month postpartum"}
            maxLength={TITLE_MAX + 20}
            aria-invalid={touched && !!errors.title}
            aria-describedby="composer-title-count"
          />
          <FieldDescription id="composer-title-count" className="text-right text-xs tabular-nums">
            {titleLen} / {TITLE_MAX}
          </FieldDescription>
          {touched && errors.title ? <FieldError>{errors.title}</FieldError> : null}
        </Field>

        {similar && titleLen >= TITLE_MIN ? (
          <Alert role="status">
            <SearchIcon aria-hidden />
            <AlertTitle>Others asked this</AlertTitle>
            <AlertDescription>{similar}</AlertDescription>
          </Alert>
        ) : null}

        <Field data-invalid={touched && !!errors.body}>
          <FieldLabel htmlFor="composer-body">
            Details <span className="font-normal text-muted-foreground">(optional)</span>
          </FieldLabel>
          <RichTextEditor
            id="composer-body"
            onChange={setBody}
            placeholder="Add anything that helps others understand. Say the real words; this is a safe place."
            invalid={touched && !!errors.body}
          />
        </Field>

        {current && current.tags.length ? (
          <FieldSet>
            <FieldLegend variant="label">Tags</FieldLegend>
            <FieldDescription>Choose up to 3.</FieldDescription>
            <ToggleGroup
              multiple
              aria-label="Tags"
              variant="chip"
              className="flex-wrap"
              value={tags}
              onValueChange={(v) => v.length <= 3 && setTags(v as string[])}
            >
              {current.tags.map((t) => (
                <ToggleGroupItem key={t} value={t}>
                  {t}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FieldSet>
        ) : null}

        <FieldSet>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="composer-warning">Add a content warning</FieldLabel>
              <FieldDescription>The post is blurred until someone chooses to read it.</FieldDescription>
            </FieldContent>
            <Switch id="composer-warning" checked={warn} onCheckedChange={setWarn} />
          </Field>
          {warn ? (
            <Select
              items={Object.entries(CONTENT_WARNING_LABELS).map(([value, label]) => ({ value, label }))}
              value={warnType}
              onValueChange={(v) => v && setWarnType(v as ContentWarningType)}
            >
              <SelectTrigger aria-label="Content warning type" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTENT_WARNING_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {expertEligible ? (
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="composer-expert">
                  <SparklesIcon className="size-4 text-expert" aria-hidden /> Ask an expert
                </FieldLabel>
                <FieldDescription>Verified experts in this space will see your question in their inbox.</FieldDescription>
              </FieldContent>
              <Switch id="composer-expert" checked={askExpert} onCheckedChange={setAskExpert} />
            </Field>
          ) : null}

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="composer-anon">Post anonymously to everyone</FieldLabel>
              <FieldDescription>
                Your display name is hidden and shows as Anonymous member. Our moderators can still see your account to keep everyone safe.
              </FieldDescription>
            </FieldContent>
            <Switch id="composer-anon" checked={anonymous} onCheckedChange={setAnonymous} />
          </Field>
        </FieldSet>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Drafts save on this device as you type.</p>
        <Button type="submit" size="lg" disabled={submitting} className="sm:min-w-40">
          {submitting ? <Spinner data-icon="inline-start" /> : null}
          {type === "question" ? "Ask your question" : "Share your post"}
        </Button>
      </div>
    </form>
  )
}

export { Composer }
