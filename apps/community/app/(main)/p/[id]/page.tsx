import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { after } from "next/server"
import { ClockIcon } from "lucide-react"
import type { JSONContent } from "@meridianher/ui/patterns/rich-text-editor"
import { Alert, AlertDescription, AlertTitle } from "@meridianher/ui/components/alert"
import { ButtonLink } from "@meridianher/ui/components/button"
import { plainText } from "@meridianher/ui/lib/rich-text"
import type { SpaceTone } from "@meridianher/ui/lib/spaces"
import { CrisisCard } from "@meridianher/ui/patterns/cards"
import type { ReactionKind } from "@meridianher/ui/patterns/reaction-bar"
import type { ExpertAnswerData, ReplyData } from "@meridianher/ui/patterns/reply-thread"
import { RichTextContent } from "@meridianher/ui/patterns/rich-text-content"
import { createClient } from "@meridianher/db/server"

import { getCrisisResources, getViewer, toPostCard, toWarning } from "@/lib/data"
import { EXPERT_CATEGORY_LABELS, timeAgo } from "@/lib/format"
import { SortTabs } from "@/components/sort-tabs"
import { FeedPostCard } from "@/components/feed-post-card"
import { PostView } from "./post-view"

const DAY = 24 * 60 * 60 * 1000

async function loadPost(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const supabase = await createClient()
  const { data } = await supabase.from("feed_posts").select("*").eq("id", id).maybeSingle()
  return data
}

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const post = await loadPost((await params).id)
  if (!post) return { title: "Post not found" }
  const description = post.body_text?.slice(0, 160) || `A question in ${post.space_name} on MeridianHer.`
  return {
    title: post.title!,
    description,
    alternates: { canonical: `/p/${post.id}` },
    openGraph: { title: post.title!, description, type: "article" },
    // Posts behind a content warning stay out of search previews
    robots: post.content_warning ? { index: false } : undefined,
  }
}

type Row = { reaction_counts: unknown; is_helped_me: boolean | null; created_at: string | null }
const score = (r: Row) => {
  const c = (r.reaction_counts ?? {}) as Record<string, number>
  return (r.is_helped_me ? 1000 : 0) + (c.helpful ?? 0) * 2 + (c.hug ?? 0) + (c.same ?? 0)
}

