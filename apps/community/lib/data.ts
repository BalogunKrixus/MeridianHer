import "server-only"

import { cache } from "react"
import type { Views } from "@meridianher/db/types"
import { createClient } from "@meridianher/db/server"
import type { SpaceTone } from "@meridianher/ui/lib/spaces"
import type { PostCardData } from "@meridianher/ui/patterns/post-card"
import type { ContentWarningType } from "@meridianher/ui/patterns/content-warning-blur"

import { timeAgo } from "./format"

export const PAGE_SIZE = 20

/** The signed in member for this request, or null for a visitor. */
export const getViewer = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, role, status, onboarding_complete")
    .eq("user_id", userId)
    .single()
  return profile
})

export const getSpaces = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("spaces")
    .select("id, slug, name, description, icon, accent_color, rules, tags, ask_expert_enabled, show_crisis_card, min_age")
    .order("sort_order")
  return data ?? []
})

export type FeedSort = "for-you" | "new" | "unanswered" | "expert"

export async function getFeed({ sort, spaceId, before }: { sort: FeedSort; spaceId?: string; before?: string }) {
  const supabase = await createClient()
  const viewer = await getViewer()
  let query = supabase.from("feed_posts").select("*").order("created_at", { ascending: false }).limit(PAGE_SIZE + 1)
  if (spaceId) query = query.eq("space_id", spaceId)
  if (before) query = query.lt("created_at", before)
  if (sort === "unanswered") query = query.eq("reply_count", 0).eq("type", "question")
  if (sort === "expert") query = query.eq("has_expert_answer", true)
  if (sort === "for-you" && viewer && !spaceId) {
    const { data: follows } = await supabase.from("space_follows").select("space_id").eq("user_id", viewer.user_id)
    query = query.in("space_id", (follows ?? []).map((f) => f.space_id))
  }
  const { data } = await query
  const rows = data ?? []
  const saved = await getSavedIds(rows.map((r) => r.id!))
  return {
    posts: rows.slice(0, PAGE_SIZE).map((r) => toPostCard(r, saved)),
    nextBefore: rows.length > PAGE_SIZE ? rows[PAGE_SIZE - 1].created_at : null,
  }
}

async function getSavedIds(ids: string[]) {
  const viewer = await getViewer()
  if (!viewer || !ids.length) return new Set<string>()
  const supabase = await createClient()
  const { data } = await supabase.from("saves").select("target_id").eq("target_type", "post").in("target_id", ids)
  return new Set((data ?? []).map((s) => s.target_id))
}

export function toWarning(value: string | null): ContentWarningType | undefined {
  return value ? (value.replace("_", "-") as ContentWarningType) : undefined
}

export function toPostCard(row: Views<"feed_posts">, saved: Set<string>): PostCardData {
  const counts = (row.reaction_counts ?? {}) as Record<string, number>
  return {
    id: row.id!,
    href: `/p/${row.id}`,
    title: row.title!,
    excerpt: row.body_text || undefined,
    author: { displayName: row.author_name!, anonymous: !!row.fully_anonymous, asTeam: !!row.as_team },
    space: { name: row.space_name!, tone: row.space_tone as SpaceTone, href: `/s/${row.space_slug}` },
    tag: row.tags?.[0] ? { label: row.tags[0] } : undefined,
    timeAgo: timeAgo(row.created_at),
    edited: !!row.edited_at,
    replyCount: row.reply_count ?? 0,
    reactionCount: (counts.hug ?? 0) + (counts.same ?? 0) + (counts.helpful ?? 0),
    expertAnswer: row.has_expert_answer ? {} : undefined,
    contentWarning: toWarning(row.content_warning),
    saved: saved.has(row.id!),
  }
}

/** Unread notifications for the bell and the phone tab bar. */
export const getUnreadCount = cache(async () => {
  const viewer = await getViewer()
  if (!viewer?.onboarding_complete) return 0
  const supabase = await createClient()
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", viewer.user_id)
    .is("read_at", null)
  return count ?? 0
})

/** The site wide banner an admin has switched on, if any (PRD 9.7). */
export const getBanner = cache(async () => {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { data } = await supabase
    .from("announcements")
    .select("id, body")
    .eq("banner", true)
    .is("space_id", null)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
})
