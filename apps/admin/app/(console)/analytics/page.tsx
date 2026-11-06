import type { Metadata } from "next"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@meridianher/ui/components/table"
import { StatCard } from "@meridianher/ui/patterns/stat-card"
import { createClient } from "@meridianher/db/server"

import { communityPost } from "@/lib/community"
import { date } from "@/lib/format"
import { requireAdmin } from "@/lib/staff"
import { CsvButton } from "@/components/csv-button"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = { title: "Analytics" }

type Analytics = {
  cohorts: { week: string; members: number; returned_month_2: number }[]
  activation: { members: number; acted_7d: number }
  zero_result_searches: { term: string; count: number }[]
  searches: { total: number; zero: number }
  most_viewed: { id: string; title: string; views: number }[]
  space_growth: { name: string; followers: number; new_30d: number; posts_30d: number }[]
  helpful_share: { replies: number; helpful: number }
}

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "No data")

function Section({ title, description, rows, filename, children }: { title: string; description?: string; rows: Record<string, unknown>[]; filename: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        <CardAction>
          <CsvButton filename={filename} rows={rows} />
        </CardAction>
      </CardHeader>
      <CardContent>{rows.length ? children : <p className="text-small text-muted-foreground">No data yet.</p>}</CardContent>
    </Card>
  )
}

export default async function AnalyticsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.rpc("admin_analytics")
  const a = data as Analytics | null
  if (!a) return <div className="p-6"><PageHeader title="Analytics" description="We could not load analytics. Refresh to try again." /></div>

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Analytics" description="Last 30 days unless stated. Search terms are never linked to a member." />
      <section aria-label="Key rates" className="grid gap-3 sm:grid-cols-3">
        <StatCard label="New members who act in their first week" value={pct(a.activation.acted_7d, a.activation.members)} />
        <StatCard label="Replies marked helpful" value={pct(a.helpful_share.helpful, a.helpful_share.replies)} />
        <StatCard label="Searches with no results" value={pct(a.searches.zero, a.searches.total)} goodWhen="down" />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Content gaps" description="Searches that found nothing. Good prompts for team posts and experts." rows={a.zero_result_searches} filename="content-gaps">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead className="text-right">Searches</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.zero_result_searches.map((z) => (
                <TableRow key={z.term}>
                  <TableCell>{z.term}</TableCell>
                  <TableCell className="text-right tabular-nums">{z.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section title="Retention by signup week" description="Members still active a month after joining" rows={a.cohorts} filename="retention-cohorts">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week of</TableHead>
                <TableHead className="text-right">Joined</TableHead>
                <TableHead className="text-right">Active after a month</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.cohorts.map((c) => (
                <TableRow key={c.week}>
                  <TableCell>{date(c.week)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.members}</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(c.returned_month_2, c.members)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section title="Most viewed posts" rows={a.most_viewed} filename="most-viewed">
          <Table>
            <TableBody>
              {a.most_viewed.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-md truncate">
                    <a href={communityPost(p.id)} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                      {p.title}
                    </a>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.views.toLocaleString("en-GB")} views</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section title="Space growth" rows={a.space_growth} filename="space-growth">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Space</TableHead>
                <TableHead className="text-right">Following</TableHead>
                <TableHead className="text-right">New in 30 days</TableHead>
                <TableHead className="text-right">Posts in 30 days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.space_growth.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.followers}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.new_30d}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.posts_30d}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      </div>
      <p className="text-small text-muted-foreground">
        Visit to signup funnels and traffic sources come from product analytics once it is connected.
      </p>
    </div>
  )
}
