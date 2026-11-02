"use client"

import * as React from "react"
import { HeartIcon, LockKeyholeIcon, PhoneIcon, TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription } from "@meridianher/ui/components/alert"
import { Button } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Checkbox } from "@meridianher/ui/components/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { Label } from "@meridianher/ui/components/label"
import { Spinner } from "@meridianher/ui/components/spinner"
import { ToggleGroup, ToggleGroupItem } from "@meridianher/ui/components/toggle-group"
import { SPACE_ICONS, spaceToneStyle, type SpaceTone } from "@meridianher/ui/lib/spaces"
import { COMMUNITY_GUIDELINES } from "@meridianher/ui/patterns/cards"

import { checkDisplayName, finishOnboarding, leaveUnderAge } from "./actions"

type Space = { slug: string; name: string; icon: string; tone: SpaceTone }
type Step = "welcome" | "name" | "year" | "spaces" | "guidelines" | "under-age"

const STEP_LABEL: Partial<Record<Step, string>> = {
  welcome: "Step 1 of 4",
  name: "Step 2 of 4",
  year: "Step 3 of 4",
  spaces: "Step 4 of 4",
  guidelines: "One last thing",
}
const PREVIOUS: Partial<Record<Step, Step>> = { name: "welcome", year: "name", spaces: "year", guidelines: "spaces" }

