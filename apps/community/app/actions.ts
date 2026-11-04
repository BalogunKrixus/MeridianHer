"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@meridianher/db/server"
import { sanitizeRichText, plainText } from "@meridianher/ui/lib/rich-text"
import { z } from "zod"

import { getViewer } from "../lib/data"

type Result = { error?: string }

const MESSAGES: Record<string, string> = {
  rate_limited: "You have posted a lot in the last hour. Please take a short break and try again later.",
  post_closed: "Replies are closed on this post.",
  reply_too_deep: "You can reply to a reply, but not further down the thread.",
}

function friendly(error: { message: string; code?: string } | null, fallback: string) {
  if (!error) return undefined
  if (MESSAGES[error.message]) return MESSAGES[error.message]
  if (error.code === "42501" || /row-level security/.test(error.message)) {
    return "Your account can't do that right now. If you were muted, this lifts automatically when the mute ends."
  }
  return fallback
}

async function member() {
  const viewer = await getViewer()
  return viewer?.onboarding_complete ? viewer : null
}

const SIGN_IN = { error: "Please sign in first." }

const postInput = z.object({
  type: z.enum(["question", "discussion"]),
  space: z.string().min(1),
  title: z.string().trim().min(10).max(150),
  body: z.unknown().optional(),
  tags: z.array(z.string()).max(3),
  contentWarning: z.enum(["pregnancy-loss", "graphic", "mental-health"]).nullable(),
  askExpert: z.boolean(),
  anonymous: z.boolean(),
})

export async function createPost(input: z.input<typeof postInput>): Promise<{ id?: string; error?: string }> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  const parsed = postInput.safeParse(input)
  if (!parsed.success) return { error: "Please check your post. The title needs 10 to 150 characters." }
  const v = parsed.data
  const body = v.body ? sanitizeRichText(v.body) : null
  if (body && plainText(body).length > 5000) return { error: "Keep your post under 5,000 characters." }

  const supabase = await createClient()
  const { data: space } = await supabase.from("spaces").select("id, tags").eq("slug", v.space).single()
  if (!space) return { error: "That space is not available." }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: viewer.user_id,
      space_id: space.id,
      type: v.type,
      title: v.title,
      body,
      tags: v.tags.filter((t) => space.tags.includes(t)),
      content_warning: v.contentWarning ? (v.contentWarning.replace("-", "_") as "pregnancy_loss" | "graphic" | "mental_health") : null,
      ask_expert: v.askExpert,
      fully_anonymous: v.anonymous,
    })
    .select("id")
    .single()
  if (error || !data) return { error: friendly(error, "We could not publish your post. Please try again.") }
  revalidatePath("/")
  return { id: data.id }
}

export async function createReply(postId: string, parentReplyId: string | null, rawBody: unknown): Promise<Result> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  const body = sanitizeRichText(rawBody)
  if (!body) return { error: "Write something before you post your reply." }
  if (plainText(body).length > 5000) return { error: "Keep your reply under 5,000 characters." }
  const supabase = await createClient()
  const { error } = await supabase
    .from("replies")
    .insert({ author_id: viewer.user_id, post_id: postId, parent_reply_id: parentReplyId, body })
  if (error) return { error: friendly(error, "We could not post your reply. Please try again.") }
  revalidatePath(`/p/${postId}`)
  return {}
}

const target = z.object({ type: z.enum(["post", "reply"]), id: z.uuid() })

export async function react(type: "post" | "reply", id: string, kind: "hug" | "same" | "helpful", active: boolean): Promise<Result> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  if (!target.safeParse({ type, id }).success || !["hug", "same", "helpful"].includes(kind)) return { error: "Something went wrong." }
  const supabase = await createClient()
  const { error } = active
    ? await supabase.from("reactions").insert({ user_id: viewer.user_id, target_type: type, target_id: id, kind })
    : await supabase.from("reactions").delete().match({ user_id: viewer.user_id, target_type: type, target_id: id, kind })
  if (error && error.code !== "23505") return { error: friendly(error, "We could not save your reaction.") }
  return {}
}

export async function setSaved(type: "post" | "reply", id: string, saved: boolean): Promise<Result> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  if (!target.safeParse({ type, id }).success) return { error: "Something went wrong." }
  const supabase = await createClient()
  const { error } = saved
    ? await supabase.from("saves").insert({ user_id: viewer.user_id, target_type: type, target_id: id })
    : await supabase.from("saves").delete().match({ user_id: viewer.user_id, target_type: type, target_id: id })
  if (error && error.code !== "23505") return { error: friendly(error, "We could not update your saved list.") }
  return {}
}

const reportInput = z.object({
  type: z.enum(["post", "reply", "profile"]),
  id: z.uuid(),
  reason: z.enum(["harassment", "misinformation", "selling", "privacy", "self_harm", "sexual", "other"]),
  note: z.string().max(500),
})

export async function report(input: z.input<typeof reportInput>): Promise<Result> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  const parsed = reportInput.safeParse(input)
  if (!parsed.success) return { error: "Please choose a reason." }
  const supabase = await createClient()
  const { error } = await supabase.from("reports").insert({
    reporter_id: viewer.user_id,
    target_type: parsed.data.type,
    target_id: parsed.data.id,
    reason: parsed.data.reason,
    note: parsed.data.note || null,
  })
  // Reporting the same thing twice is fine: the first report stands
  if (error && error.code !== "23505") return { error: friendly(error, "We could not send your report. Please try again.") }
  return {}
}

export async function followSpace(spaceId: string, follow: boolean): Promise<Result> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  if (!z.uuid().safeParse(spaceId).success) return { error: "Something went wrong." }
  const supabase = await createClient()
  const { error } = follow
    ? await supabase.from("space_follows").insert({ user_id: viewer.user_id, space_id: spaceId })
    : await supabase.from("space_follows").delete().match({ user_id: viewer.user_id, space_id: spaceId })
  if (error && error.code !== "23505") return { error: friendly(error, "We could not update the spaces you follow.") }
  revalidatePath("/")
  return {}
}
