import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { BadgeCheckIcon, ClockIcon, InfoIcon, XCircleIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@meridianher/ui/components/alert"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { createClient } from "@meridianher/db/server"

import { getViewer } from "@/lib/data"
import { EXPERT_CATEGORY_LABELS } from "@/lib/format"
import { ApplyForm } from "./apply-form"

export const metadata: Metadata = {
  title: "Join as an expert",
  description: "Doctors, midwives, dietitians, therapists and pharmacists: help women get trustworthy answers.",
}

const STEPS = [
  { title: "Apply", body: "Share your registration details and a copy of your licence. About five minutes." },
  { title: "We verify", body: "A member of our team checks your licence against the public register, usually within five working days." },
  { title: "Start answering", body: "Choose your public name, get your badge and see questions in your specialty in your expert inbox." },
]

export default async function ApplyPage({ searchParams }: PageProps<"/experts/apply">) {
  const params = await searchParams
  const invite = typeof params.invite === "string" ? params.invite : undefined
  const viewer = await getViewer()
  if (!viewer?.onboarding_complete) {
    redirect(`/sign-in?next=${encodeURIComponent(invite ? `/experts/apply?invite=${invite}` : "/experts/apply")}`)
  }
  const supabase = await createClient()
  const [{ data: latest }, inviteDetails] = await Promise.all([
    supabase
      .from("expert_applications")
      .select("status, decision_reason, created_at")
      .eq("user_id", viewer.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    invite ? supabase.rpc("invite_details", { token: invite }).then((r) => r.data as { name: string; category: string } | null) : null,
  ])

  const header = (
    <header>
      <h1 className="text-display">Join as an expert</h1>
      <p className="mt-3 text-body text-muted-foreground">
        Women here ask what they have never felt able to ask out loud. Your answers, pinned at the top of their question, are often
        the first trustworthy information they get.
      </p>
    </header>
  )

  if (viewer.role === "expert") {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
        {header}
        <Alert>
          <BadgeCheckIcon aria-hidden />
          <AlertTitle>You are a verified expert</AlertTitle>
          <AlertDescription>Questions waiting for an expert are in your inbox.</AlertDescription>
        </Alert>
        <ButtonLink href="/experts/inbox" className="self-start">
          Open your expert inbox
        </ButtonLink>
      </main>
    )
  }

  const open = latest && ["submitted", "in_review", "more_info"].includes(latest.status)
  if (open && latest.status !== "more_info") {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
        {header}
        <Alert>
          <ClockIcon aria-hidden />
          <AlertTitle>{latest.status === "in_review" ? "We are checking your details" : "Thank you, your application is with us"}</AlertTitle>
          <AlertDescription>
            We check every licence by hand against the public register. You will get a notification and an email as soon as we
            have decided, usually within five working days.
          </AlertDescription>
        </Alert>
        <ButtonLink variant="outline" href="/" className="self-start">
          Back to the community
        </ButtonLink>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      {header}
      {latest?.status === "more_info" ? (
        <Alert>
          <InfoIcon aria-hidden />
          <AlertTitle>We need a little more information</AlertTitle>
          <AlertDescription>{latest.decision_reason}</AlertDescription>
        </Alert>
      ) : latest?.status === "rejected" ? (
        <Alert>
          <XCircleIcon aria-hidden />
          <AlertTitle>Your last application was not approved</AlertTitle>
          <AlertDescription>{latest.decision_reason} You are welcome to apply again with updated details.</AlertDescription>
        </Alert>
      ) : inviteDetails ? (
        <Alert>
          <BadgeCheckIcon aria-hidden />
          <AlertTitle>You were invited, {inviteDetails.name.split(" ")[0]}</AlertTitle>
          <AlertDescription>
            We have filled in what we know. We still check every licence, so please add your registration details.
          </AlertDescription>
        </Alert>
      ) : (
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex">
              <Card size="sm" className="flex-1">
                <CardHeader>
                  <CardTitle className="text-h3">
                    <span className="text-primary tabular-nums">{i + 1}.</span> {s.title}
                  </CardTitle>
                  <CardDescription>{s.body}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>
      )}
      <Card>
        <CardContent>
          <ApplyForm
            invite={invite}
            initial={inviteDetails ? { legal_name: inviteDetails.name, category: inviteDetails.category } : undefined}
            categories={Object.entries(EXPERT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </CardContent>
      </Card>
    </main>
  )
}
