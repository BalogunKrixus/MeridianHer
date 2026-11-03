import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { safeNext } from "./proxy"
import { createClient } from "./server"

/** The app's own origin, from NEXT_PUBLIC_SITE_URL, falling back to the request. */
async function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, "")
  const h = await headers()
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`
}

async function callbackUrl(next: string) {
  return `${await siteUrl()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`
}

/** Google sign in. Only openid, email and profile are requested (PRD section 5). */
export async function startGoogleSignIn(next: string): Promise<never> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: await callbackUrl(next),
      scopes: "openid email profile",
      queryParams: { prompt: "select_account" },
    },
  })
  if (error || !data.url) redirect(`/sign-in?error=google&next=${encodeURIComponent(safeNext(next))}`)
  redirect(data.url)
}

const email = z.string().trim().toLowerCase().pipe(z.email())

/** Passwordless email link, valid for 15 minutes (set in the Supabase project). */
export async function sendMagicLink(next: string, address: string): Promise<{ error?: string }> {
  const parsed = email.safeParse(address)
  if (!parsed.success) return { error: "Enter an email address like name@example.com." }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: await callbackUrl(next), shouldCreateUser: true },
  })
  if (error) return { error: "We could not send the link just now. Please try again in a minute." }
  return {}
}

/** Route handler for /auth/callback: swaps the one time code for a session, then returns her to where she was. */
export async function handleAuthCallback(request: NextRequest) {
  const url = request.nextUrl
  const next = safeNext(url.searchParams.get("next"))
  const code = url.searchParams.get("code")
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
  }
  return NextResponse.redirect(new URL(`/sign-in?error=link&next=${encodeURIComponent(next)}`, url.origin))
}

/** Signs out and goes to `to`: home in community, the sign in page in admin. */
export async function signOut(to = "/"): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(to)
}
