import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { InboxIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { EmptyState } from "@meridianher/ui/patterns/cards"
import { createClient } from "@meridianher/db/server"

import { getSpaces, getViewer, toPostCard } from "@/lib/data"
import { FeedPostCard } from "@/components/feed-post-card"
import { SortTabs } from "@/components/sort-tabs"

export const metadata: Metadata = { title: "Expert inbox", robots: { index: false } }

/** Questions where members asked for an expert, oldest unanswered first (PRD section 7). */
export default async function ExpertInbox({ searchParams }: PageProps<"/experts/inbox">) {
  const params = await searchParams
  const viewer = await getViewer()
  if (!viewer?.onboarding_complete) redirect("/sign-in?next=/experts/inbox")
  if (viewer.role !== "expert") redirect("/experts/apply")
  const space = typeof params.space === "string" ? params.space : undefined
  const tab = params.tab === "all" ? "all" : "waiting"
  const supabase = await createClient()
  const spaces = (await getSpaces()).filter((s) => s.ask_expert_enabled)
  const spaceId = spaces.find((s) => s.slug === space)?.id

  let query = supabase.from("feed_posts").select("*").eq("type", "question").eq("ask_expert", true).limit(40)
  query = tab === "waiting" ? query.eq("has_expert_answer", false).order("created_at", { ascending: true }) : query.order("created_at", { ascending: false })
  if (spaceId) query = query.eq("space_id", spaceId)
  const { data } = await query
  const posts = (data ?? []).map((r) => toPostCard(r, new Set()))
  const href = (next: { tab?: string; space?: string | null }) => {
    const u = new URLSearchParams()
    const t = next.tab ?? tab
    const s = next.space === undefined ? space : next.space
    if (t === "all") u.set("tab", "all")
    if (s) u.set("space", s)
    const qs = u.toString()
    return `/experts/inbox${qs ? `?${qs}` : ""}`
  }

  return (
    <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-4 py-8">
      <header>
        <h1 className="text-h1">Expert inbox</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Members asked for an expert on these. The longest waiting are at the top. Thank you for your time.
        </p>
      </header>
      <SortTabs
        label="Inbox view"
        current={tab}
        options={[
          { value: "waiting", label: "Waiting for an expert", href: href({ tab: "waiting" }) },
          { value: "all", label: "All expert questions", href: href({ tab: "all" }) },
        ]}
      />
      <nav aria-label="Filter by space" className="flex gap-1.5 overflow-x-auto pb-1">
        <ButtonLink size="sm" variant={space ? "ghost" : "secondary"} href={href({ space: null })}>
          All spaces
        </ButtonLink>
        {spaces.map((s) => (
          <ButtonLink key={s.slug} size="sm" className="shrink-0" variant={space === s.slug ? "secondary" : "ghost"} href={href({ space: s.slug })}>
            {s.name}
          </ButtonLink>
        ))}
      </nav>
      {posts.length ? (
        posts.map((p) => <FeedPostCard key={p.id} post={p} />)
      ) : (
        <EmptyState
          icon={InboxIcon}
          title="Every question has an expert answer"
          description="Nothing is waiting for you right now. Unanswered community questions could still use your view."
          action={<ButtonLink href="/?sort=unanswered">See unanswered questions</ButtonLink>}
        />
      )}
    </main>
  )
}
