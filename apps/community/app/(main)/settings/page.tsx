import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@meridianher/db/server"

import { getViewer } from "@/lib/data"
import { NOTIFICATION_KINDS, NOTIFICATION_SETTINGS } from "@/lib/format"
import { SettingsForm } from "./settings-form"

export const metadata: Metadata = { title: "Settings" }

const DAY = 24 * 60 * 60 * 1000

export default async function SettingsPage() {
  const viewer = await getViewer()
  if (!viewer?.onboarding_complete) redirect("/sign-in?next=/settings")
  const supabase = await createClient()
  const [{ data: profile }, { data: prefs }, { data: expert }, { data: sanctions }] = await Promise.all([
    supabase.from("profiles").select("display_name, display_name_changed_at, hide_activity").eq("user_id", viewer.user_id).single(),
    supabase.from("notification_prefs").select("kind, in_app, email").eq("user_id", viewer.user_id),
    viewer.role === "expert"
      ? supabase.from("expert_profiles").select("handle, bio, available, renewal_due").eq("user_id", viewer.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("member_sanctions")
      .select("id, kind, reason, until, appeal_status, created_at")
      .eq("user_id", viewer.user_id)
      .order("created_at", { ascending: false }),
  ])
  const changed = profile?.display_name_changed_at ? new Date(profile.display_name_changed_at).getTime() : 0
  const nextChange = changed && Date.now() - changed < 30 * DAY ? new Date(changed + 30 * DAY) : null

  return (
    <main className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-8">
      <h1 className="text-h1">Settings</h1>
      <SettingsForm
        displayName={profile?.display_name ?? ""}
        nextNameChange={nextChange?.toLocaleDateString("en-GB", { day: "numeric", month: "long" }) ?? null}
        hideActivity={!!profile?.hide_activity}
        prefs={NOTIFICATION_KINDS.map((kind) => {
          const saved = prefs?.find((p) => p.kind === kind)
          return { kind, ...NOTIFICATION_SETTINGS[kind], inApp: saved?.in_app ?? true, email: saved?.email ?? NOTIFICATION_SETTINGS[kind].email }
        })}
        sanctions={(sanctions ?? []).map((s) => ({
          id: s.id,
          kind: s.kind,
          reason: s.reason,
          until: s.until,
          appealStatus: s.appeal_status,
          at: new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long" }),
        }))}
        status={viewer.status}
        expert={expert ? { handle: expert.handle, bio: expert.bio ?? "", available: expert.available, renewalDue: expert.renewal_due } : null}
      />
    </main>
  )
}