export default async function PostPage({ params, searchParams }: PageProps<"/p/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const sort = query.sort === "top" ? "top" : "oldest"
  const supabase = await createClient()
  const viewer = await getViewer()
  const member = viewer?.onboarding_complete ? viewer : null
  const post = await loadPost(id)

  if (!post) {
    // Her own post may still be held for checking; nobody else can see it yet
    const own = viewer
      ? (await supabase.from("posts").select("title, status, deleted_at").eq("id", id).eq("author_id", viewer.user_id).maybeSingle()).data
      : null
    if (!own) notFound()
    const held = own.status === "held" && !own.deleted_at
    return (
      <main className="mx-auto flex max-w-[680px] flex-col gap-4 px-4 py-8">
        <Alert>
          <ClockIcon aria-hidden />
          <AlertTitle>{held ? "Your post is being checked" : "This post is not visible"}</AlertTitle>
          <AlertDescription>
            {held
              ? `"${own.title}" will appear as soon as a moderator has looked at it, usually within a few hours. We will let you know.`
              : own.deleted_at
                ? `"${own.title}" was deleted.`
                : `"${own.title}" was removed by a moderator. Your notifications explain which rule it broke and how to appeal.`}
          </AlertDescription>
        </Alert>
        <ButtonLink variant="outline" className="self-start" href="/">
          Back to the feed
        </ButtonLink>
      </main>
    )
  }

  after(async () => {
    await supabase.rpc("record_view", { post: id })
  })

  const { data: rows } = await supabase.from("thread_replies").select("*").eq("post_id", id).order("created_at")
  const replies = rows ?? []
  const replyIds = replies.map((r) => r.id!)
  let relatedQuery = supabase.from("feed_posts").select("*").eq("space_id", post.space_id!).neq("id", id)
  if (post.tags?.length) relatedQuery = relatedQuery.overlaps("tags", post.tags)
  const [mine, savedRows, follow, expert, related, crisis, crisisNeeded] = await Promise.all([
    member
      ? supabase.from("reactions").select("target_id, kind").eq("user_id", member.user_id).in("target_id", [id, ...replyIds])
      : Promise.resolve({ data: [] }),
    member
      ? supabase.from("saves").select("target_id").eq("user_id", member.user_id).in("target_id", [id, ...replyIds])
      : Promise.resolve({ data: [] }),
    member ? supabase.from("post_follows").select("id").eq("post_id", id).eq("user_id", member.user_id).maybeSingle() : Promise.resolve({ data: null }),
    member?.role === "expert"
      ? supabase.from("expert_profiles").select("status").eq("user_id", member.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    relatedQuery.order("reply_count", { ascending: false }).limit(3),
    getCrisisResources(),
    // Straight after she posts, offer help if her words suggest she is in crisis (PRD section 8)
    query.new && post.is_mine
      ? supabase.rpc("mentions_crisis", { content: `${post.title} ${post.body_text ?? ""}` }).then((r) => !!r.data)
      : Promise.resolve(false),
  ])
  const isExpert = expert.data?.status === "active"
  const saved = new Set((savedRows.data ?? []).map((s) => s.target_id))
  const myReactions = (target: string) => (mine.data ?? []).filter((r) => r.target_id === target).map((r) => r.kind as ReactionKind)
  const counts = (v: unknown): Record<ReactionKind, number> => {
    const c = (v ?? {}) as Partial<Record<ReactionKind, number>>
    return { hug: c.hug ?? 0, same: c.same ?? 0, helpful: c.helpful ?? 0 }
  }
  const editable = (created: string | null) => !!created && Date.now() - new Date(created).getTime() < DAY

  const expertRows = replies.filter((r) => r.is_expert_answer && !r.removed && !r.parent_reply_id)
  const handles = expertRows.map((r) => r.expert_handle).filter((h): h is string => !!h)
  const { data: experts } = handles.length
    ? await supabase.from("public_experts").select("handle, title").in("handle", handles)
    : { data: [] }

  const expertAnswers: (ExpertAnswerData & { mine: boolean; saved: boolean })[] = expertRows.map((r) => ({
    id: r.id!,
    expert: {
      name: r.author_name!,
      title: experts?.find((e) => e.handle === r.expert_handle)?.title ?? "Verified expert",
      specialty: EXPERT_CATEGORY_LABELS[r.expert_category ?? "other"],
      href: r.expert_handle ? `/e/${r.expert_handle}` : undefined,
    },
    body: <RichTextContent doc={r.body as JSONContent} />,
    timeAgo: timeAgo(r.created_at),
    reactions: counts(r.reaction_counts),
    myReactions: myReactions(r.id!),
    mine: !!r.is_mine,
    saved: saved.has(r.id!),
  }))

  type Reply = ReplyData & { bodyJson: JSONContent | null; replies: Reply[]; replyAs?: string }
  const toReply = (r: (typeof replies)[number]): Reply => ({
    id: r.id!,
    author: { displayName: r.author_name ?? "", asTeam: !!r.as_team, tone: post.space_tone as SpaceTone },
    body: <RichTextContent doc={r.body as JSONContent} />,
    bodyJson: r.body as JSONContent | null,
    timeAgo: timeAgo(r.created_at) + (r.edited_at ? " · edited" : ""),
    reactions: counts(r.reaction_counts),
    myReactions: myReactions(r.id!),
    expertCategory: r.by_expert && r.expert_category ? EXPERT_CATEGORY_LABELS[r.expert_category] : undefined,
    expertEnded: !!r.expert_status_ended,
    helpedMe: !!r.is_helped_me,
    removed: r.removed ? {} : undefined,
    mine: !!r.is_mine,
    editable: !!r.is_mine && editable(r.created_at),
    saved: saved.has(r.id!),
    canMarkExpertAnswer: isExpert && !!r.is_mine && !r.parent_reply_id,
    replies: [],
  })
  const ordered = sort === "top" ? [...replies].sort((a, b) => score(b) - score(a)) : replies
  const pinned = new Set(expertAnswers.map((a) => a.id))
  const thread: Reply[] = []
  const byId = new Map<string, Reply>()
  for (const r of replies) byId.set(r.id!, toReply(r))
  for (const r of ordered) {
    const item = byId.get(r.id!)!
    const parent = r.parent_reply_id ? byId.get(r.parent_reply_id) : undefined
    if (parent) parent.replies!.push(item)
    else if (!pinned.has(item.id)) thread.push(item)
  }
  // Replies to a pinned expert answer stay in the thread
  for (const a of expertAnswers) {
    const answer = byId.get(a.id)!
    // Threads are two levels deep, so answering one of these replies joins it under the expert answer
    for (const r of answer.replies) thread.push({ ...(r as Reply), replyAs: a.id })
  }
  const visibleReplies = replies.filter((r) => !r.removed).length
  const relatedPosts = (related.data ?? []).map((r) => toPostCard(r, saved))
  const base = `/p/${id}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: post.title,
      text: post.body_text || post.title,
      answerCount: visibleReplies,
      dateCreated: post.created_at,
      author: { "@type": "Person", name: post.author_name },
      ...(expertRows[0]
        ? {
            acceptedAnswer: {
              "@type": "Answer",
              text: plainText(expertRows[0].body as JSONContent),
              dateCreated: expertRows[0].created_at,
              author: { "@type": "Person", name: expertRows[0].author_name },
            },
          }
        : {}),
    },
  }

  return (
    <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-4 py-8">
      {post.type === "question" && !post.content_warning ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      ) : null}
      {crisisNeeded ? <CrisisCard countries={crisis} /> : null}
      <PostView
        post={{
          id: post.id!,
          title: post.title!,
          body: post.body as JSONContent | null,
          authorName: post.author_name!,
          authorHref: post.author_user_id && !post.fully_anonymous ? `/m/${encodeURIComponent(post.author_name!)}` : undefined,
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
          saved: saved.has(post.id!),
          mine: !!post.is_mine,
          editable: !!post.is_mine && editable(post.created_at),
          following: !!follow.data,
          justPosted: !!query.new && !!post.is_mine,
          askExpert: !!post.ask_expert && post.type === "question" && !post.has_expert_answer,
        }}
        expertAnswers={expertAnswers}
        thread={thread}
        replyCount={visibleReplies}
        isExpert={isExpert}
        crisis={crisis}
        sortTabs={
          visibleReplies > 1 ? (
            <SortTabs
              label="Sort replies"
              current={sort}
              options={[
                { value: "oldest", label: "Oldest", href: base },
                { value: "top", label: "Top", href: `${base}?sort=top` },
              ]}
            />
          ) : null
        }
      />
      <p className="text-center text-small text-muted-foreground">
        Community answers share experience, not diagnosis. If you are worried, speak to a doctor.
      </p>
      {relatedPosts.length ? (
        <section aria-labelledby="related-title" className="flex flex-col gap-3">
          <h2 id="related-title" className="text-h3">
            Related in {post.space_name}
          </h2>
          {relatedPosts.map((p) => (
            <FeedPostCard key={p.id} post={p} />
          ))}
        </section>
      ) : null}
    </main>
  )
}
