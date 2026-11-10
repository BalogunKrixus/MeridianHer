"use client"

import * as React from "react"
import { LockKeyholeIcon, MailCheckIcon, MailIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "../components/alert"
import { Button } from "../components/button"
import { Field, FieldError, FieldLabel } from "../components/field"
import { Input } from "../components/input"
import { Separator } from "../components/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../components/sheet"
import { Spinner } from "../components/spinner"
import { useIsMobile } from "../hooks/use-mobile"

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.03 0-.6-.07-1.06-.15-1.52Z" />
    </svg>
  )
}

export type SignInHandlers = {
  /** Starts Google sign in. Usually a server action that redirects to Google. */
  onGoogle: () => Promise<void> | void
  /** Sends the magic link. Leave out to offer Google only (admin). Resolve with an error message to show it. */
  onEmail?: (email: string) => Promise<{ error?: string } | void>
  /** Links "community guidelines" in the small print */
  guidelinesHref?: string
}

/** Google first, email magic link second (PRD section 5). Used by the sheet and by the sign in pages. */
function SignInForm({ onGoogle, onEmail, guidelinesHref }: SignInHandlers) {
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState<"idle" | "google" | "sending" | "sent">("idle")
  const [error, setError] = React.useState<string>()

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    if (!onEmail || !email) return
    setState("sending")
    setError(undefined)
    const result = await onEmail(email)
    if (result?.error) {
      setError(result.error)
      setState("idle")
    } else {
      setState("sent")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert role="note">
        <LockKeyholeIcon aria-hidden />
        <AlertDescription>Your name and email are never shown. You choose how you appear.</AlertDescription>
      </Alert>

      <Button
        size="lg"
        className="w-full"
        disabled={state === "google"}
        onClick={async () => {
          setState("google")
          await onGoogle()
        }}
      >
        {state === "google" ? <Spinner data-icon="inline-start" /> : <GoogleMark />}
        Continue with Google
      </Button>

      {onEmail ? (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" />
            or
            <Separator className="flex-1" />
          </div>

          {state === "sent" ? (
            <Alert role="status" variant="success">
              <MailCheckIcon aria-hidden />
              <AlertTitle>Check your inbox</AlertTitle>
              <AlertDescription>We sent a sign in link to {email}. It works for 15 minutes.</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={sendLink} className="flex flex-col gap-3">
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="signin-email">Email</FieldLabel>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={!!error}
                />
                {error ? <FieldError>{error}</FieldError> : null}
              </Field>
              <Button type="submit" variant="outline" size="lg" className="w-full" disabled={state === "sending"}>
                {state === "sending" ? <Spinner data-icon="inline-start" /> : <MailIcon data-icon="inline-start" aria-hidden />}
                Email me a sign in link
              </Button>
            </form>
          )}
        </>
      ) : null}

      <p className="text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        {guidelinesHref ? (
          <a href={guidelinesHref} className="underline underline-offset-3 hover:text-foreground">
            community guidelines
          </a>
        ) : (
          "community guidelines"
        )}{" "}
        and privacy notice. You must be 16 or older.
      </p>
    </div>
  )
}

/**
 * Appears only when a visitor tries to act (PRD section 5). Bottom sheet on
 * phones, side sheet on larger screens. She returns to where she was afterwards.
 */
function SignInSheet({
  open,
  onOpenChange,
  action = "join the conversation",
  ...handlers
}: SignInHandlers & {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Completes "Sign in to ...", for example "reply", "save this post" */
  action?: string
}) {
  const isMobile = useIsMobile()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className="gap-6 rounded-t-2xl p-6 sm:max-w-md sm:rounded-none">
        <SheetHeader className="p-0">
          <SheetTitle className="text-h2">Sign in to {action}</SheetTitle>
          <SheetDescription className="text-body">
            Reading is free for everyone. To post, reply or react, you need an account so we can keep this space safe.
          </SheetDescription>
        </SheetHeader>
        <SignInForm {...handlers} />
      </SheetContent>
    </Sheet>
  )
}

export { SignInForm, SignInSheet }
