import type { Metadata } from "next"
import { HeartIcon } from "lucide-react"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { SPACE_ICONS, spaceToneStyle, type SpaceTone } from "@meridianher/ui/lib/spaces"
import { createClient } from "@meridianher/db/server"

import { getSpaces, getViewer } from "@/lib/data"
import { FollowButton } from "@/components/follow-button"

export const metadata: Metadata = {
  title: "Spaces",
  description: "Ten spaces for every chapter of women's health, from first periods to menopause.",
}

export default async function SpacesPage() {
  const [spaces, viewer] = await Promise.all([getSpaces(), getViewer()])
  const supabase = await createClient()
  const { data: follows } = viewer
    ? await supabase.from("space_follows").select("space_id").eq("user_id", viewer.user_id)
    : { data: [] }
  const followed = new Set((follows ?? []).map((f) => f.space_id))

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="max-w-2xl">
        <h1 className="text-h1">Spaces</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Follow the spaces that fit where you are now. They shape your home feed, and you can change them any time.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((s) => {
          const Icon = SPACE_ICONS[s.icon] ?? HeartIcon
          return (
            <li key={s.id} className="flex">
              <Card style={spaceToneStyle(s.accent_color as SpaceTone)} className="relative flex-1 focus-within:ring-3 focus-within:ring-ring">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-h3">
                    <Icon className="size-5 shrink-0 text-(--tone-ink)" aria-hidden />
                    <a href={`/s/${s.slug}`} className="underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none">
                      {s.name}
                    </a>
                  </CardTitle>
                  <CardAction className="relative z-10">
                    <FollowButton spaceId={s.id} following={followed.has(s.id)} size="sm" />
                  </CardAction>
                  <CardDescription>{s.description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
