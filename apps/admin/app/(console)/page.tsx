import type { Metadata } from "next"
import { ArrowRightIcon, BadgeCheckIcon, ClockIcon, FlagIcon, ScaleIcon, SirenIcon, TimerIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@meridianher/ui/components/table"
import { cn } from "@meridianher/ui/lib/utils"
import { ActivityChart } from "@meridianher/ui/patterns/activity-chart"
import { StatCard } from "@meridianher/ui/patterns/stat-card"
import { createClient } from "@meridianher/db/server"

import { EXPERT_CATEGORY_LABELS, percentChange } from "@/lib/format"
import { requireStaff } from "@/lib/staff"
import { PageHeader } from "@/components/page-header"
import { UrlFilters } from "@/components/url-filters"

export const metadata: Metadata = { title: "Overview" }

type Overview = {
  headline: Record<"members" | "new_members" | "new_members_before" | "active" | "active_before" | "posts" | "posts_before" | "replies" | "replies_before", number>
  attention: Record<"urgent" | "reported" | "held" | "appeals" | "applications" | "unanswered_expert", number>
  activity: { day: string; posts: number; replies: number; members: number }[]
  response: { questions: number; answered_24h_pct: number | null; median_first_reply_minutes: number | null; median_expert_hours: number | null }
  spaces: { id: string; name: string; members: number; posts: number; unanswered: number; reports: number }[]
  experts: { name: string; category: string; answers: number; helpful: number }[]
  moderation: { reports_in: number; resolved: number; median_resolution_hours: number | null }
}

const RANGES = [
  { label: "Today", value: "1" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
]

const minutes = (m: number | null) => (m === null ? "No data" : m < 60 ? `${m} min` : `${Math.round(m / 6) / 10} h`)
const fmt = (n: number) => n.toLocaleString("en-GB")

export default async function Overview({ searchParams }: PageProps<"/">) {
  await requireStaff()
  const params = await searchParams
  const days = RANGES.some((r) => r.value === params.range) ? Number(params.range) : 7
  const space = typeof params.space === "string" ? params.space : undefined
  const supabase = await createClient()
  const [{ data }, { data: spaces }] = await Promise.all([
    supabase.rpc("admin_overview", { days, in_space: space }),
    supabase.from("spaces").select("id, name").order("sort_order"),
  ])
  const o = data as Overview | null
  const period = days === 1 ? "vs yesterday" : `vs previous ${days} days`

  if (!o) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Overview" description="We could not load the dashboard. Refresh to try again." />
      </div>
    )
  }

  const h = o.headline
  const attention = [
    { label: "Urgent crisis flags", value: o.attention.urgent, href: "/moderation?tab=urgent", icon: SirenIcon, urgent: true },
    { label: "Open reports", value: o.attention.reported, href: "/moderation?tab=reported", icon: FlagIcon },
    { label: "Held posts and replies", value: o.attention.held, href: "/moderation?tab=held", icon: TimerIcon },
    { label: "Appeals waiting", value: o.attention.appeals, href: "/moderation?tab=appeals", icon: ScaleIcon },
    { label: "Expert applications", value: o.attention.applications, href: "/experts", icon: BadgeCheckIcon },
    { label: "Expert questions over 48 hours", value: o.attention.unanswered_expert, href: "/content?filter=unanswered_expert", icon: ClockIcon },
  ]
  const allClear = attention.every((a) => !a.value)

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Overview" description="Is the community healthy today?" />
      <UrlFilters
        filters={[
          { id: "range", label: "Date range", options: RANGES },
          { id: "space", label: "Space", options: (spaces ?? []).map((s) => ({ label: s.name, value: s.id })) },
        ]}
      />

      <section aria-label="Headline numbers" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Members" value={fmt(h.members)} />
        <StatCard label="New members" value={fmt(h.new_members)} change={percentChange(h.new_members, h.new_members_before)} period={period} trend={o.activity.map((a) => a.members)} />
        <StatCard label="Active members" value={fmt(h.active)} change={percentChange(h.active, h.active_before)} period={period} />
        <StatCard label="Posts" value={fmt(h.posts)} change={percentChange(h.posts, h.posts_before)} period={period} trend={o.activity.map((a) => a.posts)} />
        <StatCard label="Replies" value={fmt(h.replies)} change={percentChange(h.replies, h.replies_before)} period={period} trend={o.activity.map((a) => a.replies)} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Activity</CardTitle>
            <CardDescription>Posts, replies and new members per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart
              data={o.activity}
              series={[
                { key: "posts", label: "Posts" },
                { key: "replies", label: "Replies" },
                { key: "members", label: "New members" },
              ]}
            />
          </CardContent>
        </Card>
        <Card render={<section aria-labelledby="attention-title" />}>
          <CardHeader>
            <CardTitle id="attention-title" className="text-h3">
              Needs attention
            </CardTitle>
            <CardDescription>{allClear ? "Nothing is waiting. Nice work." : "Oldest first in each queue"}</CardDescription>
          </CardHeader>
          <CardContent className="px-1.5">
            <ul>
              {attention.map(({ label, value, href, icon: Icon, urgent }) => (
                <li key={label}>
                  <ButtonLink variant="ghost" href={href} className="w-full justify-start">
                    <Icon data-icon="inline-start" className={urgent && value ? "text-destructive" : "text-muted-foreground"} aria-hidden />
                    <span className="flex-1 text-left font-normal">{label}</span>
                    <span className={cn("tabular-nums", value ? "font-semibold" : "text-muted-foreground", urgent && value && "text-destructive")}>
                      {value}
                    </span>
                    <ArrowRightIcon data-icon="inline-end" className="text-muted-foreground" aria-hidden />
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <section aria-label="Response health" className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Questions answered within 24 hours"
          value={o.response.answered_24h_pct === null ? "No data" : `${o.response.answered_24h_pct}%`}
        />
        <StatCard label="Median time to first reply" value={minutes(o.response.median_first_reply_minutes)} />
        <StatCard
          label="Median time to expert answer"
          value={o.response.median_expert_hours === null ? "No data" : `${o.response.median_expert_hours} h`}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Spaces</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Space</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead className="text-right">Unanswered</TableHead>
                  <TableHead className="text-right">Open reports</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {o.spaces.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(s.members)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(s.posts)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.unanswered}</TableCell>
                    <TableCell className={cn("text-right tabular-nums", s.reports && "font-semibold text-destructive")}>{s.reports}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Expert leaderboard</CardTitle>
              <CardDescription>Answers this month</CardDescription>
            </CardHeader>
            <CardContent>
              {o.experts.length ? (
                <Table>
                  <TableBody>
                    {o.experts.slice(0, 8).map((e) => (
                      <TableRow key={e.name}>
                        <TableCell>
                          <span className="font-medium">{e.name}</span>
                          <span className="block text-xs text-muted-foreground">{EXPERT_CATEGORY_LABELS[e.category]}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{e.answers}</TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">{e.helpful} helpful</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-small text-muted-foreground">No verified experts yet.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Moderation load</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-2 text-small">
                <div>
                  <dt className="text-muted-foreground">Reports in</dt>
                  <dd className="text-h3 tabular-nums">{o.moderation.reports_in}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Resolved</dt>
                  <dd className="text-h3 tabular-nums">{o.moderation.resolved}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Median time</dt>
                  <dd className="text-h3 tabular-nums">{o.moderation.median_resolution_hours === null ? "No data" : `${o.moderation.median_resolution_hours} h`}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
