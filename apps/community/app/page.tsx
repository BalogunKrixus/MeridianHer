import { HeartIcon } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { SPACE_ICONS, spaceToneStyle } from "@meridianher/ui/lib/spaces"
import { createClient } from "@meridianher/db/server"

import { SiteHeader } from "./site-header"

export default async function Home() {
  const supabase = await createClient()
  const { data: spaces } = await supabase.from("spaces").select("slug, name, description, icon, accent_color").order("sort_order")

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
        <header className="max-w-2xl">
          <h1 className="text-display">Every chapter of her life</h1>
          <p className="mt-3 text-body text-muted-foreground">
            Ask what you have never felt able to ask out loud. Anonymous by default, with answers from women who have been there and
            from verified experts.
          </p>
        </header>
        <section aria-labelledby="spaces-title" className="flex flex-col gap-4">
          <h2 id="spaces-title" className="text-h2">
            Spaces
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {(spaces ?? []).map((s) => {
              const Icon = SPACE_ICONS[s.icon] ?? HeartIcon
              return (
                <Card key={s.slug} render={<li />} style={spaceToneStyle(s.accent_color)}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-h3">
                      <Icon className="size-5 text-(--tone-ink)" aria-hidden />
                      {s.name}
                    </CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </ul>
        </section>
      </main>
    </>
  )
}
