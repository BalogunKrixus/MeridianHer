import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { HeartIcon, PenLineIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { SPACE_ICONS, spaceToneStyle, type SpaceTone } from "@meridianher/ui/lib/spaces"
import { CrisisCard, GuidelinesCard } from "@meridianher/ui/patterns/cards"
import { createClient } from "@meridianher/db/server"

import { getCrisisResources, getFeed, getSpaces, getViewer, type FeedSort } from "@/lib/data"
import { FollowButton } from "@/components/follow-button"
import { PostList } from "@/components/post-list"
import { SortTabs } from "@/components/sort-tabs"
import { FeaturedExperts } from "@/components/featured-experts"
import { SpacesRail } from "@/components/spaces-rail"

const SORTS: { value: FeedSort; label: string }[] = [
  { value: "new", label: "New" },
  { value: "unanswered", label: "Unanswered" },
  { value: "expert", label: "Expert answered" },
]

async function findSpace(slug: string) {
  return (await getSpaces()).find((s) => s.slug === slug)
}

export async function generateMetadata({ params }: PageProps<"/s/[space]">): Promise<Metadata> {
  const space = await findSpace((await params).space)
  return space ? { title: space.name, description: space.description } : {}
}

export default async function SpacePage({ params, searchParams }: PageProps<"/s/[space]">) {
  const [{ space: slug }, query] = await Promise.all([params, searchParams])
  const space = await findSpace(slug)
  if (!space) notFound()

  const sort = SORTS.find((s) => s.value === query.sort)?.value ?? "new"
  const before = typeof query.before === "string" ? query.before : undefined
  const viewer = await getViewer()
  const supabase = await createClient()
  const [{ posts, nextBefore }, spaces, follow] = await Promise.all([
    getFeed({ sort, spaceId: space.id, before }),
    getSpaces(),
    viewer
      ? supabase.from("space_follows").select("id").eq("space_id", space.id).eq("user_id", viewer.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const Icon = SPACE_ICONS[space.icon] ?? HeartIcon
  const base = `/s/${space.slug}`

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,680px)_1fr]">
      <main className="flex min-w-0 flex-col gap-5">
        <Card style={spaceToneStyle(space.accent_color as SpaceTone)}>
          <CardHeader>
            <CardTitle render={<h1 />} className="flex items-center gap-2.5 text-h1">
              <Icon className="size-7 shrink-0 text-(--tone-ink)" aria-hidden />
              {space.name}
            </CardTitle>
            <CardDescription className="text-body">{space.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <ButtonLink variant="secondary" href={`/ask?space=${space.slug}`}>
              <PenLineIcon data-icon="inline-start" aria-hidden />
              Ask in this space
            </ButtonLink>
            <FollowButton spaceId={space.id} following={!!follow.data} />
          </CardContent>
        </Card>

        {space.show_crisis_card ? <CrisisCard compact countries={await getCrisisResources()} /> : null}

        <SortTabs current={sort} options={SORTS.map((s) => ({ ...s, href: s.value === "new" ? base : `${base}?sort=${s.value}` }))} />

        <PostList
          posts={posts}
          moreHref={nextBefore ? `${base}?sort=${sort}&before=${encodeURIComponent(nextBefore)}` : null}
          empty={
            sort === "unanswered"
              ? { title: "Every question here has a reply", description: "Check back later, or ask something new." }
              : {
                  title: `Start the conversation in ${space.name}`,
                  description: "Nobody has posted here yet. Ask a question or share your experience, anonymously if you like.",
                  action: { label: "Ask in this space", href: `/ask?space=${space.slug}` },
                }
          }
        />
      </main>
      <aside className="flex flex-col gap-4">
        {space.rules.length ? (
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-h3">Rules for this space</CardTitle>
              <CardDescription>On top of the five community guidelines.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1.5 pl-5 text-small">
                {space.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
        <SpacesRail spaces={spaces} current={space.slug} />
        <FeaturedExperts />
        <GuidelinesCard />
      </aside>
    </div>
  )
}
