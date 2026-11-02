import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "./database.types"
import { cookieOptions, supabaseEnv } from "./env"

export type SessionClaims = {
  sub: string
  /** Added by public.custom_access_token_hook */
  user_role?: Database["public"]["Enums"]["app_role"]
  onboarded?: boolean
}

/**
 * Refreshes the auth session on every request and returns the verified claims.
 * Call from each app's proxy.ts, then return `response` (or copy its cookies
 * onto a redirect with `withSession`).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, key } = supabaseEnv()
  const supabase = createServerClient<Database>(url, key, {
    cookieOptions: cookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([header, value]) => response.headers.set(header, value))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const claims = (data?.claims ?? null) as SessionClaims | null
  return { response, claims }
}

/** A redirect that keeps any refreshed auth cookies. */
export function withSession(target: NextResponse, session: { response: NextResponse }) {
  session.response.cookies.getAll().forEach((cookie) => target.cookies.set(cookie))
  return target
}

/** Only same site paths, so a crafted `next` cannot send her to another site after sign in. */
export function safeNext(next: string | null | undefined, fallback = "/") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback
}
