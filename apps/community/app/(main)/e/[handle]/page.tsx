import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BadgeCheckIcon, CalendarCheckIcon, MapPinIcon, MessageSquareTextIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { plainText } from "@meridianher/ui/lib/rich-text"
import type { JSONContent } from "@meridianher/ui/patterns/rich-text-editor"
import { VerifiedTick } from "@meridianher/ui/patterns/badges"
import { EmptyState } from "@meridianher/ui/patterns/cards"
import { InitialAvatar } from "@meridianher/ui/patterns/chips"
import { createClient } from "@meridianher/db/server"

import { EXPERT_CATEGORY_LABELS, timeAgo } from "@/lib/format"

async function loadExpert(handle: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("public_experts").select("*").eq("handle", handle.toLowerCase()).maybeSingle()
  return data
}

export async function generateMetadata({ params }: PageProps<"/e/[handle]">): Promise<Metadata> {
  const expert = await loadExpert((await params).handle)
  return expert
    ? { title: `${expert.public_name}, ${expert.title}`, description: expert.bio ?? undefined }
    : { title: "Expert not found" }
}

export default async function ExpertPage({ params }: PageProps<"/e/[handle]">) {
  const expert = await loadExpert((await params).handle)
  if (!expert) notFound()
  const supabase = await createClient()
  const [{ data: answers }, { count }] = await Promise.all([
    supabase
      .from("thread_replies")
      .select("id, post_id, body, created_at, reaction_counts")
      .eq("expert_handle", expert.handle!)
      .eq("is_expert_answer", true)
      .eq("removed", false)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("thread_replies").select("id", { count: "exact", head: true }).eq("expert_handle", expert.handle!).eq("removed", false),
  ])
  const { data: posts } = answers?.length
    ? await supabase.from("feed_posts").select("id, title, space_name").in("id", answers.map((a) => a.post_id!))
    : { data: [] }
  const verified = expert.verified_at
    ? new Date(expert.verified_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null

  return (
    <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-4 py-8">
      <Card>
        <CardHeader className="flex items-center gap-4">
          <InitialAvatar name={expert.public_name!} size="lg" />
          <div className="min-w-0">
            <CardTitle render={<h1 />} className="flex items-center gap-1.5 text-h1">
              {expert.public_name}
              <VerifiedTick />
            </CardTitle>
            <CardDescription className="text-body">{expert.title}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          <Badge variant="expert">{EXPERT_CATEGORY_LABELS[expert.category ?? "other"]}</Badge>
          {expert.specialties?.map((s) => (
            <Badge key={s} variant="tag">
              {s}
            </Badge>
          ))}
          {expert.available ? null : <Badge variant="secondary">Away for now</Badge>}
        </CardContent>
        {expert.bio ? (
          <CardContent>
            <p className="text-body">{expert.bio}</p>
          </CardContent>
        ) : null}
        <CardContent>
          <dl className="grid gap-3 text-small sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-expert" aria-hidden />
              <div>
                <dt className="text-muted-foreground">Verified with</dt>
                <dd className="font-medium">{expert.licensing_body}</dd>
              </div>
            </div>
            {verified ? (
              <div className="flex items-start gap-2">
                <CalendarCheckIcon className="mt-0.5 size-4 shrink-0 text-expert" aria-hidden />
                <div>
                  <dt className="text-muted-foreground">Verified in</dt>
                  <dd className="font-medium">{verified}</dd>
                </div>
              </div>
            ) : null}
            <div className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-expert" aria-hidden />
              <div>
                <dt className="text-muted-foreground">Practises in</dt>
                <dd className="font-medium">{expert.country}</dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      <section aria-labelledby="answers-title" className="flex flex-col gap-3">
        <h2 id="answers-title" className="text-h3">
          Answers <span className="font-normal text-muted-foreground">· {count ?? 0} in total</span>
        </h2>
        {answers?.length ? (
          <ol className="flex flex-col gap-3">
            {answers.map((a) => {
              const post = posts?.find((p) => p.id === a.post_id)
              return (
                <li key={a.id}>
                  <Card size="sm" className="relative focus-within:ring-3 focus-within:ring-ring">
                    <CardHeader>
                      <CardDescription className="text-xs">
                        {post?.space_name} · {timeAgo(a.created_at)}
                      </CardDescription>
                      <CardTitle className="text-h3">
                        <a href={`/p/${a.post_id}#reply-${a.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                          {post?.title ?? "A question"}
                        </a>
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-body">{plainText(a.body as JSONContent)}</CardDescription>
                    </CardHeader>
                  </Card>
                </li>
              )
            })}
          </ol>
        ) : (
          <EmptyState
            icon={MessageSquareTextIcon}
            title="No pinned answers yet"
            description={`Ask a question with Ask an expert switched on and ${expert.public_name} may answer it.`}
            action={<ButtonLink href="/ask">Ask a question</ButtonLink>}
          />
        )}
      </section>
      <p className="text-center text-small text-muted-foreground">
        Experts share general education, not a diagnosis. If you are worried, speak to a doctor who can examine you.
      </p>
    </main>
  )
}
