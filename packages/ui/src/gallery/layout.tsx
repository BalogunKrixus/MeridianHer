import * as React from "react"
import { cn } from "../lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card"

export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-28 flex-col gap-10">
      <header>
        <h2 id={`${id}-title`} className="text-h1">
          {title}
        </h2>
        {description ? <p className="mt-2 max-w-2xl text-body text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  )
}

/** One gallery entry. `bare` shows the pattern on the page background, for patterns that are cards themselves. */
export function Specimen({
  title,
  note,
  children,
  className,
  bare = false,
}: {
  title: string
  note?: string
  children: React.ReactNode
  className?: string
  bare?: boolean
}) {
  if (bare) {
    return (
      <section aria-label={title} className="flex flex-col gap-3">
        <header>
          <h3 className="text-h3">{title}</h3>
          {note ? <p className="text-small text-muted-foreground">{note}</p> : null}
        </header>
        <div className={className}>{children}</div>
      </section>
    )
  }
  return (
    <Card render={<section aria-label={title} />}>
      <CardHeader>
        <CardTitle className="text-h3">{title}</CardTitle>
        {note ? <CardDescription>{note}</CardDescription> : null}
      </CardHeader>
      <CardContent className={className}>{children}</CardContent>
    </Card>
  )
}

export function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>
}
