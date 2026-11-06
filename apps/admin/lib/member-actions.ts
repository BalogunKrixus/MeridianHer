"use server"

import { revalidatePath } from "next/cache"
import { createSecretClient } from "@meridianher/db/secret"
import { createClient } from "@meridianher/db/server"
import { z } from "zod"

import { requireAdmin, requireStaff } from "@/lib/staff"

type Result = { error?: string }
const id = z.uuid()

export async function addNote(member: string, note: string): Promise<Result> {
  const staff = await requireStaff()
  const text = note.trim()
  if (!id.safeParse(member).success || !text) return { error: "Write a note first." }
  const supabase = await createClient()
  const { error } = await supabase.from("member_notes").insert({ member_id: member, author_id: staff.user_id, note: text.slice(0, 2000) })
  revalidatePath(`/members/${member}`)
  return error ? { error: "We could not save the note." } : {}
}

const ROLES = ["member", "expert", "moderator", "admin", "super_admin"] as const

export async function setRole(member: string, role: (typeof ROLES)[number]): Promise<Result> {
  await requireAdmin()
  if (!id.safeParse(member).success || !ROLES.includes(role)) return { error: "Something went wrong." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("set_member_role", { member, new_role: role })
  revalidatePath(`/members/${member}`)
  if (!error) return {}
  return {
    error:
      error.message === "super_admin_only"
        ? "Only a super admin can grant or remove admin access."
        : error.message === "not_yourself"
          ? "You cannot change your own role."
          : "We could not change the role.",
  }
}

export async function revealPii(member: string, field: "email" | "google_name", reason: string): Promise<{ value?: string | null; error?: string }> {
  await requireAdmin()
  if (reason.trim().length < 5) return { error: "Say why you need it. Every reveal is logged." }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("reveal_member_pii", { member, field, reason: reason.trim() })
  if (error) return { error: "We could not reveal that." }
  return { value: data }
}

/** Deletes an account at the member's request. Posts stay as Former member unless removeContent. */
export async function deleteMember(member: string, removeContent: boolean, reason: string): Promise<Result> {
  const staff = await requireAdmin()
  if (!id.safeParse(member).success || member === staff.user_id) return { error: "You cannot delete this account here." }
  if (reason.trim().length < 5) return { error: "Record why the account is being deleted." }
  const supabase = await createClient()
  // The ban records the deletion and enforces who may act on whom, before anything is removed
  const { error } = await supabase.rpc("sanction_member", { member, kind: "ban", reason: `Account deleted on request: ${reason.trim()}` })
  if (error) {
    return {
      error: error.message === "cannot_sanction_staff" ? "Only a super admin can delete a team member's account." : "We could not record the deletion.",
    }
  }
  if (removeContent) {
    const admin = createSecretClient()
    const now = new Date().toISOString()
    await admin.from("posts").update({ deleted_at: now, deleted_by: staff.user_id, delete_reason: "Account deleted" }).eq("author_id", member).is("deleted_at", null)
    await admin.from("replies").update({ deleted_at: now, deleted_by: staff.user_id, delete_reason: "Account deleted" }).eq("author_id", member).is("deleted_at", null)
  }
  const { error: deleteError } = await createSecretClient().auth.admin.deleteUser(member)
  if (deleteError) return { error: "The account could not be deleted. Check that SUPABASE_SECRET_KEY is set for the admin app." }
  revalidatePath("/members")
  return {}
}
