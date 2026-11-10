import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { BookmarkIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { plainText } from "@meridianher/ui/lib/rich-text"
import type { JSONContent } from "@meridianher/ui/patterns/rich-text-editor"
import { EmptyState } from "@meridianher/ui/patterns/cards"
import { createClient } from "@meridianher/db/server"

import { getViewer, toPostCard } from "@/lib/data"
import { timeAgo } from "@/lib/format"
import { FeedPostCard } from "@/components/feed-post-card"

export const metadata: Metadata = { title: "Saved" }

export default async function SavedPage() {
  const viewer = await getViewer()
  if (!viewer?.onboarding_complete) redirect("/sign-in?next=/saved")
  const supabase = await createClient()
  const { data: saves } = await supabase
    .from("saves")
    .select("target_type, target_id, created_at")
    .eq("user_id", viewer.user_id)
    .order("created_at", { ascending: false })
    .limit(100)
  const postIds = (saves ?? []).filter((s) => s.target_type === "post").map((s) => s.target_id)
  const replyIds = (saves ?? []).filter((s) => s.target_type === "reply").map((s) => s.target_id)

  const [{ data: postRows }, { data: replyRows }] = await Promise.all([
    postIds.length ? supabase.from("feed_posts").select("*").in("id", postIds) : Promise.resolve({ data: [] }),
    replyIds.length
      ? supabase.from("thread_replies").select("id, post_id, body, author_name, created_at, removed").in("id", replyIds)
      : Promise.resolve({ data: [] }),
  ])
  const savedSet = new Set(postIds)
  const posts = postIds.map((id) => postRows?.find((p) => p.id === id)).filter((p) => !!p).map((p) => toPostCard(p, savedSet))
  const replies = (replyRows ?? []).filter((r) => !r.removed)
  const { data: replyPosts } = replies.length
    ? await supabase.from("feed_posts").select("id, title").in("id", replies.map((r) => r.post_id!))
    : { data: [] }

  return (
    <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-4 py-8">
      <header>
        <h1 className="text-h1">Saved</h1>
        <p className="mt-1 text-body text-muted-foreground">Only you can see what you save.</p>
      </header>
      {!posts.length && !replies.length ? (
        <EmptyState
          icon={BookmarkIcon}
          title="Nothing saved yet"
          description="Tap the bookmark on any post or reply to keep it here. Only you can see your saved list."
          action={<ButtonLink href="/?sort=expert">Browse expert answers</ButtonLink>}
        />
      ) : null}
      {posts.map((p) => (
        <FeedPostCard key={p.id} post={p} />
      ))}
      {replies.length ? (
        <Card render={<section aria-labelledby="saved-replies" />}>
          <CardHeader>
            <CardTitle render={<h2 />} id="saved-replies" className="text-h3">
              Replies you saved
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1.5">
            <ul>
              {replies.map((r) => (
                <li key={r.id}>
                  <ButtonLink
                    variant="ghost"
                    href={`/p/${r.post_id}#reply-${r.id}`}
                    className="h-auto w-full flex-col items-start gap-1 py-3 text-left whitespace-normal"
                  >
                    <span className="line-clamp-3 font-normal">{plainText(r.body as JSONContent)}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {r.author_name} · {timeAgo(r.created_at)} · on {replyPosts?.find((p) => p.id === r.post_id)?.title ?? "a post"}
                    </span>
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}
