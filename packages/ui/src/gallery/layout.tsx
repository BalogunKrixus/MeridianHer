import * as React from "react"
import { cn } from "cn"

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
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28 border-t border-border pt-10">
      <h2 id={`${id}-title`} className="text-h1 text-foreground">
        {title}
      </h2>
      {description ? <p className="mt-2 max-w-2xl text-body text-muted-foreground">{description}</p> : null}
      <div className="mt-8 flex flex-col gap-10">{children}</div>
    </section>
  )
}

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
  /** Render without the card surface */
  bare?: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-h3 text-foreground">{title}</h3>
        {note ? <p className="mt-0.5 text-small text-muted-foreground">{note}</p> : null}
      </div>
      <div className={cn(!bare && "rounded-xl bg-card p-5 shadow-soft", className)}>{children}</div>
    </div>
  )
}

export function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>
}

export function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</p>
}
