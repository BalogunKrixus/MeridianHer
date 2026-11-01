"use client"

import { cn } from "cn"
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { Area, AreaChart } from "recharts"

import { ChartContainer, type ChartConfig } from "../components/chart"

/**
 * Headline number with change versus the previous period (PRD 9.2).
 * `goodWhen` sets whether a rise is good (members) or bad (open reports).
 */
function StatCard({
  label,
  value,
  change,
  period = "vs previous 7 days",
  goodWhen = "up",
  trend,
  href,
  className,
}: {
  label: string
  value: string
  /** Percentage change, for example 12.5 or -3 */
  change?: number
  period?: string
  goodWhen?: "up" | "down"
  trend?: number[]
  href?: string
  className?: string
}) {
  const dir = change === undefined || change === 0 ? "flat" : change > 0 ? "up" : "down"
  const good = dir === "flat" ? null : dir === goodWhen
  const Icon = dir === "up" ? TrendingUpIcon : dir === "down" ? TrendingDownIcon : MinusIcon
  const config = { v: { label, color: "var(--chart-1)" } } satisfies ChartConfig
  const Root = href ? "a" : "div"

  return (
    <Root
      {...(href ? { href } : {})}
      className={cn(
        "flex flex-col gap-1 rounded-xl bg-card p-4 text-card-foreground shadow-soft",
        href && "transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
    >
      <span className="text-small text-muted-foreground">{label}</span>
      <div className="flex items-end justify-between gap-3">
        <span className="font-heading text-h1 tabular-nums">{value}</span>
        {trend?.length ? (
          <ChartContainer config={config} className="aspect-auto h-10 w-24" aria-hidden>
            <AreaChart data={trend.map((v, i) => ({ i, v }))} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
              <Area dataKey="v" type="monotone" stroke="var(--color-v)" fill="var(--color-v)" fillOpacity={0.12} strokeWidth={1.5} />
            </AreaChart>
          </ChartContainer>
        ) : null}
      </div>
      {change !== undefined ? (
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            good === true && "text-success",
            good === false && "text-destructive",
            good === null && "text-muted-foreground"
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          <span className="tabular-nums">
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          <span className="font-normal text-muted-foreground">{period}</span>
        </span>
      ) : null}
    </Root>
  )
}

export { StatCard }
