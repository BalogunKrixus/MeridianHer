/** Public Supabase settings, available on the server and in the browser. */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)")
  }
  return { url, key }
}

/**
 * Auth cookies are shared across community and admin subdomains in production
 * (PRD section 11) by setting AUTH_COOKIE_DOMAIN, for example ".meridianher.com".
 */
export function cookieOptions() {
  const domain = process.env.AUTH_COOKIE_DOMAIN
  return { sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", ...(domain ? { domain } : {}) }
}
