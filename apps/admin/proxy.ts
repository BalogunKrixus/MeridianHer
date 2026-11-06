import { NextResponse, type NextRequest } from "next/server"
import { updateSession, withSession } from "@meridianher/db/proxy"

const STAFF = new Set(["moderator", "admin", "super_admin"])

/**
 * Admin has no public pages (PRD section 9). Everyone except signed in staff is
 * sent to sign in. Pages check the role again against the database.
 */
export async function proxy(request: NextRequest) {
  const session = await updateSession(request)
  const { pathname, search } = request.nextUrl
  if (pathname === "/sign-in" || pathname.startsWith("/auth/")) return session.response

  if (!session.claims) {
    const target = new URL("/sign-in", request.url)
    target.searchParams.set("next", pathname + search)
    return withSession(NextResponse.redirect(target), session)
  }
  if (!STAFF.has(session.claims.user_role ?? "")) {
    return withSession(NextResponse.redirect(new URL("/sign-in?error=access", request.url)), session)
  }
  return session.response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|design|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
