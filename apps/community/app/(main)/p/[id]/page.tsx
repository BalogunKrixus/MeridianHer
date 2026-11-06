import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ClockIcon } from "lucide-react"
import type { JSONContent } from "@meridianher/ui/patterns/rich-text-editor"
import { Alert, AlertDescription, AlertTitle } from "@meridianher/ui/components/alert"
import { ButtonLink } from "@meridianher/ui/components/button"
import type { SpaceTone } from "@meridianher/ui/lib/spaces"
import type { ReactionKind } from "@meridianher/ui/patterns/reaction-bar"
import type { ExpertAnswerData, ReplyData } from "@meridianher/ui/patterns/reply-thread"
import { RichTextContent } from "@meridianher/ui/patterns/rich-text-content"
import { createClient } from "@meridianher/db/server"

import { getViewer, toWarning } from "@/lib/data"
import { EXPERT_CATEGORY_LABELS, timeAgo } from "@/lib/format"
import { PostView } from "./post-view"

async function loadPost(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const supabase = await createClient()
  const { data } = await supabase.from("feed_posts").select("*").eq("id", id).maybeSingle()
  return data
}

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const post = await loadPost((await params).id)
  return post ? { title: post.title!, description: post.body_text?.slice(0, 160) || undefined } : {}
}

export default async function PostPage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params
  const supabase = await createClient()
  const viewer = await getViewer()
  const post = await loadPost(id)

  if (!post) {
    // Her own post may still be held for checking; nobody else can see it yet
    const own = viewer
      ? (await supabase.from("posts").select("title, status").eq("id", id).eq("author_id", viewer.user_id).maybeSingle()).data
      : null
    if (!own) notFound()
    return (
        <main className="mx-auto flex max-w-[680px] flex-col gap-4 px-4 py-8">
        <Alert>
          <ClockIcon aria-hidden />
          <AlertTitle>{own.status === "held" ? "Your post is being checked" : "This post is not visible"}</AlertTitle>
          <AlertDescription>
            {own.status === "held"
              ? `"${own.title}" will appear as soon as a moderator has looked at it. New accounts have their first posts checked to keep everyone safe.`
              : `"${own.title}" was removed by a moderator. You will get a notification explaining which rule it broke.`}
          </AlertDescription>
        </Alert>
        <ButtonLink variant="outline" className="self-start" href="/">
          Back to the feed
        </ButtonLink>
      </main>
    )
  }

  const [{ data: rows }, saved] = await Promise.all([
    supabase.from("thread_replies").select("*").eq("post_id", id).order("created_at"),
    viewer
      ? supabase.from("saves").select("id").eq("target_type", "post").eq("target_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const replies = rows ?? []
  const mine = viewer
    ? await supabase
        .from("reactions")
        .select("target_id, kind")
        .eq("user_id", viewer.user_id)
        .in("target_id", [id, ...replies.map((r) => r.id!)])
    : { data: [] }
  const myReactions = (target: string) =>
    (mine.data ?? []).filter((r) => r.target_id === target).map((r) => r.kind as ReactionKind)
  const counts = (v: unknown): Record<ReactionKind, number> => {
    const c = (v ?? {}) as Partial<Record<ReactionKind, number>>
    return { hug: c.hug ?? 0, same: c.same ?? 0, helpful: c.helpful ?? 0 }
  }

  const expertRows = replies.filter((r) => r.is_expert_answer && !r.removed && !r.parent_reply_id)
  const handles = expertRows.map((r) => r.expert_handle).filter((h): h is string => !!h)
  const { data: experts } = handles.length
    ? await supabase.from("public_experts").select("handle, title").in("handle", handles)
    : { data: [] }

  const expertAnswers: ExpertAnswerData[] = expertRows.map((r) => ({
    id: r.id!,
    expert: {
      name: r.author_name!,
      title: experts?.find((e) => e.handle === r.expert_handle)?.title ?? "Verified expert",
      specialty: EXPERT_CATEGORY_LABELS[r.expert_category ?? "other"],
    },
    body: <RichTextContent doc={r.body as JSONContent} />,
    timeAgo: timeAgo(r.created_at),
    reactions: counts(r.reaction_counts),
    myReactions: myReactions(r.id!),
  }))

  const toReply = (r: (typeof replies)[number]): ReplyData => ({
    id: r.id!,
    author: { displayName: r.author_name ?? "", asTeam: !!r.as_team, tone: post.space_tone as SpaceTone },
    body: <RichTextContent doc={r.body as JSONContent} />,
    timeAgo: timeAgo(r.created_at),
    reactions: counts(r.reaction_counts),
    myReactions: myReactions(r.id!),
    expertCategory: r.by_expert && r.expert_category ? EXPERT_CATEGORY_LABELS[r.expert_category] : undefined,
    expertEnded: !!r.expert_status_ended,
    helpedMe: !!r.is_helped_me,
    removed: r.removed ? {} : undefined,
    replies: [],
  })
  const pinned = new Set(expertAnswers.map((a) => a.id))
  const thread: ReplyData[] = []
  const byId = new Map<string, ReplyData>()
  for (const r of replies) {
    const item = toReply(r)
    byId.set(item.id, item)
    const parent = r.parent_reply_id ? byId.get(r.parent_reply_id) : undefined
    if (parent && !pinned.has(parent.id)) parent.replies!.push(item)
    else if (!pinned.has(item.id)) thread.push(item)
  }
  const visibleReplies = replies.filter((r) => !r.removed).length

  return (
    <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-4 py-8">
      <PostView
        post={{
          id: post.id!,
          title: post.title!,
          body: post.body as JSONContent | null,
          authorName: post.author_name!,
          anonymous: !!post.fully_anonymous,
          asTeam: !!post.as_team,
          space: { slug: post.space_slug!, name: post.space_name!, tone: post.space_tone as SpaceTone },
          tags: post.tags ?? [],
          timeAgo: timeAgo(post.created_at),
          edited: !!post.edited_at,
          locked: !!post.locked,
          contentWarning: toWarning(post.content_warning),
          reactions: counts(post.reaction_counts),
          myReactions: myReactions(post.id!),
          saved: !!saved.data,
        }}
        expertAnswers={expertAnswers}
        thread={thread}
        replyCount={visibleReplies}
      />
      <p className="text-center text-small text-muted-foreground">
        Community answers share experience, not diagnosis. If you are worried, speak to a doctor.
      </p>
    </main>
  )
}
