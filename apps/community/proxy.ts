import { NextResponse, type NextRequest } from "next/server"
import { updateSession, withSession } from "@meridianher/db/proxy"

/** Refreshes the session and sends members who have not finished onboarding to /welcome. */
export async function proxy(request: NextRequest) {
  const session = await updateSession(request)
  const { pathname, search } = request.nextUrl
  const onboarding = pathname === "/welcome"

  if (session.claims?.onboarded === false && !onboarding && !pathname.startsWith("/auth/")) {
    const target = new URL("/welcome", request.url)
    target.searchParams.set("next", pathname + search)
    return withSession(NextResponse.redirect(target), session)
  }
  if (onboarding && !session.claims) {
    return withSession(NextResponse.redirect(new URL("/sign-in?next=/welcome", request.url)), session)
  }
  return session.response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|design|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