/** First time onboarding, under 60 seconds (PRD section 5). */
export function OnboardingFlow({
  next,
  spaces,
  suggestions,
  realNameParts,
}: {
  next: string
  spaces: Space[]
  suggestions: string[]
  realNameParts: string[]
}) {
  const [step, setStep] = React.useState<Step>("welcome")
  const [name, setName] = React.useState("")
  const [year, setYear] = React.useState("")
  const [chosen, setChosen] = React.useState<string[]>([])
  const [accepted, setAccepted] = React.useState(false)
  const [error, setError] = React.useState<string>()
  const [pending, startTransition] = React.useTransition()

  const nameWords = name.toLowerCase().split(/\s+/)
  const looksLikeRealName = realNameParts.some((part) => nameWords.includes(part))

  function go(to: Step) {
    setError(undefined)
    setStep(to)
  }

  function submitName() {
    startTransition(async () => {
      const result = await checkDisplayName(name)
      if (result.error) setError(result.error)
      else go("year")
    })
  }

  function submitYear() {
    const value = Number(year)
    const thisYear = new Date().getFullYear()
    if (!/^\d{4}$/.test(year) || value < 1900 || value > thisYear) {
      setError(`Enter the year you were born, for example ${thisYear - 25}.`)
      return
    }
    if (thisYear - value < 16) {
      go("under-age")
      startTransition(() => leaveUnderAge())
      return
    }
    go("spaces")
  }

  function submitAll() {
    startTransition(async () => {
      const result = await finishOnboarding({
        displayName: name,
        birthYear: Number(year),
        spaces: chosen,
        acceptGuidelines: accepted as true,
        next,
      })
      setError(result.error)
    })
  }

  const back = PREVIOUS[step]
  const action = {
    welcome: { label: "Get started", run: () => go("name"), disabled: false },
    name: { label: "Continue", run: submitName, disabled: name.trim().length < 3 },
    year: { label: "Continue", run: submitYear, disabled: year.length !== 4 },
    spaces: { label: "Continue", run: () => go("guidelines"), disabled: chosen.length === 0 },
    guidelines: { label: "Join the community", run: submitAll, disabled: !accepted },
    "under-age": null,
  }[step]

  return (
    <Card render={<form onSubmit={(e) => (e.preventDefault(), action?.run())} noValidate />}>
      <CardHeader>
        {STEP_LABEL[step] ? <CardDescription>{STEP_LABEL[step]}</CardDescription> : null}
        <CardTitle className="text-h2">
          {
            {
              welcome: "Welcome to MeridianHer",
              name: "Choose your display name",
              year: "What year were you born?",
              spaces: "Pick your spaces",
              guidelines: "How we talk here",
              "under-age": "We are not able to create your account yet",
            }[step]
          }
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {step === "welcome" ? (
          <>
            <p className="text-body">
              A place to ask what you have never felt able to ask out loud, from first periods to menopause, with answers from women
              who have been there and from verified experts.
            </p>
            <Alert role="note">
              <LockKeyholeIcon aria-hidden />
              <AlertDescription>Your name and email are never shown. You choose how you appear.</AlertDescription>
            </Alert>
          </>
        ) : null}

        {step === "name" ? (
          <>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="display-name">Display name</FieldLabel>
              <Input
                id="display-name"
                autoComplete="off"
                autoFocus
                maxLength={40}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(undefined)
                }}
                aria-invalid={!!error}
                aria-describedby="display-name-help"
              />
              <FieldDescription id="display-name-help">This is how you appear everywhere. You can change it once a month.</FieldDescription>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Suggestions">
              {suggestions.map((s) => (
                <Button key={s} type="button" variant="outline" size="sm" onClick={() => (setName(s), setError(undefined))}>
                  {s}
                </Button>
              ))}
            </div>
            {looksLikeRealName ? (
              <Alert variant="warning" role="status">
                <TriangleAlertIcon aria-hidden />
                <AlertDescription>This looks like part of your real name. To stay anonymous, choose something else.</AlertDescription>
              </Alert>
            ) : null}
          </>
        ) : null}

        {step === "year" ? (
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="birth-year">Year of birth</FieldLabel>
            <Input
              id="birth-year"
              inputMode="numeric"
              autoComplete="bday-year"
              autoFocus
              maxLength={4}
              placeholder="1995"
              value={year}
              onChange={(e) => {
                setYear(e.target.value.replace(/\D/g, ""))
                setError(undefined)
              }}
              aria-invalid={!!error}
              aria-describedby="birth-year-help"
            />
            <FieldDescription id="birth-year-help">Never shown to anyone. We use it to show you the right spaces.</FieldDescription>
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
        ) : null}

        {step === "spaces" ? (
          <>
            <p className="text-body text-muted-foreground">Choose at least one. These shape your home feed, and you can change them any time.</p>
            <ToggleGroup
              multiple
              variant="chip"
              aria-label="Spaces"
              className="flex-wrap"
              value={chosen}
              onValueChange={(v) => setChosen(v as string[])}
            >
              {spaces.map((s) => {
                const Icon = SPACE_ICONS[s.icon] ?? HeartIcon
                return (
                  <ToggleGroupItem key={s.slug} value={s.slug} style={spaceToneStyle(s.tone)}>
                    <Icon className="text-(--tone-ink) group-aria-pressed/toggle:text-current" aria-hidden />
                    {s.name}
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </>
        ) : null}

        {step === "guidelines" ? (
          <>
            <ol className="list-decimal space-y-2.5 pl-5 text-body marker:font-semibold marker:text-primary">
              {COMMUNITY_GUIDELINES.map((rule) => (
                <li key={rule.title}>
                  <span className="font-medium">{rule.title}.</span> <span className="text-muted-foreground">{rule.body}</span>
                </li>
              ))}
            </ol>
            <Label>
              <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} />I agree to the community guidelines
            </Label>
            {error ? (
              <Alert variant="destructive" role="alert">
                <TriangleAlertIcon aria-hidden />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </>
        ) : null}

        {step === "under-age" ? (
          <>
            <p className="text-body">
              MeridianHer is for women aged 16 and over, so we cannot make an account for you yet. We have not kept any of your details.
            </p>
            <p className="text-body text-muted-foreground">
              If something about your body is worrying you, talk to a parent, school nurse or another adult you trust. You can also
              contact Childline in the UK any time, for free. In Nigeria, call 112 in an emergency.
            </p>
            <Button variant="outline" className="self-start" render={<a href="tel:08001111" />} nativeButton={false}>
              <PhoneIcon data-icon="inline-start" aria-hidden />
              Childline 0800 1111
            </Button>
          </>
        ) : null}
      </CardContent>

      {action ? (
        <CardFooter className="gap-3">
          {back ? (
            <Button type="button" variant="ghost" onClick={() => go(back)} disabled={pending}>
              Back
            </Button>
          ) : null}
          <Button type="submit" size="lg" className="ml-auto" disabled={action.disabled || pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {action.label}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
