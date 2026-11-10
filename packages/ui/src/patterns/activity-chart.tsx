"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../components/chart"
import { cn } from "../lib/utils"

export type ActivitySeries = { key: string; label: string }

/** Daily counts as lines, for the overview activity panel (PRD 9.2). Up to five series, coloured from the chart tokens. */
function ActivityChart({
  data,
  series,
  className,
}: {
  data: ({ day: string } & Record<string, number | string>)[]
  series: ActivitySeries[]
  className?: string
}) {
  const config = Object.fromEntries(series.map((s, i) => [s.key, { label: s.label, color: `var(--chart-${i + 1})` }])) satisfies ChartConfig
  const label = (day: string) => new Date(day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  return (
    <ChartContainer config={config} className={cn("aspect-auto h-64 w-full", className)}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={label} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => label(String(v))} />} />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s) => (
          <Line key={s.key} dataKey={s.key} type="monotone" stroke={`var(--color-${s.key})`} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ChartContainer>
  )
}

export { ActivityChart }
