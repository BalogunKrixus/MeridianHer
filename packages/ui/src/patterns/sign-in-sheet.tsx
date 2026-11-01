"use client"

import * as React from "react"
import { LockKeyholeIcon, MailCheckIcon, MailIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "../components/alert"
import { Button } from "../components/button"
import { Field, FieldLabel } from "../components/field"
import { Input } from "../components/input"
import { Separator } from "../components/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/sheet"
import { Spinner } from "../components/spinner"
import { useIsMobile } from "../hooks/use-mobile"

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.03 0-.6-.07-1.06-.15-1.52Z" />
    </svg>
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
  onGoogle,
  onEmail,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Completes "Sign in to ...", for example "reply", "save this post" */
  action?: string
  onGoogle?: () => void
  onEmail?: (email: string) => Promise<void> | void
}) {
  const isMobile = useIsMobile()
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle")

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setState("sending")
    await onEmail?.(email)
    setState("sent")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className="gap-0 rounded-t-2xl p-6 sm:rounded-none sm:max-w-md">
        <SheetHeader className="p-0">
          <SheetTitle className="text-h2">Sign in to {action}</SheetTitle>
          <SheetDescription className="text-body">
            Reading is free for everyone. To post, reply or react, you need an account so we can keep this space safe.
          </SheetDescription>
        </SheetHeader>

        <Alert role="note" className="mt-5">
          <LockKeyholeIcon aria-hidden />
          <AlertDescription>Your name and email are never shown. You choose how you appear.</AlertDescription>
        </Alert>

        <Button size="lg" className="mt-6 w-full" onClick={onGoogle}>
          <GoogleMark />
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
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
            <Field>
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
              />
            </Field>
            <Button type="submit" variant="outline" size="lg" className="w-full" disabled={state === "sending"}>
              {state === "sending" ? <Spinner data-icon="inline-start" /> : <MailIcon data-icon="inline-start" aria-hidden />}
              Email me a sign in link
            </Button>
          </form>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          By continuing you agree to our community guidelines and privacy notice. You must be 16 or older.
        </p>
      </SheetContent>
    </Sheet>
  )
}

export { SignInSheet }
