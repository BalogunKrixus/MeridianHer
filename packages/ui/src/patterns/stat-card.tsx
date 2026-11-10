"use client"

import { cn } from "../lib/utils"
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { Area, AreaChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card"
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

  return (
    <Card size="sm" className={cn("relative", href && "hover:bg-muted/40 focus-within:ring-3 focus-within:ring-ring", className)}>
      <CardHeader>
        <CardDescription>
          {href ? (
            <a href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {label}
            </a>
          ) : (
            label
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <CardTitle className="text-h1 tabular-nums">{value}</CardTitle>
        {trend?.length ? (
          <ChartContainer config={config} className="aspect-auto h-10 w-24" aria-hidden>
            <AreaChart data={trend.map((v, i) => ({ i, v }))} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
              <XAxis dataKey="i" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Area dataKey="v" type="monotone" stroke="var(--color-v)" fill="var(--color-v)" fillOpacity={0.12} strokeWidth={1.5} />
            </AreaChart>
          </ChartContainer>
        ) : null}
      </CardContent>
      {change !== undefined ? (
        <CardContent
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
        </CardContent>
      ) : null}
    </Card>
  )
}

export { StatCard }
