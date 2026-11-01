import * as React from "react"
import { cn } from "cn"
import { LifeBuoyIcon, PhoneIcon, ShieldCheckIcon } from "lucide-react"

import { Button } from "../components/button"
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
    <section aria-labelledby="guidelines-title" className={cn("rounded-xl bg-card p-5 shadow-soft", className)}>
      <h2 id="guidelines-title" className="flex items-center gap-2 text-h3 text-foreground">
        <ShieldCheckIcon className="size-5 text-primary" aria-hidden />
        How we talk here
      </h2>
      <ol className="mt-3 space-y-2.5">
        {COMMUNITY_GUIDELINES.map((rule, i) => (
          <li key={rule.title} className="flex gap-3 text-sm">
            <span className="font-heading text-base leading-5 font-semibold text-primary tabular-nums">{i + 1}</span>
            <span>
              <span className="font-medium text-foreground">{rule.title}.</span>{" "}
              <span className="text-muted-foreground">{rule.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <a href={href} className="relative tap-target mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
        Read the full guidelines
      </a>
    </section>
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
    <section
      aria-labelledby="crisis-title"
      className={cn("rounded-xl bg-accent p-5 text-foreground", className)}
    >
      <h2 id="crisis-title" className="flex items-center gap-2 text-h3">
        <LifeBuoyIcon className="size-5 text-accent-foreground" aria-hidden />
        Need help now?
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        If you are thinking about hurting yourself or feel unsafe, please reach out now. You deserve support.
      </p>
      <div className={cn("mt-4 grid gap-4", !compact && "sm:grid-cols-2")}>
        {countries.map((c) => (
          <div key={c.country}>
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{c.country}</h3>
            <ul className="mt-2 space-y-2">
              {c.resources.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 text-sm">
                    <span className="block font-medium">{r.name}</span>
                    {r.detail ? <span className="block text-muted-foreground">{r.detail}</span> : null}
                  </span>
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
          </div>
        ))}
      </div>
    </section>
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
        <EmptyTitle className="font-heading text-lg">{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}

export { GuidelinesCard, CrisisCard, EmptyState }
