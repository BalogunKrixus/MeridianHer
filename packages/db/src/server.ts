import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import type { Database } from "./database.types"
import { cookieOptions, supabaseEnv } from "./env"

/** Supabase client for server components, server actions and route handlers. Queries run as the signed in member, under RLS. */
export async function createClient() {
  const store = await cookies()
  const { url, key } = supabaseEnv()
  return createServerClient<Database>(url, key, {
    cookieOptions: cookieOptions(),
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // Server components cannot set cookies; the proxy refreshes the session instead.
        }
      },
    },
  })
}
