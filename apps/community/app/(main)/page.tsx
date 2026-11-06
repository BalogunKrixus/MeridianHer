import { HeartIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@meridianher/ui/components/alert"
import { ButtonLink } from "@meridianher/ui/components/button"
import { GuidelinesCard } from "@meridianher/ui/patterns/cards"

import { getFeed, getSpaces, getViewer, type FeedSort } from "@/lib/data"
import { PostList } from "@/components/post-list"
import { SortTabs } from "@/components/sort-tabs"
import { FeaturedExperts } from "@/components/featured-experts"
import { SpacesRail } from "@/components/spaces-rail"

const SORTS: { value: FeedSort; label: string }[] = [
  { value: "for-you", label: "For you" },
  { value: "new", label: "New" },
  { value: "unanswered", label: "Unanswered" },
  { value: "expert", label: "Expert answered" },
]

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams
  const viewer = await getViewer()
  const member = !!viewer?.onboarding_complete
  const sorts = member ? SORTS : SORTS.filter((s) => s.value !== "for-you")
  const requested = typeof params.sort === "string" ? params.sort : undefined
  const sort = sorts.find((s) => s.value === requested)?.value ?? sorts[0].value
  const before = typeof params.before === "string" ? params.before : undefined

  const [{ posts, nextBefore }, spaces] = await Promise.all([getFeed({ sort, before }), getSpaces()])

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,680px)_1fr]">
      <main className="flex min-w-0 flex-col gap-5">
        {params.deleted ? (
          <Alert>
            <HeartIcon aria-hidden />
            <AlertTitle>Your account was deleted</AlertTitle>
            <AlertDescription>Thank you for being part of MeridianHer. You are welcome back any time.</AlertDescription>
          </Alert>
        ) : null}
        <header className="flex flex-col gap-3">
          {member ? (
            <h1 className="text-h1">Welcome back, {viewer.display_name}</h1>
          ) : (
            <>
              <h1 className="text-display">Every chapter of her life</h1>
              <p className="text-body text-muted-foreground">
                Ask what you have never felt able to ask out loud. Anonymous by default, with answers from women who have been there
                and from verified experts.
              </p>
            </>
          )}
        </header>

        <SortTabs current={sort} options={sorts.map((s) => ({ ...s, href: s.value === sorts[0].value ? "/" : `/?sort=${s.value}` }))} />

        <PostList
          posts={posts}
          moreHref={nextBefore ? `/?sort=${sort}&before=${encodeURIComponent(nextBefore)}` : null}
          empty={
            sort === "for-you"
              ? {
                  title: "Your spaces are quiet so far",
                  description: "Be the first to ask something in the spaces you follow, or follow more spaces from the list.",
                  action: { label: "Ask a question", href: "/ask" },
                }
              : sort === "unanswered"
                ? { title: "Every question has a reply", description: "Thank you to everyone who helped. Check back later for new questions." }
                : {
                    title: "No posts here yet",
                    description: "Start the conversation. Ask anything about your body or your health, anonymously if you like.",
                    action: { label: "Ask a question", href: "/ask" },
                  }
          }
        />
        {before ? (
          <ButtonLink variant="link" className="self-center" href={sort === sorts[0].value ? "/" : `/?sort=${sort}`}>
            Back to the newest
          </ButtonLink>
        ) : null}
      </main>
      <aside className="flex flex-col gap-4">
        <SpacesRail spaces={spaces} />
        <FeaturedExperts />
        <GuidelinesCard />
      </aside>
    </div>
  )
}
