"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Checkbox } from "@meridianher/ui/components/checkbox"
import { Field, FieldDescription, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { Separator } from "@meridianher/ui/components/separator"
import { toast } from "@meridianher/ui/components/sonner"
import { Textarea } from "@meridianher/ui/components/textarea"

import { reviewApplication } from "@/lib/expert-actions"

const CHECKS = [
  { id: "name", label: "Name matches the register" },
  { id: "active", label: "Licence is active" },
  { id: "specialty", label: "Specialty matches the category" },
]

/** Checklist and decision (PRD 9.5). Approve unlocks once every check is ticked. */
export function ReviewPanel({
  application,
  suggestedName,
  suggestedHandle,
}: {
  application: { id: string; status: string; reason: string | null }
  suggestedName: string
  suggestedHandle: string
}) {
  const router = useRouter()
  const [checks, setChecks] = React.useState<Record<string, boolean>>({})
  const [reason, setReason] = React.useState("")
  const [publicName, setPublicName] = React.useState(suggestedName)
  const [handle, setHandle] = React.useState(suggestedHandle)
  const [busy, setBusy] = React.useState(false)
  const allChecked = CHECKS.every((c) => checks[c.id])
  const decided = application.status === "approved" || application.status === "rejected"

  async function decide(input: Parameters<typeof reviewApplication>[1], done: string) {
    setBusy(true)
    const result = await reviewApplication(application.id, input)
    setBusy(false)
    if (result.error) return void toast.error(result.error)
    toast.success(done)
    router.refresh()
  }

  if (decided) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-h3">Decision</CardTitle>
          <CardDescription className="capitalize">{application.status}</CardDescription>
        </CardHeader>
        {application.reason ? (
          <CardContent>
            <p className="text-small">{application.reason}</p>
          </CardContent>
        ) : null}
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Review</CardTitle>
        <CardDescription>The applicant is notified of every decision except starting the review.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {application.status === "submitted" ? (
          <Button variant="secondary" disabled={busy} onClick={() => decide({ decision: "in_review" }, "Marked as in review")}>
            Start review
          </Button>
        ) : null}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-small font-medium">Checklist</legend>
          {CHECKS.map((c) => (
            <Field key={c.id} orientation="horizontal">
              <Checkbox id={`check-${c.id}`} checked={!!checks[c.id]} onCheckedChange={(v) => setChecks({ ...checks, [c.id]: !!v })} />
              <FieldLabel htmlFor={`check-${c.id}`} className="font-normal">
                {c.label}
              </FieldLabel>
            </Field>
          ))}
        </fieldset>
        <Separator />
        <Field>
          <FieldLabel htmlFor="public-name">Public name</FieldLabel>
          <Input id="public-name" value={publicName} onChange={(e) => setPublicName(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="handle">Handle</FieldLabel>
          <Input id="handle" value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} />
          <FieldDescription>Their profile will be at /e/{handle || "handle"}</FieldDescription>
        </Field>
        <Button disabled={!allChecked || busy} onClick={() => decide({ decision: "approved", handle, publicName }, "Approved. They are now a verified expert.")}>
          Approve
        </Button>
        {!allChecked ? <p className="-mt-2 text-xs text-muted-foreground">Tick every check to approve.</p> : null}
        <Separator />
        <Field>
          <FieldLabel htmlFor="decision-reason">Message to the applicant</FieldLabel>
          <Textarea
            id="decision-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="We could not find licence 12345 on the MDCN register. Could you send a current practising licence?"
          />
        </Field>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" disabled={busy || reason.trim().length < 5} onClick={() => decide({ decision: "more_info", reason }, "Asked for more information")}>
          Ask for more info
        </Button>
        <Button variant="destructive" disabled={busy || reason.trim().length < 5} onClick={() => decide({ decision: "rejected", reason }, "Application rejected")}>
          Reject
        </Button>
      </CardFooter>
    </Card>
  )
}
