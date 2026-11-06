import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { safeNext } from "@meridianher/db/proxy"
import { createClient } from "@meridianher/db/server"

import { suggestNames } from "./names"
import { OnboardingFlow } from "./onboarding-flow"

export const metadata: Metadata = { title: "Welcome" }

export default async function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  const params = await searchParams
  const next = safeNext(typeof params.next === "string" ? params.next : undefined)

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/sign-in?next=/welcome")

  const [{ data: profile }, { data: spaces }] = await Promise.all([
    supabase.from("profiles").select("onboarding_complete").eq("user_id", auth.user.id).single(),
    supabase.from("spaces").select("slug, name, icon, accent_color").order("sort_order"),
  ])
  if (profile?.onboarding_complete) redirect(next)

  // Her Google name, so we can warn (never block) if her display name gives it away
  const meta = auth.user.user_metadata as Record<string, unknown>
  const realNameParts = [meta.given_name, meta.family_name, meta.full_name, meta.name]
    .filter((v): v is string => typeof v === "string")
    .flatMap((v) => v.toLowerCase().split(/\s+/))
    .filter((v) => v.length > 1)

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-10">
      <OnboardingFlow
        next={next}
        spaces={(spaces ?? []).map((s) => ({ slug: s.slug, name: s.name, icon: s.icon, tone: s.accent_color }))}
        suggestions={suggestNames(4)}
        realNameParts={[...new Set(realNameParts)]}
      />
    </main>
  )
}
