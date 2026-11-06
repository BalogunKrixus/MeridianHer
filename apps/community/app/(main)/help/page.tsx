import type { Metadata } from "next"
import { FlagIcon, ShieldCheckIcon, StethoscopeIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { CrisisCard } from "@meridianher/ui/patterns/cards"

import { getCrisisResources } from "@/lib/data"

export const metadata: Metadata = {
  title: "Need help now?",
  description: "Crisis lines and urgent help, any time, day or night.",
}

/** Linked from every page footer (PRD section 8, crisis handling). */
export default async function HelpPage() {
  const crisis = await getCrisisResources()
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-display">You are not alone</h1>
        <p className="mt-3 text-body text-muted-foreground">
          If you are in danger or thinking about ending your life, call your local emergency number now. These services are free,
          confidential and open to you.
        </p>
      </header>
      <CrisisCard countries={crisis} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-h3">
            <StethoscopeIcon className="size-5 text-primary" aria-hidden />
            Worried about a symptom?
          </CardTitle>
          <CardDescription className="text-body">
            Heavy bleeding that soaks a pad every hour, severe pain, fainting, or bleeding in pregnancy all need a doctor today. Do
            not wait for replies here.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-h3">
            <ShieldCheckIcon className="size-5 text-primary" aria-hidden />
            Something wrong in the community?
          </CardTitle>
          <CardDescription className="text-body">
            Use Report on any post, reply or profile. Reports are anonymous and a moderator looks at urgent ones first.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <ButtonLink variant="outline" href="/guidelines">
            <FlagIcon data-icon="inline-start" aria-hidden />
            How reporting works
          </ButtonLink>
        </CardContent>
      </Card>
    </main>
  )
}
