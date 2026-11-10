import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"
import { supabaseEnv } from "./env"

/**
 * Bypasses RLS. Only for the few server side jobs that must act outside a
 * member's own rights, such as deleting an under 16 account. Never import it
 * into client code.
 */
export function createSecretClient() {
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!secret) throw new Error("Set SUPABASE_SECRET_KEY on the server (see .env.example)")
  return createClient<Database>(supabaseEnv().url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
}
