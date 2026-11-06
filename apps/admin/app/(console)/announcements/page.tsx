import type { Metadata } from "next"
import { Badge } from "@meridianher/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@meridianher/ui/components/table"
import { createClient } from "@meridianher/db/server"

import { communityPost } from "@/lib/community"
import { ago, dateTime } from "@/lib/format"
import { requireAdmin } from "@/lib/staff"
import { PageHeader } from "@/components/page-header"
import { BannerForm, EndBannerButton, TeamPostForm } from "./announcement-forms"

export const metadata: Metadata = { title: "Announcements" }

export default async function AnnouncementsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const [{ data: spaces }, { data: banners }, { data: posts }] = await Promise.all([
    supabase.from("spaces").select("id, name").eq("archived", false).order("sort_order"),
    supabase.from("announcements").select("id, body, space_id, starts_at, ends_at").eq("banner", true).order("starts_at", { ascending: false }).limit(20),
    supabase.from("posts").select("id, title, space_id, pinned, created_at").eq("as_team", true).is("deleted_at", null).order("created_at", { ascending: false }).limit(20),
  ])
  const spaceName = new Map((spaces ?? []).map((s) => [s.id, s.name]))
  const now = Date.now()
  const state = (b: { starts_at: string; ends_at: string | null }) =>
    new Date(b.starts_at).getTime() > now ? "Scheduled" : b.ends_at && new Date(b.ends_at).getTime() <= now ? "Ended" : "Live"

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Announcements" description="Post as MeridianHer Team, pin it, and show a banner across the community." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Team post</CardTitle>
            <CardDescription>Shows the TEAM badge. Pinned posts sit above the feed in their space.</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamPostForm spaces={spaces ?? []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Banner</CardTitle>
            <CardDescription>A short line at the top of every page, or one space, for as long as you choose.</CardDescription>
          </CardHeader>
          <CardContent>
            <BannerForm spaces={spaces ?? []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">Banners</CardTitle>
        </CardHeader>
        <CardContent>
          {banners?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Where</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((b) => {
                  const s = state(b)
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="max-w-md truncate">{b.body}</TableCell>
                      <TableCell>{b.space_id ? spaceName.get(b.space_id) : "Everywhere"}</TableCell>
                      <TableCell className="tabular-nums">{dateTime(b.starts_at)}</TableCell>
                      <TableCell className="tabular-nums">{b.ends_at ? dateTime(b.ends_at) : "Until ended"}</TableCell>
                      <TableCell>
                        <Badge variant={s === "Live" ? "success" : s === "Scheduled" ? "secondary" : "outline"}>{s}</Badge>
                      </TableCell>
                      <TableCell>{s !== "Ended" ? <EndBannerButton id={b.id} /> : null}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-small text-muted-foreground">No banners yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">Recent team posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts?.length ? (
            <Table>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-md truncate">
                      <a href={communityPost(p.id)} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
                        {p.title}
                      </a>
                    </TableCell>
                    <TableCell>{spaceName.get(p.space_id)}</TableCell>
                    <TableCell>{p.pinned ? <Badge variant="soft">Pinned</Badge> : null}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{ago(p.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-small text-muted-foreground">No team posts yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
