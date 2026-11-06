"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@meridianher/db/server"
import { z } from "zod"

import { requireStaff } from "@/lib/staff"

type Result = { error?: string }
type Kind = "post" | "reply" | "profile"

const ERRORS: Record<string, string> = {
  reason_required: "Choose or write a reason first.",
  cannot_sanction_staff: "Only a super admin can sanction another team member.",
  not_yourself: "You cannot do that to your own account.",
  super_admin_only: "Only a super admin can do that.",
  not_found: "That item no longer exists.",
  admin_only: "Only admins can do that.",
}

function fail(error: { message: string } | null, fallback: string): Result {
  return error ? { error: ERRORS[error.message] ?? fallback } : {}
}

const kind = z.enum(["post", "reply", "profile"])
const id = z.uuid()

export async function claim(type: Kind, target: string, release = false): Promise<Result> {
  await requireStaff()
  if (!kind.safeParse(type).success || !id.safeParse(target).success) return { error: "Something went wrong." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("claim_item", { kind: type, target, release })
  revalidatePath("/moderation")
  return fail(error, "We could not claim that item.")
}

/** Approve (or dismiss a report) and hide, for one item or a bulk selection. */
export async function decide(
  items: { type: Kind; id: string }[],
  action: "approve" | "hide" | "dismiss" | "restore",
  reason?: { code?: string; text?: string }
): Promise<Result & { done?: number }> {
  await requireStaff()
  const supabase = await createClient()
  let done = 0
  for (const item of items.slice(0, 100)) {
    if (!kind.safeParse(item.type).success || !id.safeParse(item.id).success) continue
    // Profiles have no content to approve: approving a profile report dismisses it
    const effective = item.type === "profile" && action !== "hide" ? "dismiss" : action
    const { error } = await supabase.rpc("moderate", {
      kind: item.type,
      target: item.id,
      action: effective,
      reason_code: reason?.code,
      reason_text: reason?.text,
    })
    if (error) return { ...fail(error, "We could not finish that action."), done }
    done++
  }
  revalidatePath("/", "layout")
  return { done }
}

export async function sanction(input: {
  member: string
  kind: "warn" | "mute" | "ban" | "unmute" | "unban"
  days?: number
  reason?: string
  hide?: { type: Kind; id: string }
}): Promise<Result> {
  await requireStaff()
  if (!id.safeParse(input.member).success) return { error: "Something went wrong." }
  const supabase = await createClient()
  if (input.hide) {
    const hidden = await decide([input.hide], input.hide.type === "profile" ? "dismiss" : "hide", { text: input.reason })
    if (hidden.error) return hidden
  }
  const { error } = await supabase.rpc("sanction_member", {
    member: input.member,
    kind: input.kind,
    days: input.days,
    reason: input.reason,
  })
  revalidatePath("/", "layout")
  return fail(error, "We could not apply that to the member.")
}

export async function escalate(type: Kind, target: string, note: string): Promise<Result> {
  await requireStaff()
  const supabase = await createClient()
  const { error } = await supabase.rpc("escalate_item", { kind: type, target, note })
  revalidatePath("/moderation")
  return fail(error, "We could not escalate that item.")
}

export async function decideAppeal(sanctionId: string, overturn: boolean, note: string): Promise<Result> {
  await requireStaff()
  if (!id.safeParse(sanctionId).success) return { error: "Something went wrong." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("decide_appeal", { sanction: sanctionId, overturn, note: note || undefined })
  revalidatePath("/moderation")
  return fail(error, "We could not record that decision.")
}

/** Pin, lock, move or add a content warning from the content table. */
export async function contentAction(
  postId: string,
  action: "pin" | "unpin" | "lock" | "unlock" | "move" | "warn_content" | "hide" | "restore",
  extra?: { space_id?: string; warning?: string; reason?: string }
): Promise<Result> {
  await requireStaff()
  if (!id.safeParse(postId).success) return { error: "Something went wrong." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("moderate", {
    kind: "post",
    target: postId,
    action,
    reason_text: extra?.reason,
    extra: extra?.space_id ? { space_id: extra.space_id } : extra?.warning ? { warning: extra.warning } : {},
  })
  revalidatePath("/content")
  return fail(error, "We could not update that post.")
}
