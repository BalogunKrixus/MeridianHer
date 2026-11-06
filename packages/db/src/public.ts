import { createClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"
import { supabaseEnv } from "./env"

/** Reads exactly what a signed out visitor can see. For sitemaps and other cached, cookie free pages. */
export function createPublicClient() {
  const { url, key } = supabaseEnv()
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
