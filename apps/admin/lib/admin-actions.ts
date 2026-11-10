"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@meridianher/db/server"
import { sanitizeRichText } from "@meridianher/ui/lib/rich-text"
import { z } from "zod"

import { requireAdmin } from "@/lib/staff"

type Result = { error?: string }

const TONES = ["periods", "fertility", "pregnancy", "postpartum", "menopause", "conditions", "sexual", "mind", "nutrition", "body"] as const

const space = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(3).max(60),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/),
  description: z.string().trim().min(10).max(300),
  icon: z.string().min(1),
  accent_color: z.enum(TONES),
  rules: z.array(z.string().trim().min(3).max(200)).max(5),
  tags: z.array(z.string().trim().min(2).max(40)).max(20),
  min_age: z.union([z.literal(16), z.literal(18)]).nullable(),
  ask_expert_enabled: z.boolean(),
  show_crisis_card: z.boolean(),
})

export type SpaceInput = z.input<typeof space>

export async function saveSpace(input: SpaceInput): Promise<Result> {
  await requireAdmin()
  const parsed = space.safeParse(input)
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "")
    return {
      error:
        field === "slug"
          ? "The address needs 2 to 40 lowercase letters, numbers or dashes."
          : field === "rules"
            ? "Up to five extra rules, each at least a few words."
            : "Check the name (3 to 60 characters) and description (10 to 300).",
    }
  }
  const { id, ...values } = parsed.data
  const supabase = await createClient()
  const { error } = id
    ? await supabase.from("spaces").update(values).eq("id", id)
    : await supabase.from("spaces").insert({ ...values, sort_order: 1000 })
  revalidatePath("/spaces")
  if (error) return { error: /duplicate|unique/i.test(error.message) ? "Another space already uses that address." : "We could not save the space." }
  return {}
}

export async function archiveSpace(id: string, archived: boolean): Promise<Result> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from("spaces").update({ archived }).eq("id", id)
  revalidatePath("/spaces")
  return error ? { error: "We could not update the space." } : {}
}

/** Saves a new order: index in the list becomes sort_order, in steps of 10. */
export async function reorderSpaces(ids: string[]): Promise<Result> {
  await requireAdmin()
  const supabase = await createClient()
  for (const [i, id] of ids.entries()) {
    const { error } = await supabase.from("spaces").update({ sort_order: (i + 1) * 10 }).eq("id", id)
    if (error) return { error: "We could not save the new order." }
  }
  revalidatePath("/spaces")
  return {}
}

const teamPost = z.object({
  space: z.uuid(),
  title: z.string().trim().min(10).max(150),
  body: z.unknown(),
  pin: z.boolean(),
  announcement: z.boolean(),
})

/** A post as MeridianHer Team, optionally pinned (PRD 9.7). */
export async function publishTeamPost(input: z.input<typeof teamPost>): Promise<{ id?: string; error?: string }> {
  const staff = await requireAdmin()
  const parsed = teamPost.safeParse(input)
  if (!parsed.success) return { error: "Choose a space and write a title of 10 to 150 characters." }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: staff.user_id,
      space_id: parsed.data.space,
      type: parsed.data.announcement ? "announcement" : "discussion",
      title: parsed.data.title,
      body: parsed.data.body ? sanitizeRichText(parsed.data.body) : null,
      as_team: true,
    })
    .select("id")
    .single()
  if (error || !data) return { error: "We could not publish the post." }
  if (parsed.data.pin) await supabase.rpc("moderate", { kind: "post", target: data.id, action: "pin" })
  revalidatePath("/announcements")
  return { id: data.id }
}

const banner = z.object({
  body: z.string().trim().min(5).max(280),
  space: z.uuid().nullable(),
  startsAt: z.string().min(1),
  endsAt: z.string().nullable(),
})

/** A dismissible banner across the community, or one space, between two times (PRD 9.7). */
export async function scheduleBanner(input: z.input<typeof banner>): Promise<Result> {
  const staff = await requireAdmin()
  const parsed = banner.safeParse(input)
  if (!parsed.success) return { error: "Write 5 to 280 characters and choose when it starts." }
  const starts = new Date(parsed.data.startsAt)
  const ends = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null
  if (Number.isNaN(starts.getTime()) || (ends && ends <= starts)) return { error: "The end must be after the start." }
  const supabase = await createClient()
  const { error } = await supabase.from("announcements").insert({
    author_id: staff.user_id,
    body: parsed.data.body,
    space_id: parsed.data.space,
    banner: true,
    starts_at: starts.toISOString(),
    ends_at: ends?.toISOString() ?? null,
  })
  revalidatePath("/announcements")
  return error ? { error: "We could not schedule the banner." } : {}
}

export async function endBanner(id: string): Promise<Result> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from("announcements").update({ ends_at: new Date().toISOString() }).eq("id", id)
  revalidatePath("/announcements")
  return error ? { error: "We could not end the banner." } : {}
}

const SETTING_KEYS = [
  "blocked_words",
  "allowed_link_domains",
  "crisis_keywords",
  "crisis_resources",
  "new_account_hold",
  "rate_limits",
  "report_auto_hide_threshold",
] as const

// Letters, numbers, spaces and apostrophes only: these lists are matched as patterns in the database
const WORDS = /^[\p{L}\p{N}' ]+$/u

const settingValue: Record<(typeof SETTING_KEYS)[number], z.ZodType> = {
  blocked_words: z.array(z.string().trim().min(2).max(60).regex(WORDS)).max(1000),
  allowed_link_domains: z.array(z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)).max(500),
  crisis_keywords: z.array(z.string().trim().min(3).max(80).regex(WORDS)).max(500),
  crisis_resources: z
    .array(
      z.object({
        country: z.string().trim().min(2),
        resources: z.array(
          z.object({
            name: z.string().trim().min(2),
            detail: z.string().trim().optional(),
            phone: z.string().trim().optional(),
            href: z.url().optional(),
          })
        ),
      })
    )
    .max(30),
  new_account_hold: z.object({ hours: z.number().int().min(0).max(720), items: z.number().int().min(0).max(20) }),
  rate_limits: z.object({ posts_per_hour: z.number().int().min(1).max(100), replies_per_hour: z.number().int().min(1).max(500) }),
  report_auto_hide_threshold: z.number().int().min(1).max(50),
}

export async function saveSetting(key: (typeof SETTING_KEYS)[number], value: unknown): Promise<Result> {
  await requireAdmin()
  if (!SETTING_KEYS.includes(key)) return { error: "Unknown setting." }
  const parsed = settingValue[key].safeParse(value)
  if (!parsed.success) {
    return {
      error:
        key === "blocked_words" || key === "crisis_keywords"
          ? "Use letters, numbers, spaces and apostrophes only, one word or phrase per line."
          : key === "allowed_link_domains"
            ? "Write each domain on its own line, like nhs.uk, without https or slashes."
            : "Check the values. Something is not in the expected format.",
    }
  }
  const supabase = await createClient()
  const { data: existing } = await supabase.from("settings").select("id").eq("key", key).maybeSingle()
  const { error } = existing
    ? await supabase.from("settings").update({ value: parsed.data as never }).eq("id", existing.id)
    : await supabase.from("settings").insert({ key, value: parsed.data as never })
  revalidatePath("/settings")
  return error ? { error: "We could not save that setting." } : {}
}
