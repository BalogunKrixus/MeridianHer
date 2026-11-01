import * as React from "react"
import { cn } from "cn"
import { LifeBuoyIcon, PhoneIcon, ShieldCheckIcon } from "lucide-react"

import { Button } from "../components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../components/empty"

export const COMMUNITY_GUIDELINES = [
  { title: "Be kind", body: "No shaming, mocking or judging anyone's body, choices or beliefs." },
  { title: "Share experience, not diagnosis", body: "Only verified experts give clinical context, and never a diagnosis." },
  { title: "No selling", body: "No products, clinics, MLMs, links for profit or messages to sell." },
  { title: "Protect privacy", body: "Never share anyone's real name, photo or details, including your own." },
  { title: "Keep it real and respectful", body: "No spam, hate, harassment or sexual content outside health discussion." },
]

/** Right rail card with the five rules (PRD section 8). */
function GuidelinesCard({ href = "/guidelines", className }: { href?: string; className?: string }) {
  return (
    <Card render={<section aria-labelledby="guidelines-title" />} className={className}>
      <CardHeader>
        <CardTitle id="guidelines-title" className="flex items-center gap-2 text-h3">
          <ShieldCheckIcon className="size-5 text-primary" aria-hidden />
          How we talk here
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-2.5 pl-5 marker:font-semibold marker:text-primary">
          {COMMUNITY_GUIDELINES.map((rule) => (
            <li key={rule.title}>
              <span className="font-medium">{rule.title}.</span>{" "}
              <span className="text-muted-foreground">{rule.body}</span>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardContent>
        <Button variant="link" className="px-0" render={<a href={href} />} nativeButton={false}>
          Read the full guidelines
        </Button>
      </CardContent>
    </Card>
  )
}

export type CrisisResource = { name: string; detail?: string; phone?: string; href?: string }
export type CrisisCountry = { country: string; resources: CrisisResource[] }

/** Default list from PRD section 8. Admin editable per country; the Nigeria list must be verified before launch. */
export const DEFAULT_CRISIS_RESOURCES: CrisisCountry[] = [
  {
    country: "United Kingdom",
    resources: [
      { name: "Samaritans", detail: "Any time, day or night", phone: "116 123" },
      { name: "NHS 111", detail: "Urgent medical help", phone: "111" },
    ],
  },
  {
    country: "Nigeria",
    resources: [
      { name: "Emergency services", phone: "112" },
      // Contact details to be confirmed with a local partner (PRD open question)
      { name: "Mentally Aware Nigeria Initiative", detail: "Mental health support" },
    ],
  },
]

/** "Need help now?" card. Always visible in Mental health and Postpartum (PRD section 8). */
function CrisisCard({
  countries = DEFAULT_CRISIS_RESOURCES,
  compact = false,
  className,
}: {
  countries?: CrisisCountry[]
  compact?: boolean
  className?: string
}) {
  return (
    <Card render={<section aria-labelledby="crisis-title" />} variant="flat" className={cn("bg-accent", className)}>
      <CardHeader>
        <CardTitle id="crisis-title" className="flex items-center gap-2 text-h3">
          <LifeBuoyIcon className="size-5 text-accent-foreground" aria-hidden />
          Need help now?
        </CardTitle>
        <CardDescription>
          If you are thinking about hurting yourself or feel unsafe, please reach out now. You deserve support.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        {countries.map((c) => (
          <section key={c.country} aria-label={c.country}>
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{c.country}</h3>
            <ul className="mt-2 space-y-2">
              {c.resources.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-3">
                  <p className="min-w-0">
                    <span className="block font-medium">{r.name}</span>
                    {r.detail ? <span className="block text-muted-foreground">{r.detail}</span> : null}
                  </p>
                  {r.phone ? (
                    <Button
                      variant="outline"
                      size="sm"
                      render={<a href={`tel:${r.phone.replace(/\s/g, "")}`} />}
                      nativeButton={false}
                    >
                      <PhoneIcon data-icon="inline-start" aria-hidden />
                      {r.phone}
                    </Button>
                  ) : r.href ? (
                    <Button variant="outline" size="sm" render={<a href={r.href} target="_blank" rel="noreferrer" />} nativeButton={false}>
                      Visit
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  )
}

/** Every list gets a designed empty state with a next step (PRD 6.10). */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <Empty className={cn("rounded-xl bg-card shadow-soft", className)}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon" className="size-10 rounded-full bg-secondary text-secondary-foreground">
            <Icon className="size-5" />
          </EmptyMedia>
        ) : null}
        <EmptyTitle className="text-lg">{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}

export { GuidelinesCard, CrisisCard, EmptyState }
