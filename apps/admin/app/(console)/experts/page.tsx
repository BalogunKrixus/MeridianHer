import type { Metadata } from "next"
import { Badge } from "@meridianher/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@meridianher/ui/components/table"
import { createClient } from "@meridianher/db/server"

import { ago, date, EXPERT_CATEGORY_LABELS } from "@/lib/format"
import { requireAdmin } from "@/lib/staff"
import { PageHeader } from "@/components/page-header"
import { ExpertStatusMenu, InviteButton } from "./expert-controls"

export const metadata: Metadata = { title: "Experts" }

const COLUMNS = [
  { status: "submitted", label: "Submitted" },
  { status: "in_review", label: "In review" },
  { status: "more_info", label: "More info requested" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
] as const

export default async function ExpertsPage({ searchParams }: PageProps<"/experts">) {
  await requireAdmin()
  const params = await searchParams
  const supabase = await createClient()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const [{ data: applications }, { data: invites }, { data: experts }] = await Promise.all([
    supabase.from("expert_applications").select("id, legal_name, title, category, source, status, created_at, reviewed_at").order("created_at"),
    supabase.from("expert_invites").select("id, name, email, category, expires_at, accepted_at, created_at").is("accepted_at", null).order("created_at", { ascending: false }),
    supabase.from("expert_profiles").select("user_id, handle, public_name, category, verified_at, renewal_due, status").order("public_name"),
  ])
  const { data: answers } = experts?.length
    ? await supabase.from("replies").select("author_id").in("author_id", experts.map((e) => e.user_id)).gte("created_at", monthStart)
    : { data: [] }
  const answerCount = (id: string) => (answers ?? []).filter((a) => a.author_id === id).length
  const now = Date.now()

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Experts"
        description="Every badge needs a licence checked against a public register. Invited experts are fast tracked, never skipped."
        actions={<InviteButton openOnLoad={params.invite === "1"} />}
      />

      <section aria-labelledby="applications-title" className="flex flex-col gap-3">
        <h2 id="applications-title" className="text-h3">
          Applications
        </h2>
        <div className="grid gap-3 overflow-x-auto md:grid-cols-5">
          {COLUMNS.map((c) => {
            const items = (applications ?? []).filter((a) => a.status === c.status)
            const shown = c.status === "approved" || c.status === "rejected" ? items.slice(-5).reverse() : items
            return (
              <Card key={c.status} variant="flat" size="sm" className="min-w-52">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    {c.label}
                    <Badge variant="outline" className="tabular-nums">
                      {items.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {shown.map((a) => (
                    <Card key={a.id} size="sm" className="relative gap-1 py-2.5 focus-within:ring-3 focus-within:ring-ring">
                      <CardContent className="flex flex-col gap-1 px-3">
                        <a href={`/experts/applications/${a.id}`} className="font-medium after:absolute after:inset-0 focus-visible:outline-none">
                          {a.legal_name}
                        </a>
                        <span className="text-xs text-muted-foreground">{EXPERT_CATEGORY_LABELS[a.category]}</span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {a.source === "invited" ? <Badge variant="soft">Invited</Badge> : null}
                          {ago(a.reviewed_at ?? a.created_at)}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                  {!shown.length ? <p className="py-2 text-xs text-muted-foreground">None</p> : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">Active experts</CardTitle>
          <CardDescription>Badges are suspended automatically 30 days after the renewal date.</CardDescription>
        </CardHeader>
        <CardContent>
          {experts?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expert</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Renewal due</TableHead>
                  <TableHead className="text-right">Replies this month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {experts.map((e) => {
                  const dueSoon = new Date(e.renewal_due).getTime() - now < 30 * 86400000
                  return (
                    <TableRow key={e.user_id}>
                      <TableCell>
                        <a href={`/members/${e.user_id}`} className="font-medium underline-offset-4 hover:underline">
                          {e.public_name}
                        </a>
                        <span className="block text-xs text-muted-foreground">@{e.handle}</span>
                      </TableCell>
                      <TableCell>{EXPERT_CATEGORY_LABELS[e.category]}</TableCell>
                      <TableCell>{date(e.verified_at)}</TableCell>
                      <TableCell className={dueSoon ? "font-medium text-warning" : undefined}>{date(e.renewal_due)}</TableCell>
                      <TableCell className="text-right tabular-nums">{answerCount(e.user_id)}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === "active" ? "success" : "destructive"} className="capitalize">
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ExpertStatusMenu expert={{ id: e.user_id, name: e.public_name, status: e.status }} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-small text-muted-foreground">No verified experts yet. Approve an application or send an invite.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">Pending invites</CardTitle>
        </CardHeader>
        <CardContent>
          {invites?.length ? (
            <Table>
              <TableBody>
                {invites.map((i) => {
                  const expired = new Date(i.expires_at).getTime() < now
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="text-muted-foreground">{i.email}</TableCell>
                      <TableCell>{EXPERT_CATEGORY_LABELS[i.category]}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={expired ? "outline" : "secondary"}>{expired ? "Expired" : `Expires ${date(i.expires_at)}`}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-small text-muted-foreground">No invites waiting.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
