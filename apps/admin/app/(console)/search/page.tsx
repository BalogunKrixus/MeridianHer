import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { SearchIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@meridianher/ui/components/input-group"
import { Table, TableBody, TableCell, TableRow } from "@meridianher/ui/components/table"
import { createClient } from "@meridianher/db/server"

import { communityPost } from "@/lib/community"
import { ago, EXPERT_CATEGORY_LABELS, STATUS_BADGE } from "@/lib/format"
import { requireStaff } from "@/lib/staff"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = { title: "Search" }

/** Members, posts and experts by any field (PRD 9.1), from the command palette or the address bar. */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const staff = await requireStaff()
  const raw = (await searchParams).q
  const q = typeof raw === "string" ? raw.trim().slice(0, 100) : ""
  const supabase = await createClient()
  const like = `%${q.replace(/[%_,()]/g, " ")}%`
  const isId = /^[0-9a-f-]{36}$/i.test(q)
  if (isId) {
    // A pasted member id jumps straight to that member
    const { data: member } = await supabase.from("profiles").select("user_id").eq("user_id", q).maybeSingle()
    if (member) redirect(`/members/${member.user_id}`)
  }

  const [members, posts, experts] = q
    ? await Promise.all([
        supabase.rpc("staff_members", { search: isId ? undefined : q, max_rows: 20 }),
        isId
          ? supabase.from("posts").select("id, title, status, created_at").eq("id", q)
          : supabase.from("posts").select("id, title, status, created_at").or(`title.ilike.${like},body_text.ilike.${like}`).order("created_at", { ascending: false }).limit(20),
        staff.isAdmin
          ? supabase.from("expert_profiles").select("user_id, public_name, legal_name, category, licence_number").or(`public_name.ilike.${like},legal_name.ilike.${like},licence_number.ilike.${like}`).limit(10)
          : Promise.resolve({ data: [] }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]
  const memberRows = ((members.data ?? []) as { user_id: string; display_name: string; role: string; status: string; joined: string }[]).filter(
    (m) => !isId || m.user_id === q
  )

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader title="Search" description="Members by display name, posts by title or text, experts by name or licence number. Paste an ID to jump to it." />
      <form action="/search" role="search" className="max-w-xl">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput name="q" type="search" defaultValue={q} autoFocus aria-label="Search" placeholder="Search everything" />
        </InputGroup>
      </form>
      {q ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Members</CardTitle>
            </CardHeader>
            <CardContent>
              {memberRows.length ? (
                <Table>
                  <TableBody>
                    {memberRows.map((m) => (
                      <TableRow key={m.user_id}>
                        <TableCell>
                          <a href={`/members/${m.user_id}`} className="font-medium underline-offset-4 hover:underline">
                            {m.display_name}
                          </a>
                        </TableCell>
                        <TableCell className="capitalize">{m.role.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGE[m.status]} className="capitalize">
                            {m.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-small text-muted-foreground">No members match.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {posts.data?.length ? (
                <Table>
                  <TableBody>
                    {posts.data.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="max-w-56 truncate">
                          <a href={communityPost(p.id)} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
                            {p.title}
                          </a>
                        </TableCell>
                        <TableCell className="capitalize">{p.status}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{ago(p.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-small text-muted-foreground">No posts match.</p>
              )}
            </CardContent>
          </Card>
          {staff.isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-h3">Experts</CardTitle>
              </CardHeader>
              <CardContent>
                {experts.data?.length ? (
                  <Table>
                    <TableBody>
                      {experts.data.map((e) => (
                        <TableRow key={e.user_id}>
                          <TableCell>
                            <a href={`/members/${e.user_id}`} className="font-medium underline-offset-4 hover:underline">
                              {e.public_name}
                            </a>
                            <span className="block text-xs text-muted-foreground">{e.legal_name}</span>
                          </TableCell>
                          <TableCell>{EXPERT_CATEGORY_LABELS[e.category]}</TableCell>
                          <TableCell className="font-mono text-xs">{e.licence_number}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-small text-muted-foreground">No experts match.</p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
