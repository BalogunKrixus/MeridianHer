import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Table, TableBody, TableCell, TableRow } from "@meridianher/ui/components/table"
import { InitialAvatar } from "@meridianher/ui/patterns/chips"
import { createClient } from "@meridianher/db/server"

import { communityPost } from "@/lib/community"
import { age, ago, date, STATUS_BADGE } from "@/lib/format"
import { requireStaff } from "@/lib/staff"
import { MemberActions, NoteForm } from "./member-actions"

export const metadata: Metadata = { title: "Member" }

type Detail = {
  profile: { user_id: string; display_name: string | null; role: string; status: string; muted_until: string | null; joined: string; last_active: string | null }
  posts: { id: string; title: string; status: string; deleted: boolean; created_at: string }[]
  replies: { id: string; post_id: string; text: string; status: string; created_at: string }[]
  sanctions: { id: string; kind: string; reason: string | null; until: string | null; appeal_status: string | null; by: string; at: string }[]
  notes: { note: string; by: string; at: string }[]
  history: { action: string; by: string; reason: string | null; at: string }[]
}

export default async function MemberPage({ params }: PageProps<"/members/[id]">) {
  const staff = await requireStaff()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const supabase = await createClient()
  const { data } = await supabase.rpc("staff_member_detail", { member: id })
  const d = data as Detail | null
  if (!d?.profile) notFound()
  const p = d.profile
  const name = p.display_name ?? "Not onboarded yet"

  return (
    <div className="flex flex-col gap-4 p-6">
      <ButtonLink variant="ghost" size="sm" href="/members" className="self-start">
        <ArrowLeftIcon data-icon="inline-start" aria-hidden />
        All members
      </ButtonLink>
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-wrap items-center gap-4">
              <InitialAvatar name={name} size="lg" />
              <div className="min-w-0 flex-1">
                <CardTitle render={<h1 />} className="flex flex-wrap items-center gap-2 text-h2">
                  {name}
                  <Badge variant={STATUS_BADGE[p.status]} className="capitalize">
                    {p.status}
                    {p.muted_until ? ` until ${date(p.muted_until)}` : ""}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {p.role.replace("_", " ")}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Joined {date(p.joined)} ({age(p.joined)}) · last active {ago(p.last_active)} · {d.posts.length} posts · {d.replies.length} replies
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {d.posts.length ? (
                <Table>
                  <TableBody>
                    {d.posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-md truncate">
                          <a href={communityPost(post.id)} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                            {post.title}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant={post.deleted ? "outline" : post.status === "published" ? "secondary" : "warning"} className="capitalize">
                            {post.deleted ? "deleted" : post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{ago(post.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-small text-muted-foreground">No posts.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Replies</CardTitle>
            </CardHeader>
            <CardContent>
              {d.replies.length ? (
                <Table>
                  <TableBody>
                    {d.replies.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-md truncate">
                          <a href={communityPost(r.post_id, r.id)} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                            {r.text || "(empty)"}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "published" ? "secondary" : "warning"} className="capitalize">
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{ago(r.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-small text-muted-foreground">No replies.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">History</CardTitle>
              <CardDescription>Every staff action on this account, from the audit log</CardDescription>
            </CardHeader>
            <CardContent>
              {d.history.length ? (
                <ol className="flex flex-col gap-2 text-small">
                  {d.history.map((h, i) => (
                    <li key={i} className="flex flex-wrap gap-x-2">
                      <span className="text-muted-foreground tabular-nums">{ago(h.at)}</span>
                      <span className="font-medium">{h.by}</span>
                      <span>{h.action}</span>
                      {h.reason ? <span className="text-muted-foreground">· {h.reason}</span> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-small text-muted-foreground">No staff actions yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <MemberActions
            member={{ id: p.user_id, name, role: p.role, status: p.status }}
            isAdmin={staff.isAdmin}
            isSuperAdmin={staff.isSuperAdmin}
            isMe={staff.user_id === p.user_id}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Sanctions</CardTitle>
            </CardHeader>
            <CardContent>
              {d.sanctions.length ? (
                <ul className="flex flex-col gap-3 text-small">
                  {d.sanctions.map((s) => (
                    <li key={s.id}>
                      <span className="flex items-center gap-2">
                        <Badge variant={s.kind === "ban" ? "destructive" : "warning"} className="capitalize">
                          {s.kind}
                        </Badge>
                        <span className="text-muted-foreground">
                          {ago(s.at)} by {s.by}
                        </span>
                      </span>
                      <span className="mt-1 block">{s.reason}</span>
                      {s.appeal_status ? <span className="block text-muted-foreground">Appeal {s.appeal_status}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-small text-muted-foreground">No warnings, mutes or bans.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Private notes</CardTitle>
              <CardDescription>Only the team sees these.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <NoteForm member={p.user_id} />
              {d.notes.map((n, i) => (
                <div key={i} className="text-small">
                  <p>{n.note}</p>
                  <p className="text-xs text-muted-foreground">
                    {n.by} · {ago(n.at)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
