import type { Metadata } from "next"
import { BadgeCheckIcon, HeartIcon, MessageCircleIcon, PenLineIcon, SearchIcon, SearchXIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@meridianher/ui/components/input-group"
import { SPACE_ICONS, spaceToneStyle, type SpaceTone } from "@meridianher/ui/lib/spaces"
import { ExpertBadge } from "@meridianher/ui/patterns/badges"
import { EmptyState } from "@meridianher/ui/patterns/cards"
import { InitialAvatar, SpaceChip } from "@meridianher/ui/patterns/chips"
import { createClient } from "@meridianher/db/server"

import { getSpaces } from "@/lib/data"
import { EXPERT_CATEGORY_LABELS, timeAgo } from "@/lib/format"
import { SortTabs } from "@/components/sort-tabs"

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = (await searchParams).q
  return { title: typeof q === "string" && q ? `Search: ${q}` : "Search", robots: { index: false } }
}

/** ts_headline wraps matches in << and >>; render them as marks, never as HTML. */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(/(<<.*?>>)/g).map((part, i) =>
        part.startsWith("<<") && part.endsWith(">>") ? (
          <mark key={i} className="rounded-xs bg-primary/15 px-0.5 text-foreground">
            {part.slice(2, -2)}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

const POPULAR = ["Late period", "Period pain", "Trying to conceive", "Morning sickness", "Hot flushes", "PCOS", "Anxiety before my period"]

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 120) : ""
  const space = typeof params.space === "string" ? params.space : undefined
  const sort = params.sort === "new" ? "new" : "relevance"
  const spaces = await getSpaces()
  const supabase = await createClient()

  const link = (next: { space?: string | null; sort?: string }) => {
    const u = new URLSearchParams({ q })
    const s = next.space === undefined ? space : next.space
    if (s) u.set("space", s)
    if ((next.sort ?? sort) === "new") u.set("sort", "new")
    return `/search?${u}`
  }

  const like = `%${q.replace(/[%_,()]/g, " ")}%`
  const [posts, experts] = q
    ? await Promise.all([
        supabase.rpc("search_posts", { query: q, in_space: space, newest: sort === "new", max_results: 30 }),
        supabase
          .from("public_experts")
          .select("handle, public_name, title, category, specialties")
          .or(`public_name.ilike.${like},title.ilike.${like}`)
          .limit(4),
      ])
    : [{ data: [] }, { data: [] }]
  const results = posts.data ?? []
  const lower = q.toLowerCase()
  const matchingSpaces = q
    ? spaces.filter((s) => s.name.toLowerCase().includes(lower) || s.tags.some((t) => t.toLowerCase().includes(lower)))
    : []
  const nothing = q && !results.length && !matchingSpaces.length && !experts.data?.length

  return (
    <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-4 py-8">
      <h1 className="sr-only">Search</h1>
      <form action="/search" role="search">
        {space ? <input type="hidden" name="space" value={space} /> : null}
        <InputGroup className="h-12">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            name="q"
            type="search"
            defaultValue={q}
            autoFocus={!q}
            placeholder="Search questions and answers"
            aria-label="Search questions and answers"
            className="text-base"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" variant="default" size="sm">
              Search
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>

      {!q ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Others often look for</CardTitle>
            <CardDescription>Your searches are never linked to your account.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {POPULAR.map((term) => (
              <ButtonLink key={term} variant="outline" size="sm" href={`/search?q=${encodeURIComponent(term)}`}>
                {term}
              </ButtonLink>
            ))}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <nav aria-label="Filter by space" className="flex gap-1.5 overflow-x-auto pb-1">
              <ButtonLink size="sm" variant={space ? "ghost" : "secondary"} href={link({ space: null })} aria-current={space ? undefined : "page"}>
                All spaces
              </ButtonLink>
              {spaces.map((s) => (
                <ButtonLink
                  key={s.slug}
                  size="sm"
                  variant={space === s.slug ? "secondary" : "ghost"}
                  aria-current={space === s.slug ? "page" : undefined}
                  href={link({ space: s.slug })}
                  className="shrink-0"
                >
                  {s.name}
                </ButtonLink>
              ))}
            </nav>
            <div className="flex items-center justify-between gap-2">
              <p role="status" className="text-small text-muted-foreground">
                {results.length === 30 ? "30 or more" : results.length} {results.length === 1 ? "post" : "posts"} for “{q}”
              </p>
              <SortTabs
                label="Sort results"
                current={sort}
                options={[
                  { value: "relevance", label: "Best match", href: link({ sort: "relevance" }) },
                  { value: "new", label: "Newest", href: link({ sort: "new" }) },
                ]}
              />
            </div>
          </div>

          {matchingSpaces.length || experts.data?.length ? (
            <div className="flex flex-wrap gap-2">
              {matchingSpaces.map((s) => {
                const Icon = SPACE_ICONS[s.icon] ?? HeartIcon
                return (
                  <ButtonLink key={s.slug} variant="outline" href={`/s/${s.slug}`} style={spaceToneStyle(s.accent_color as SpaceTone)}>
                    <Icon data-icon="inline-start" className="text-(--tone-ink)" aria-hidden />
                    {s.name}
                  </ButtonLink>
                )
              })}
              {experts.data?.map((e) => (
                <ButtonLink key={e.handle} variant="outline" href={`/e/${e.handle}`}>
                  <BadgeCheckIcon data-icon="inline-start" className="text-expert" aria-hidden />
                  {e.public_name}, {EXPERT_CATEGORY_LABELS[e.category ?? "other"]}
                </ButtonLink>
              ))}
            </div>
          ) : null}

          {nothing ? (
            <EmptyState
              icon={SearchXIcon}
              title="No posts match that yet"
              description="Try fewer or simpler words, or check the spelling. If nobody has asked it yet, you could be the first."
              action={
                <ButtonLink href="/ask">
                  <PenLineIcon data-icon="inline-start" aria-hidden />
                  Ask this question
                </ButtonLink>
              }
            />
          ) : (
            <ol className="flex flex-col gap-3">
              {results.map((r) => (
                <li key={r.id}>
                  <Card size="sm" className="relative focus-within:ring-3 focus-within:ring-ring">
                    <CardHeader className="gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <SpaceChip name={r.space_name} tone={r.space_tone as SpaceTone} />
                        {timeAgo(r.created_at)}
                        {r.has_expert_answer ? <ExpertBadge /> : null}
                      </div>
                      <CardTitle className="text-h3">
                        <a href={`/p/${r.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                          {r.title}
                        </a>
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-body">
                        <Highlighted text={r.snippet} />
                      </CardDescription>
                    </CardHeader>
                    {r.reply_snippet ? (
                      <CardContent>
                        <p className="flex gap-2 border-l-2 border-border pl-3 text-small text-muted-foreground">
                          <MessageCircleIcon className="mt-0.5 size-4 shrink-0" aria-label="In a reply" />
                          <span className="line-clamp-2">
                            <Highlighted text={r.reply_snippet} />
                          </span>
                        </p>
                      </CardContent>
                    ) : null}
                    <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                      <InitialAvatar name={r.author_name} size="sm" />
                      {r.author_name} · {r.reply_count} {r.reply_count === 1 ? "reply" : "replies"}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </main>
  )
}
