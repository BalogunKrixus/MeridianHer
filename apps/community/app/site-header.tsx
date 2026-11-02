import { Button } from "@meridianher/ui/components/button"
import { InitialAvatar } from "@meridianher/ui/patterns/chips"
import { createClient } from "@meridianher/db/server"

import { signOut } from "./auth/actions"

export async function SiteHeader() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  const { data: profile } = userId
    ? await supabase.from("profiles").select("display_name").eq("user_id", userId).single()
    : { data: null }

  return (
    <header className="border-b">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <a href="/" className="mr-auto text-lg font-semibold tracking-tight">
          MeridianHer
        </a>
        {profile?.display_name ? (
          <>
            <InitialAvatar name={profile.display_name} size="sm" />
            <span className="text-sm font-medium">{profile.display_name}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <Button size="sm" render={<a href="/sign-in" />} nativeButton={false}>
            Sign in
          </Button>
        )}
      </nav>
    </header>
  )
}
