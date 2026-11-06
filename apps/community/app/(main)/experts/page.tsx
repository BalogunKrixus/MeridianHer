import type { Metadata } from "next"
import { BadgeCheckIcon, StethoscopeIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { VerifiedTick } from "@meridianher/ui/patterns/badges"
import { EmptyState } from "@meridianher/ui/patterns/cards"
import { InitialAvatar } from "@meridianher/ui/patterns/chips"
import { createClient } from "@meridianher/db/server"

import { EXPERT_CATEGORY_LABELS } from "@/lib/format"

export const metadata: Metadata = {
  title: "Our experts",
  description: "Doctors, midwives, dietitians and therapists, each verified against a professional register before they answer.",
}

export default async function ExpertsPage({ searchParams }: PageProps<"/experts">) {
  const params = await searchParams
  const category = typeof params.category === "string" && params.category in EXPERT_CATEGORY_LABELS ? params.category : undefined
  const supabase = await createClient()
  const { data } = await supabase.from("public_experts").select("*").order("verified_at")
  const experts = data ?? []
  const categories = [...new Set(experts.map((e) => e.category!))]
  const shown = category ? experts.filter((e) => e.category === category) : experts

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-h1">Our experts</h1>
          <p className="mt-2 text-body text-muted-foreground">
            Every expert is checked against a professional register before they get a badge, and checked again every year. They
            share general education, never a diagnosis.
          </p>
        </div>
        <ButtonLink variant="outline" href="/experts/apply" className="self-start sm:self-auto">
          <StethoscopeIcon data-icon="inline-start" aria-hidden />
          Join as an expert
        </ButtonLink>
      </header>

      {categories.length > 1 ? (
        <nav aria-label="Filter by specialty" className="flex gap-1.5 overflow-x-auto pb-1">
          <ButtonLink size="sm" variant={category ? "ghost" : "secondary"} href="/experts" aria-current={category ? undefined : "page"}>
            Everyone
          </ButtonLink>
          {categories.map((c) => (
            <ButtonLink
              key={c}
              size="sm"
              className="shrink-0"
              variant={category === c ? "secondary" : "ghost"}
              aria-current={category === c ? "page" : undefined}
              href={`/experts?category=${c}`}
            >
              {EXPERT_CATEGORY_LABELS[c]}
            </ButtonLink>
          ))}
        </nav>
      ) : null}

      {shown.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((e) => (
            <li key={e.handle} className="flex">
              <Card className="relative flex-1 focus-within:ring-3 focus-within:ring-ring">
                <CardHeader className="flex items-center gap-3">
                  <InitialAvatar name={e.public_name!} size="lg" />
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-1 text-h3">
                      <a href={`/e/${e.handle}`} className="truncate after:absolute after:inset-0 focus-visible:outline-none">
                        {e.public_name}
                      </a>
                      <VerifiedTick />
                    </CardTitle>
                    <CardDescription>{e.title}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  <Badge variant="expert">{EXPERT_CATEGORY_LABELS[e.category ?? "other"]}</Badge>
                  {e.specialties?.map((s) => (
                    <Badge key={s} variant="tag">
                      {s}
                    </Badge>
                  ))}
                  {e.available ? null : <Badge variant="secondary">Away for now</Badge>}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={BadgeCheckIcon}
          title="Our first experts are being verified"
          description="We check every licence by hand before an expert can answer. Ask your question now with Ask an expert switched on, and it will be waiting for them."
          action={<ButtonLink href="/ask">Ask a question</ButtonLink>}
        />
      )}
    </main>
  )
}
