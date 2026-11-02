import "server-only"

import { redirect } from "next/navigation"
import { createClient } from "@meridianher/db/server"

/** Server side role check for every admin page (PRD section 11). Returns the signed in staff member. */
export async function requireStaff() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) redirect("/sign-in")
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, role")
    .eq("user_id", userId)
    .single()
  if (!profile || !["moderator", "admin", "super_admin"].includes(profile.role)) redirect("/sign-in?error=access")
  return profile
}
