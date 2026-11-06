"use client"

import * as React from "react"
import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "../components/alert"
import { Button } from "../components/button"
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "../components/field"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "../components/sheet"
import { Spinner } from "../components/spinner"
import { Textarea } from "../components/textarea"
import { ToggleGroup, ToggleGroupItem } from "../components/toggle-group"
import { useIsMobile } from "../hooks/use-mobile"

export type ReportReason = "harassment" | "misinformation" | "selling" | "privacy" | "self_harm" | "sexual" | "other"

/** Report reasons from PRD section 8, layer 2 */
export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "misinformation", label: "Harmful health misinformation" },
  { value: "selling", label: "Selling or spam" },
  { value: "privacy", label: "Shares someone's private details" },
  { value: "self_harm", label: "Someone may be at risk of harming themselves" },
  { value: "sexual", label: "Sexual content" },
  { value: "other", label: "Something else" },
]

/** Report a post, reply or profile. The reporter is never revealed. */
function ReportSheet({
  open,
  onOpenChange,
  target = "post",
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  target?: "post" | "reply" | "profile"
  onSubmit: (reason: ReportReason, note: string) => Promise<{ error?: string } | void>
}) {
  const isMobile = useIsMobile()
  const [reason, setReason] = React.useState<ReportReason>()
  const [note, setNote] = React.useState("")
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle")
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    if (open) {
      setReason(undefined)
      setNote("")
      setState("idle")
      setError(undefined)
    }
  }, [open])

  async function send() {
    if (!reason) return
    setState("sending")
    const result = await onSubmit(reason, note.trim())
    if (result?.error) {
      setError(result.error)
      setState("idle")
    } else {
      setState("sent")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className="gap-6 rounded-t-xl p-6 sm:max-w-md sm:rounded-none">
        <SheetHeader className="p-0">
          <SheetTitle className="text-h2">Report this {target}</SheetTitle>
          <SheetDescription>Nobody is ever told who reported them. A moderator reviews every report within 12 hours.</SheetDescription>
        </SheetHeader>

        {state === "sent" ? (
          <Alert variant="success" role="status">
            <CircleCheckIcon aria-hidden />
            <AlertTitle>Thank you for telling us</AlertTitle>
            <AlertDescription>A moderator will look at this soon. If someone is in danger right now, call your local emergency number.</AlertDescription>
          </Alert>
        ) : (
          <>
            <FieldSet>
              <FieldLegend variant="label">What is wrong?</FieldLegend>
              <ToggleGroup
                variant="outline"
                orientation="vertical"
                spacing={1}
                className="w-full"
                value={reason ? [reason] : []}
                onValueChange={(v) => setReason(v[0] as ReportReason | undefined)}
              >
                {REPORT_REASONS.map((r) => (
                  <ToggleGroupItem key={r.value} value={r.value} className="justify-start">
                    {r.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>
            <Field>
              <FieldLabel htmlFor="report-note">Anything else we should know?</FieldLabel>
              <Textarea id="report-note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
              <FieldDescription>Optional.</FieldDescription>
            </Field>
            {error ? (
              <Alert variant="destructive" role="alert">
                <TriangleAlertIcon aria-hidden />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </>
        )}

        <SheetFooter className="p-0">
          {state === "sent" ? (
            <Button size="lg" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <Button size="lg" onClick={send} disabled={!reason || state === "sending"}>
              {state === "sending" ? <Spinner data-icon="inline-start" /> : null}
              Send report
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { ReportSheet }
