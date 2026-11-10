import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@meridianher/db/server"

/** Server side role check for every admin page (PRD section 11). Returns the signed in staff member. */
export const requireStaff = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) redirect("/sign-in")
  const { data: profile } = await supabase.from("profiles").select("user_id, display_name, role").eq("user_id", userId).single()
  if (!profile || !["moderator", "admin", "super_admin"].includes(profile.role)) redirect("/sign-in?error=access")
  return { ...profile, isAdmin: profile.role !== "moderator", isSuperAdmin: profile.role === "super_admin" }
})

/** Admin only pages send moderators back to the queue. */
export async function requireAdmin() {
  const staff = await requireStaff()
  if (!staff.isAdmin) redirect("/moderation")
  return staff
}

export type QueueCounts = { urgent: number; reported: number; held: number; appeals: number; applications: number }

export const getQueueCounts = cache(async (): Promise<QueueCounts> => {
  const supabase = await createClient()
  const { data } = await supabase.rpc("staff_queue_counts")
  return { urgent: 0, reported: 0, held: 0, appeals: 0, applications: 0, ...((data ?? {}) as Partial<QueueCounts>) }
})
